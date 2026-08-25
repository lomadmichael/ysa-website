-- ============================================================================
-- 2026 양양서핑페스티벌 현장 프로그램 접수 (해변 바레 / 해변 하이록스)
--
-- 서핑캠프(009~015)의 보안·정합성 모델을 그대로 축소 복제한다.
--   1) 모든 데이터는 격리 스키마 festprog 에 둔다. PostgREST 노출 스키마(public)가
--      아니므로 anon/authenticated 키로는 테이블에 절대 닿을 수 없다.
--   2) 접근은 public.festprog_* SECURITY DEFINER 함수로만. 각 함수는
--      REVOKE ... FROM PUBLIC, anon, authenticated / GRANT ... TO service_role.
--   3) 정원 판정은 전 구간 pg_advisory_xact_lock 으로 직렬화한다.
--      ★ 락 키는 서핑캠프('surfcamp:2026')와 반드시 달라야 한다 →
--        'festprog:2026'. 같은 키를 쓰면 두 접수가 서로를 막는다.
--   4) search_path 를 '' 로 고정하고 모든 객체를 스키마 수식한다(권한 상승 방지).
--
-- 서핑캠프와 다른 점 (요구사항이 훨씬 단순하다)
--   · 신청 1건 = 참가자 1명 = 좌석 1석  → participant / signup 테이블이 없다.
--   · 프로그램 택1 · 전화번호 기준 활성 1건 → 바레 신청자는 하이록스에 재신청 불가.
--   · 승급은 batch 통째가 아니라 1건 단위 batch_seq ASC 선착순(전부-아니면-대기 불필요).
--   · 수정(update) RPC 가 없다. 바꾸려면 취소 후 재신청.
--
-- 온라인 정원 = 전체 정원의 80% (바레 15명 중 12명 / 하이록스 30명 중 24명).
-- 나머지는 당일 현장 선착순이라 이 시스템 밖에서 처리된다.
-- ============================================================================

-- ============================================================================
-- 1. 스키마 / 시퀀스 / 테이블 / 인덱스
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS festprog;

-- 대기열 순번. 신청 1건마다 하나씩 소비한다(= 접수순).
CREATE SEQUENCE IF NOT EXISTS festprog.batch_seq;

-- ── 설정(싱글턴) ─────────────────────────────────────────────────────────────
-- 오픈 여부·정원은 재배포 없이 관리자 화면에서 바꿀 수 있어야 한다.
CREATE TABLE IF NOT EXISTS festprog.config (
  id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  submissions_open  BOOLEAN NOT NULL DEFAULT false,
  barre_capacity    INT     NOT NULL DEFAULT 12 CHECK (barre_capacity >= 0),
  hyrox_capacity    INT     NOT NULL DEFAULT 24 CHECK (hyrox_capacity >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO festprog.config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── 신청 (1건 = 1명) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festprog.registration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  name            TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  -- 숫자만 정규화 저장(01012345678). 본인인증/중복판정의 키.
  phone           TEXT NOT NULL CHECK (phone ~ '^0[0-9]{9,10}$'),
  gender          TEXT NOT NULL CHECK (gender IN ('M','F')),
  program         TEXT NOT NULL CHECK (program IN ('barre','hyrox')),
  status          TEXT NOT NULL CHECK (status IN ('confirmed','waitlist','cancelled')),
  batch_seq       BIGINT NOT NULL,
  consent_privacy BOOLEAN NOT NULL DEFAULT false CHECK (consent_privacy),
  staff_note      TEXT,
  confirmed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  cancelled_by    TEXT CHECK (cancelled_by IN ('self','admin'))
);

-- 1인 1건 백스톱. RPC 가 advisory lock 안에서 먼저 검사하지만 인덱스로 한 번 더 막는다.
-- ★ program 이 아니라 phone 단독이다 — 프로그램 택1이므로 번호당 활성 1건만 존재한다.
CREATE UNIQUE INDEX IF NOT EXISTS festprog_reg_phone_active
  ON festprog.registration (phone) WHERE status <> 'cancelled';
-- 정원 카운트 / 승급 스캔용
CREATE INDEX IF NOT EXISTS festprog_reg_prog_status_seq
  ON festprog.registration (program, status, batch_seq);
CREATE INDEX IF NOT EXISTS festprog_reg_status_created
  ON festprog.registration (status, created_at);

-- ── OTP ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festprog.otp (
  phone       TEXT PRIMARY KEY,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP 발송 레이트리밋 원장. 서버리스라 프로세스 메모리는 무의미 → DB 가 유일한 진실.
CREATE TABLE IF NOT EXISTS festprog.otp_send_log (
  id       BIGSERIAL PRIMARY KEY,
  phone    TEXT NOT NULL,
  ip_hash  TEXT,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS festprog_otp_log_phone ON festprog.otp_send_log (phone, sent_at DESC);
CREATE INDEX IF NOT EXISTS festprog_otp_log_ip    ON festprog.otp_send_log (ip_hash, sent_at DESC);
CREATE INDEX IF NOT EXISTS festprog_otp_log_time  ON festprog.otp_send_log (sent_at DESC);

-- ── 감사 로그 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festprog.event_log (
  id              BIGSERIAL PRIMARY KEY,
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_id UUID,
  kind            TEXT NOT NULL,   -- submit / cancel / admin_cancel / promote / set_open / set_capacity
  detail          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS festprog_event_log_reg ON festprog.event_log (registration_id, at DESC);

-- ============================================================================
-- 2. RLS + 권한 회수
-- ============================================================================

-- RLS 를 켜고 정책을 하나도 만들지 않는다 → 소유자(postgres) 외 전부 거부.
-- SECURITY DEFINER 함수는 소유자 권한으로 도므로 정상 동작한다.
-- ★ FORCE ROW LEVEL SECURITY 는 절대 걸지 말 것(소유자까지 막혀 RPC 가 죽는다).
ALTER TABLE festprog.config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE festprog.registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE festprog.otp          ENABLE ROW LEVEL SECURITY;
ALTER TABLE festprog.otp_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE festprog.event_log    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA festprog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES    IN SCHEMA festprog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA festprog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA festprog FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. 내부 헬퍼 + 트리거 + 승급 루프
-- ============================================================================

CREATE OR REPLACE FUNCTION festprog.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS festprog_reg_touch ON festprog.registration;
CREATE TRIGGER festprog_reg_touch BEFORE UPDATE ON festprog.registration
FOR EACH ROW EXECUTE FUNCTION festprog.touch_updated_at();

/** 프로그램별 확정 좌석 수 */
CREATE OR REPLACE FUNCTION festprog.confirmed_count(p_program TEXT)
RETURNS INT LANGUAGE sql STABLE SET search_path TO '' AS $$
  SELECT count(*)::int FROM festprog.registration
   WHERE program = p_program AND status = 'confirmed';
$$;

/** 프로그램별 정원 */
CREATE OR REPLACE FUNCTION festprog.capacity_of(p_program TEXT)
RETURNS INT LANGUAGE sql STABLE SET search_path TO '' AS $$
  SELECT CASE p_program WHEN 'barre' THEN c.barre_capacity ELSE c.hyrox_capacity END
    FROM festprog.config c WHERE c.id = 1;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 대기 → 확정 자동 승급 루프.
--
-- 승급 단위 : 신청 1건(= 1명). 서핑캠프처럼 "가족 묶음 전부-아니면-대기"를 따질
--             필요가 없으므로 head-of-line blocking 자체가 생기지 않는다.
-- 승급 순서 : batch_seq ASC = 엄격한 접수 선착순.
-- 종료 조건 : 잔여좌석이 0 이거나 대기자가 없을 때.
--
-- ★ 불변식 P: 정원을 건드리는 모든 RPC(submit / cancel / set_capacity)는
--   커밋 전에 이 루프를 돌려 "빈자리가 있는데 대기자가 남아 있는 상태"를 없앤다.
--   반환값은 승급된 건들이며, 호출부(서버 액션)가 이 목록으로 승급 문자를 보낸다.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION festprog.promote_program(p_program TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE
  v_cap  INT;
  v_free INT;
  v_id   UUID;
  v_name TEXT;
  v_ph   TEXT;
  v_iter INT := 0;
  v_out  JSONB := '[]'::jsonb;
BEGIN
  v_cap := festprog.capacity_of(p_program);

  LOOP
    v_iter := v_iter + 1;
    EXIT WHEN v_iter > 1000;                     -- 무한루프 가드

    v_free := v_cap - festprog.confirmed_count(p_program);
    EXIT WHEN v_free <= 0;

    SELECT r.id, r.name, r.phone INTO v_id, v_name, v_ph
      FROM festprog.registration r
     WHERE r.program = p_program AND r.status = 'waitlist'
     ORDER BY r.batch_seq
     LIMIT 1;

    EXIT WHEN NOT FOUND;

    UPDATE festprog.registration
       SET status = 'confirmed', confirmed_at = now()
     WHERE id = v_id;

    v_out := v_out || jsonb_build_object(
      'registration_id', v_id,
      'program',         p_program,
      'name',            v_name,
      'phone',           v_ph);

    INSERT INTO festprog.event_log(registration_id, kind, detail)
    VALUES (v_id, 'promote', jsonb_build_object('program', p_program));
  END LOOP;

  RETURN v_out;
END $$;

/** 두 프로그램을 한 번에 승급 (불변식 P 복원용 단축) */
CREATE OR REPLACE FUNCTION festprog.promote_all()
RETURNS JSONB LANGUAGE sql SET search_path TO '' AS $$
  SELECT festprog.promote_program('barre') || festprog.promote_program('hyrox');
$$;

-- ============================================================================
-- 4. public.festprog_* RPC
--    모두 SECURITY DEFINER + SET search_path TO '' + 전 객체 스키마 수식.
-- ============================================================================

-- ── 4.1 잔여현황 ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_availability()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT jsonb_build_object(
    'open', c.submissions_open,
    'barre', jsonb_build_object(
      'capacity',  c.barre_capacity,
      'confirmed', (SELECT count(*) FROM festprog.registration r
                     WHERE r.program='barre' AND r.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM festprog.registration r
                     WHERE r.program='barre' AND r.status='waitlist')),
    'hyrox', jsonb_build_object(
      'capacity',  c.hyrox_capacity,
      'confirmed', (SELECT count(*) FROM festprog.registration r
                     WHERE r.program='hyrox' AND r.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM festprog.registration r
                     WHERE r.program='hyrox' AND r.status='waitlist')))
  FROM festprog.config c WHERE c.id = 1;
$$;

-- ── 4.2 접수 ─────────────────────────────────────────────────────────────────
-- payload: {"name":"홍길동","phone":"010-1234-5678","gender":"F",
--           "program":"barre","consent_privacy":true}
CREATE OR REPLACE FUNCTION public.festprog_submit(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_open     BOOLEAN;
  v_phone    TEXT;
  v_program  TEXT;
  v_gender   TEXT;
  v_name     TEXT;
  v_cap      INT;
  v_used     INT;
  v_status   TEXT;
  v_seq      BIGINT;
  v_id       UUID;
  v_dup      TEXT;
  v_promoted JSONB := '[]'::jsonb;
  v_ahead    INT;
BEGIN
  -- ── 0) payload 형태 검증 (쓰기 전 전량 검증) ────────────────────────────────
  v_name    := btrim(coalesce(payload->>'name',''));
  v_phone   := regexp_replace(coalesce(payload->>'phone',''), '\D', '', 'g');
  v_gender  := coalesce(payload->>'gender','');
  v_program := coalesce(payload->>'program','');

  IF v_name = '' OR length(v_name) > 40 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name'); END IF;
  IF v_phone !~ '^01[016789][0-9]{7,8}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone'); END IF;
  IF v_gender NOT IN ('M','F') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_gender'); END IF;
  IF v_program NOT IN ('barre','hyrox') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_program'); END IF;
  IF coalesce((payload->>'consent_privacy')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'consent_required'); END IF;

  -- ── 1) 정원/중복 판정 전 구간 직렬화 ────────────────────────────────────────
  PERFORM pg_advisory_xact_lock(hashtext('festprog:2026'));

  SELECT c.submissions_open INTO v_open FROM festprog.config c WHERE c.id = 1;
  IF NOT coalesce(v_open, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed'); END IF;

  -- ── 2) 1인 1건 (프로그램 택1) ───────────────────────────────────────────────
  SELECT r.program INTO v_dup FROM festprog.registration r
   WHERE r.phone = v_phone AND r.status <> 'cancelled' LIMIT 1;
  IF FOUND THEN
    -- 어느 프로그램에 신청돼 있는지 함께 돌려줘야 화면이 정확히 안내할 수 있다.
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_phone', 'program', v_dup);
  END IF;

  -- ── 3) 판정 전에 먼저 대기열을 소진시켜 불변식 P 를 복원한다 ────────────────
  --      (관리자 정원 증설 등으로 빈자리가 남아 있을 수 있다)
  v_promoted := festprog.promote_all();

  v_cap  := festprog.capacity_of(v_program);
  v_used := festprog.confirmed_count(v_program);
  v_status := CASE WHEN v_used < v_cap THEN 'confirmed' ELSE 'waitlist' END;
  v_seq := nextval('festprog.batch_seq');

  -- ── 4) 쓰기 ────────────────────────────────────────────────────────────────
  BEGIN
    INSERT INTO festprog.registration
      (name, phone, gender, program, status, batch_seq, consent_privacy, confirmed_at)
    VALUES
      (v_name, v_phone, v_gender, v_program, v_status, v_seq, true,
       CASE WHEN v_status = 'confirmed' THEN now() END)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_phone');
  END;

  IF v_status = 'waitlist' THEN
    SELECT count(*)::int INTO v_ahead FROM festprog.registration r
     WHERE r.program = v_program AND r.status = 'waitlist' AND r.batch_seq < v_seq;
  END IF;

  INSERT INTO festprog.event_log(registration_id, kind, detail)
  VALUES (v_id, 'submit', jsonb_build_object('program', v_program, 'status', v_status));

  RETURN jsonb_build_object(
    'ok', true,
    'registration_id', v_id,
    'name', v_name,
    'phone', v_phone,
    'program', v_program,
    'status', v_status,
    'wait_ahead', v_ahead,
    'promoted', v_promoted);
END $$;

-- ── 4.3 취소 ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_cancel(
  p_registration_id UUID,
  p_phone           TEXT,   -- OTP 인증 번호. NULL 이면 관리자 강제취소.
  p_reason          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_reg      festprog.registration%ROWTYPE;
  v_phone_in TEXT;
  v_promoted JSONB := '[]'::jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('festprog:2026'));

  SELECT * INTO v_reg FROM festprog.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  END IF;

  IF v_reg.status = 'cancelled' THEN
    -- 멱등: 이미 취소된 건은 성공으로 응답하되 승급은 일으키지 않는다.
    RETURN jsonb_build_object('ok', true, 'cancelled', false, 'promoted', '[]'::jsonb);
  END IF;

  UPDATE festprog.registration
     SET status = 'cancelled', cancelled_at = now(),
         cancel_reason = nullif(btrim(coalesce(p_reason,'')),''),
         cancelled_by  = CASE WHEN p_phone IS NULL THEN 'admin' ELSE 'self' END
   WHERE id = p_registration_id;

  -- 반납된 좌석을 대기열이 즉시 흡수 (불변식 P 복원)
  v_promoted := festprog.promote_all();

  INSERT INTO festprog.event_log(registration_id, kind, detail)
  VALUES (p_registration_id,
          CASE WHEN p_phone IS NULL THEN 'admin_cancel' ELSE 'cancel' END,
          jsonb_build_object('program', v_reg.program,
                             'was', v_reg.status, 'reason', p_reason));

  RETURN jsonb_build_object(
    'ok', true, 'cancelled', true,
    'name', v_reg.name, 'phone', v_reg.phone, 'program', v_reg.program,
    'was_status', v_reg.status,
    'promoted', v_promoted);
END $$;

-- ── 4.4 관리자 강제취소 (= 소유권 검사 없는 cancel) ──────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_force_cancel(
  p_registration_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.festprog_cancel(p_registration_id, NULL, p_reason);
$$;

-- ── 4.5 본인조회 ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_lookup_by_phone(p_phone TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at, 'updated_at', r.updated_at,
      'name', r.name, 'phone', r.phone, 'gender', r.gender,
      'program', r.program, 'status', r.status,
      -- 내 앞에 몇 명이 대기 중인지
      'wait_ahead', CASE WHEN r.status = 'waitlist' THEN (
        SELECT count(*) FROM festprog.registration r2
         WHERE r2.program = r.program AND r2.status = 'waitlist'
           AND r2.batch_seq < r.batch_seq) END) AS x
    FROM festprog.registration r
   WHERE r.phone = regexp_replace(p_phone, '\D', '', 'g')
     AND r.status <> 'cancelled') t;
$$;

-- ── 4.6 OTP 발송 (레이트리밋 + 코드 저장을 한 트랜잭션에서 원자적으로) ───────
CREATE OR REPLACE FUNCTION public.festprog_otp_set(
  p_phone TEXT, p_code_hash TEXT, p_ttl INT,
  p_cooldown_sec INT DEFAULT 60, p_max_hour INT DEFAULT 5, p_max_day INT DEFAULT 10,
  p_ip_hash TEXT DEFAULT NULL, p_ip_max_hour INT DEFAULT 15, p_global_max_hour INT DEFAULT 400)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_phone TEXT; v_last TIMESTAMPTZ; v_h INT; v_d INT; v_ip INT; v_g INT; v_wait INT;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  IF v_phone !~ '^0[0-9]{9,10}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone'); END IF;

  -- OTP 전용 락 네임스페이스 — 접수 트랜잭션 뒤에 줄서지 않게 분리
  PERFORM pg_advisory_xact_lock(hashtext('festprog:otp:' || v_phone));

  SELECT max(l.sent_at),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 hour'),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 day')
    INTO v_last, v_h, v_d
    FROM festprog.otp_send_log l WHERE l.phone = v_phone;

  IF v_last IS NOT NULL AND v_last > now() - make_interval(secs => p_cooldown_sec) THEN
    v_wait := ceil(extract(epoch FROM (v_last + make_interval(secs => p_cooldown_sec)) - now()))::int;
    RETURN jsonb_build_object('ok', false, 'error', 'cooldown', 'retry_after', v_wait);
  END IF;
  IF v_h >= p_max_hour THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_hour', 'retry_after', 3600); END IF;
  IF v_d >= p_max_day THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_day',  'retry_after', 86400); END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip FROM festprog.otp_send_log l
     WHERE l.ip_hash = p_ip_hash AND l.sent_at > now() - interval '1 hour';
    IF v_ip >= p_ip_max_hour THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_ip', 'retry_after', 3600); END IF;
  END IF;

  SELECT count(*) INTO v_g FROM festprog.otp_send_log l
   WHERE l.sent_at > now() - interval '1 hour';
  IF v_g >= p_global_max_hour THEN         -- SOLAPI 요금 폭주 차단기
    RETURN jsonb_build_object('ok', false, 'error', 'rate_global', 'retry_after', 600); END IF;

  INSERT INTO festprog.otp(phone, code_hash, expires_at, attempts, created_at)
  VALUES (v_phone, p_code_hash, now() + make_interval(secs => p_ttl), 0, now())
  ON CONFLICT (phone) DO UPDATE
    SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
        attempts = 0, created_at = now();

  INSERT INTO festprog.otp_send_log(phone, ip_hash) VALUES (v_phone, p_ip_hash);

  IF random() < 0.01 THEN                  -- 기회적 청소
    DELETE FROM festprog.otp_send_log WHERE sent_at < now() - interval '7 days';
    DELETE FROM festprog.otp           WHERE expires_at < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object('ok', true, 'phone', v_phone);
END $$;

-- ── 4.7 OTP 검증 (시도 5회 제한 / 성공·소진·만료 시 행 삭제) ────────────────
CREATE OR REPLACE FUNCTION public.festprog_otp_verify(p_phone TEXT, p_code_hash TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_phone TEXT; v_row festprog.otp%ROWTYPE;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  PERFORM pg_advisory_xact_lock(hashtext('festprog:otp:' || v_phone));

  SELECT * INTO v_row FROM festprog.otp o WHERE o.phone = v_phone FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_row.expires_at <= now() THEN
    DELETE FROM festprog.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  IF v_row.attempts >= 5 THEN
    DELETE FROM festprog.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts'); END IF;

  IF v_row.code_hash = p_code_hash THEN
    DELETE FROM festprog.otp WHERE phone = v_phone;             -- 1회용
    RETURN jsonb_build_object('ok', true, 'phone', v_phone);
  END IF;

  UPDATE festprog.otp SET attempts = attempts + 1 WHERE phone = v_phone;
  RETURN jsonb_build_object('ok', false, 'error', 'mismatch',
                            'attempts_left', 5 - (v_row.attempts + 1));
END $$;

-- ── 4.8 관리자 명단 ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_admin_list(p_include_cancelled BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'created_at'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at,
      'name', r.name, 'phone', r.phone, 'gender', r.gender,
      'program', r.program, 'status', r.status, 'batch_seq', r.batch_seq,
      'wait_ahead', CASE WHEN r.status = 'waitlist' THEN (
        SELECT count(*) FROM festprog.registration r2
         WHERE r2.program = r.program AND r2.status = 'waitlist'
           AND r2.batch_seq < r.batch_seq) END,
      'cancelled_at', r.cancelled_at, 'cancelled_by', r.cancelled_by,
      'cancel_reason', r.cancel_reason,
      -- 내부 운영 메모. 관리자 화면·CSV 에서만 쓴다.
      'staff_note', r.staff_note) AS x
    FROM festprog.registration r
   WHERE p_include_cancelled OR r.status <> 'cancelled') t;
$$;

-- ── 4.9 접수 오픈/마감 ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.festprog_set_open(p_open BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('festprog:2026'));
  UPDATE festprog.config SET submissions_open = p_open, updated_at = now() WHERE id = 1;
  INSERT INTO festprog.event_log(kind, detail) VALUES ('set_open', jsonb_build_object('open', p_open));
  RETURN jsonb_build_object('ok', true, 'open', p_open);
END $$;

-- ── 4.10 정원 조절 — 증설 시 즉시 승급까지 수행(불변식 P) ────────────────────
CREATE OR REPLACE FUNCTION public.festprog_set_capacity(p_barre INT, p_hyrox INT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_promoted JSONB;
BEGIN
  IF p_barre < 0 OR p_hyrox < 0 OR p_barre > 1000 OR p_hyrox > 1000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_capacity'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('festprog:2026'));
  UPDATE festprog.config
     SET barre_capacity = p_barre, hyrox_capacity = p_hyrox, updated_at = now()
   WHERE id = 1;
  v_promoted := festprog.promote_all();
  INSERT INTO festprog.event_log(kind, detail)
  VALUES ('set_capacity', jsonb_build_object('barre', p_barre, 'hyrox', p_hyrox));
  RETURN jsonb_build_object('ok', true, 'barre', p_barre, 'hyrox', p_hyrox,
                            'promoted', v_promoted);
END $$;

-- ── 4.11 수동 승급 (운영 예비용) ─────────────────────────────────────────────
-- 평상시엔 submit / cancel / set_capacity 안에서 자동으로 돌기 때문에 쓸 일이 없다.
-- 데이터를 손으로 고친 뒤 불변식 P 를 복원해야 할 때만 호출한다.
-- ★ 반환된 승급 건에는 문자가 자동으로 나가지 않는다. 호출부가 책임진다.
CREATE OR REPLACE FUNCTION public.festprog_promote(p_program TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_out JSONB;
BEGIN
  IF p_program IS NOT NULL AND p_program NOT IN ('barre','hyrox') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_program'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('festprog:2026'));
  v_out := CASE WHEN p_program IS NULL
                THEN festprog.promote_all()
                ELSE festprog.promote_program(p_program) END;
  RETURN jsonb_build_object('ok', true, 'promoted', v_out);
END $$;

-- ============================================================================
-- 5. 권한 하드닝 + PostgREST 스키마 리로드
-- ============================================================================

-- Postgres 는 함수 생성 시 EXECUTE 를 PUBLIC 에 기본 부여한다. 그대로 두면
-- anon 키만으로 PostgREST 를 통해 festprog_submit / festprog_admin_list 를
-- 호출할 수 있다. 반드시 회수한다. (시그니처를 정확히 일치시켜야 한다)
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.festprog_availability()',
    'public.festprog_submit(jsonb)',
    'public.festprog_cancel(uuid, text, text)',
    'public.festprog_force_cancel(uuid, text)',
    'public.festprog_lookup_by_phone(text)',
    'public.festprog_otp_set(text, text, int, int, int, int, text, int, int)',
    'public.festprog_otp_verify(text, text)',
    'public.festprog_admin_list(boolean)',
    'public.festprog_set_open(boolean)',
    'public.festprog_set_capacity(int, int)',
    'public.festprog_promote(text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- 내부 헬퍼는 public 에 노출하지 않는다.
-- ★ 2절의 REVOKE ... ON ALL FUNCTIONS IN SCHEMA festprog 는 3절보다 먼저 실행되므로
--   아래 함수들에는 적용되지 않는다(그때는 아직 존재하지 않는다). 개별 회수 필수.
REVOKE ALL ON FUNCTION festprog.promote_program(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION festprog.promote_all()         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION festprog.confirmed_count(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION festprog.capacity_of(text)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION festprog.touch_updated_at()    FROM PUBLIC, anon, authenticated;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
