-- ============================================================================
-- 2026 양양 서핑캠프 자체 접수 (양양군체육회 / 양양군서핑협회)
--
-- 설계 원칙
--  1) 모든 데이터는 격리 스키마 surfcamp 에 둔다. PostgREST 노출 스키마(public)에
--     포함되지 않으므로 anon/authenticated 키로는 테이블에 절대 닿을 수 없다.
--  2) 접근은 public.surfcamp_* SECURITY DEFINER 함수로만. 각 함수는
--     REVOKE ... FROM PUBLIC, anon, authenticated / GRANT ... TO service_role 로
--     잠근다. (레퍼런스 ecology_* 는 이 하드닝이 빠져 anon 이 호출 가능했다)
--  3) 정원 판정은 전 구간 pg_advisory_xact_lock 으로 직렬화한다.
--  4) search_path 를 '' 로 고정하고 모든 객체를 스키마 수식한다(권한 상승 방지).
--
-- 파일 구성 순서
--   1. 스키마 / 시퀀스 / 테이블 / 인덱스
--   2. RLS + 권한 회수
--   3. 내부 헬퍼 + 트리거 + surfcamp.promote_program
--   4. public.surfcamp_* RPC 11종
--   5. 권한 하드닝 DO 블록 + PostgREST 스키마 리로드
-- ============================================================================

-- ============================================================================
-- 1. 스키마 / 시퀀스 / 테이블 / 인덱스
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS surfcamp;

-- 대기열 순번용 시퀀스. "한 번의 작업으로 만들어진 (신청, 프로그램) 묶음" = batch.
-- batch 단위로 전부-아니면-대기 판정 / 승급이 이뤄진다.
CREATE SEQUENCE IF NOT EXISTS surfcamp.batch_seq;

-- ── 설정(싱글턴) ─────────────────────────────────────────────────────────────
-- 접수 오픈 여부와 정원은 재배포 없이 관리자 페이지에서 바꿀 수 있어야 한다.
CREATE TABLE IF NOT EXISTS surfcamp.config (
  id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  submissions_open  BOOLEAN NOT NULL DEFAULT false,
  capacity_lesson   INT     NOT NULL DEFAULT 200 CHECK (capacity_lesson  >= 0),
  capacity_special  INT     NOT NULL DEFAULT 300 CHECK (capacity_special >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO surfcamp.config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── 신청(대표자 단위) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surfcamp.registration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  rep_name        TEXT NOT NULL CHECK (length(btrim(rep_name)) BETWEEN 1 AND 40),
  -- 숫자만 정규화 저장(01012345678). 본인인증/중복판정의 키.
  phone           TEXT NOT NULL CHECK (phone ~ '^0[0-9]{9,10}$'),
  address         TEXT NOT NULL CHECK (length(btrim(address)) BETWEEN 1 AND 200),
  address_detail  TEXT,
  resident_type   TEXT NOT NULL CHECK (resident_type IN ('resident','life')),   -- 양양군민 / 양양 생활인구
  region          TEXT NOT NULL CHECK (region IN
                    ('ganghyeon','yangyang','sonyang','hyeonbuk','hyeonnam')),  -- 희망 강습권역(신청 단위 1택)
  lesson_time     TEXT NOT NULL CHECK (lesson_time IN ('13:00','15:00','any')), -- 희망 강습시간(신청 단위 1택)
  consent_privacy BOOLEAN NOT NULL DEFAULT false CHECK (consent_privacy),       -- 필수동의
  consent_notice  BOOLEAN NOT NULL DEFAULT false,
  consent_media   BOOLEAN NOT NULL DEFAULT false,
  note            TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  cancelled_by    TEXT CHECK (cancelled_by IN ('self','admin'))
);

-- 휴대폰 중복 방지 백스톱. RPC 가 advisory lock 안에서 먼저 검사하지만
-- 인덱스로 한 번 더 막는다(운영 중 수기 INSERT 사고 방지 포함).
CREATE UNIQUE INDEX IF NOT EXISTS surfcamp_reg_phone_active
  ON surfcamp.registration (phone) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS surfcamp_reg_status_created
  ON surfcamp.registration (status, created_at);
CREATE INDEX IF NOT EXISTS surfcamp_reg_region
  ON surfcamp.registration (region) WHERE status = 'active';

-- ── 참가자 ───────────────────────────────────────────────────────────────────
-- 삭제는 soft delete(removed_at). 하드 삭제하면 신청서 이력·감사 추적이 사라진다.
CREATE TABLE IF NOT EXISTS surfcamp.participant (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID NOT NULL REFERENCES surfcamp.registration(id) ON DELETE CASCADE,
  ordinal          INT  NOT NULL DEFAULT 0,
  name             TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 40),
  gender           TEXT NOT NULL CHECK (gender IN ('M','F')),
  age              INT  NOT NULL CHECK (age BETWEEN 1 AND 100),
  height_cm        INT  NOT NULL CHECK (height_cm BETWEEN 80 AND 230),
  weight_kg        INT  NOT NULL CHECK (weight_kg BETWEEN 10 AND 200),
  surf_exp         TEXT NOT NULL CHECK (surf_exp IN ('none','1-3','4+')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS surfcamp_part_reg
  ON surfcamp.participant (registration_id, ordinal);

-- ── 프로그램 신청(참가자 × 프로그램) ─────────────────────────────────────────
-- 정원은 "참가자 수"로 세므로 이 테이블의 confirmed 행 수 = 사용 좌석 수.
CREATE TABLE IF NOT EXISTS surfcamp.signup (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id  UUID NOT NULL REFERENCES surfcamp.registration(id) ON DELETE CASCADE,
  participant_id   UUID NOT NULL REFERENCES surfcamp.participant(id)  ON DELETE CASCADE,
  program          TEXT NOT NULL CHECK (program IN ('lesson','special')),
  -- lesson 일 때 registration.lesson_time 의 비정규화 사본.
  -- 지금은 정원 계산에 쓰지 않지만, 향후 "13시 100명 / 15시 100명"으로
  -- 쪼개달라는 요구가 오면 데이터 마이그레이션 없이 promote 키만 바꾸면 된다.
  slot             TEXT,
  status           TEXT NOT NULL CHECK (status IN ('confirmed','waitlist','cancelled')),
  batch_seq        BIGINT NOT NULL,               -- 대기열 순번(묶음 단위)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ
);

-- 한 참가자가 같은 프로그램에 활성 신청 2건을 가질 수 없다.
CREATE UNIQUE INDEX IF NOT EXISTS surfcamp_signup_active_uniq
  ON surfcamp.signup (participant_id, program) WHERE status <> 'cancelled';
-- 정원 카운트 / 승급 스캔용
CREATE INDEX IF NOT EXISTS surfcamp_signup_prog_status_batch
  ON surfcamp.signup (program, status, batch_seq);
CREATE INDEX IF NOT EXISTS surfcamp_signup_reg
  ON surfcamp.signup (registration_id, program, status);

-- ── OTP ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surfcamp.otp (
  phone       TEXT PRIMARY KEY,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP 발송 레이트리밋 원장. 서버리스라 프로세스 메모리 캐시는 무의미 → DB 가 유일한 진실.
CREATE TABLE IF NOT EXISTS surfcamp.otp_send_log (
  id       BIGSERIAL PRIMARY KEY,
  phone    TEXT NOT NULL,
  ip_hash  TEXT,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS surfcamp_otp_log_phone ON surfcamp.otp_send_log (phone, sent_at DESC);
CREATE INDEX IF NOT EXISTS surfcamp_otp_log_ip    ON surfcamp.otp_send_log (ip_hash, sent_at DESC);
CREATE INDEX IF NOT EXISTS surfcamp_otp_log_time  ON surfcamp.otp_send_log (sent_at DESC);

-- ── 감사 로그 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surfcamp.event_log (
  id              BIGSERIAL PRIMARY KEY,
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_id UUID,
  kind            TEXT NOT NULL,   -- submit / update / cancel / admin_cancel / promote / set_open / set_capacity
  detail          JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS surfcamp_event_log_reg ON surfcamp.event_log (registration_id, at DESC);

-- ============================================================================
-- 2. RLS + 권한 회수
-- ============================================================================

-- RLS 를 켜고 정책을 하나도 만들지 않는다 → 소유자(postgres) 외 전부 거부.
-- SECURITY DEFINER 함수는 소유자 권한으로 도므로 정상 동작한다.
-- ★ FORCE ROW LEVEL SECURITY 는 절대 걸지 말 것(소유자까지 막혀 RPC 가 죽는다).
ALTER TABLE surfcamp.config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.registration  ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.participant   ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.signup        ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.otp           ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.otp_send_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE surfcamp.event_log     ENABLE ROW LEVEL SECURITY;

-- 스키마 자체를 anon/authenticated 로부터 차단(이중 방어)
REVOKE ALL ON SCHEMA surfcamp FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES    IN SCHEMA surfcamp FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA surfcamp FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA surfcamp FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 3. 내부 헬퍼 + 트리거 + 승급 루프
-- ============================================================================

CREATE OR REPLACE FUNCTION surfcamp.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS surfcamp_reg_touch ON surfcamp.registration;
CREATE TRIGGER surfcamp_reg_touch BEFORE UPDATE ON surfcamp.registration
FOR EACH ROW EXECUTE FUNCTION surfcamp.touch_updated_at();

-- 서핑강습 자격(만 11세 이상 & 신장 130cm 이상) 하드 백스톱.
-- 요구사항 4는 client / server action / RPC 3중 검증을 요구하지만,
-- 트리거를 하나 더 두면 어떤 경로로 INSERT 해도 뚫리지 않는다.
CREATE OR REPLACE FUNCTION surfcamp.enforce_lesson_eligibility()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE v_age INT; v_h INT; v_name TEXT;
BEGIN
  IF NEW.program <> 'lesson' OR NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT p.age, p.height_cm, p.name INTO v_age, v_h, v_name
    FROM surfcamp.participant p WHERE p.id = NEW.participant_id;
  IF v_age < 11 OR v_h < 130 THEN
    RAISE EXCEPTION 'surfcamp_lesson_ineligible: % (age=%, height=%)', v_name, v_age, v_h
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS surfcamp_signup_elig ON surfcamp.signup;
CREATE TRIGGER surfcamp_signup_elig
BEFORE INSERT OR UPDATE OF program, status, participant_id ON surfcamp.signup
FOR EACH ROW EXECUTE FUNCTION surfcamp.enforce_lesson_eligibility();

-- 참가자 나이/신장을 낮춰 자격을 깨는 수정도 막는다.
CREATE OR REPLACE FUNCTION surfcamp.enforce_participant_eligibility()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  IF (NEW.age < 11 OR NEW.height_cm < 130)
     AND EXISTS (SELECT 1 FROM surfcamp.signup s
                  WHERE s.participant_id = NEW.id AND s.program = 'lesson' AND s.status <> 'cancelled')
  THEN
    RAISE EXCEPTION 'surfcamp_lesson_ineligible: %', NEW.name USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS surfcamp_part_elig ON surfcamp.participant;
CREATE TRIGGER surfcamp_part_elig
AFTER UPDATE OF age, height_cm ON surfcamp.participant
FOR EACH ROW EXECUTE FUNCTION surfcamp.enforce_participant_eligibility();

-- 프로그램별 확정 좌석 수
CREATE OR REPLACE FUNCTION surfcamp.confirmed_count(p_program TEXT)
RETURNS INT LANGUAGE sql STABLE SET search_path TO '' AS $$
  SELECT count(*)::int FROM surfcamp.signup
   WHERE program = p_program AND status = 'confirmed';
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 대기 → 확정 자동 승급 루프.
--
-- 승급 단위  : batch = "한 번의 작업으로 만들어진 (신청, 프로그램) 묶음".
-- 승급 순서  : batch_seq ASC = 그 수요가 발생한 순간의 엄격한 선착순.
--              (신청서 생성 시각이 아니라 '수요 생성 시각' 기준이라,
--               수정으로 추가된 인원만 맨 뒤로 가고 기존 대기 순번은 안 밀린다)
-- 적합 규칙  : size <= 잔여좌석 일 때만 통째로 승급(전부-아니면-대기).
--              안 들어가면 그 batch 는 '건너뛰고' 다음 batch 로 넘어간다.
--              (head-of-line blocking 을 허용하면 6인 가족 하나 때문에
--               남은 3석이 행사 끝까지 비게 된다 — 현장 운영자가 하는 판단과 동일)
-- 종료 조건  : 잔여좌석에 들어가는 대기 batch 가 하나도 없을 때.
--
-- ★ 불변식 P: 정원을 건드리는 모든 RPC 는 커밋 전에 이 루프를 돌려
--   "잔여좌석에 들어갈 수 있는 대기 batch 는 존재하지 않는다"를 복원한다.
--   수정(update)에서 "신청자의 신규 수요를 먼저 판정하고 그다음 승급"이
--   공정한 이유가 바로 이것이다. 불변식 P 하에서 신청자가 가져갈 수 있는
--   빈자리는 (a) 방금 본인이 반납한 자리, 또는 (b) 어떤 대기 batch 도
--   통째로는 못 쓰는 자투리 자리뿐이다.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION surfcamp.promote_program(p_program TEXT)
RETURNS JSONB LANGUAGE plpgsql SET search_path TO '' AS $$
DECLARE
  v_cap   INT;
  v_free  INT;
  v_batch BIGINT;
  v_reg   UUID;
  v_size  INT;
  v_iter  INT := 0;
  v_out   JSONB := '[]'::jsonb;
BEGIN
  SELECT CASE p_program WHEN 'lesson' THEN c.capacity_lesson ELSE c.capacity_special END
    INTO v_cap FROM surfcamp.config c WHERE c.id = 1;

  LOOP
    v_iter := v_iter + 1;
    EXIT WHEN v_iter > 1000;                       -- 무한루프 가드

    v_free := v_cap - surfcamp.confirmed_count(p_program);
    EXIT WHEN v_free <= 0;

    SELECT s.batch_seq, s.registration_id, count(*)::int
      INTO v_batch, v_reg, v_size
      FROM surfcamp.signup s
     WHERE s.program = p_program AND s.status = 'waitlist'
     GROUP BY s.batch_seq, s.registration_id
    HAVING count(*) <= v_free
     ORDER BY s.batch_seq
     LIMIT 1;

    EXIT WHEN NOT FOUND;

    UPDATE surfcamp.signup
       SET status = 'confirmed', confirmed_at = now()
     WHERE program = p_program AND status = 'waitlist' AND batch_seq = v_batch;

    v_out := v_out || jsonb_build_object(
      'registration_id', v_reg,
      'program',         p_program,
      'count',           v_size,
      'phone',           (SELECT r.phone    FROM surfcamp.registration r WHERE r.id = v_reg),
      'rep_name',        (SELECT r.rep_name FROM surfcamp.registration r WHERE r.id = v_reg));

    INSERT INTO surfcamp.event_log(registration_id, kind, detail)
    VALUES (v_reg, 'promote', jsonb_build_object('program', p_program, 'count', v_size, 'batch', v_batch));
  END LOOP;

  RETURN v_out;
END $$;

-- ============================================================================
-- 4. public.surfcamp_* RPC (11종)
--    모두 SECURITY DEFINER + SET search_path TO '' + 전 객체 스키마 수식.
-- ============================================================================

-- ── 4.1 잔여현황(폼 헤더에 표시) ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_availability()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT jsonb_build_object(
    'open', c.submissions_open,
    'lesson', jsonb_build_object(
      'capacity',  c.capacity_lesson,
      'confirmed', (SELECT count(*) FROM surfcamp.signup s WHERE s.program='lesson'  AND s.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='lesson'  AND s.status='waitlist')),
    'special', jsonb_build_object(
      'capacity',  c.capacity_special,
      'confirmed', (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='waitlist')))
  FROM surfcamp.config c WHERE c.id = 1;
$$;

-- ── 4.2 접수 ─────────────────────────────────────────────────────────────────
-- payload:
-- {
--   "rep_name":"홍길동","phone":"010-1234-5678","address":"(25000) 강원 양양군 …",
--   "address_detail":"101동 1001호","resident_type":"resident",
--   "region":"hyeonnam","lesson_time":"13:00",
--   "consent_privacy":true,"consent_notice":true,"consent_media":false,"note":"",
--   "participants":[
--     {"name":"홍길동","gender":"M","age":41,"height_cm":175,"weight_kg":72,
--      "surf_exp":"none","programs":["lesson","special"]}, …]
-- }
CREATE OR REPLACE FUNCTION public.surfcamp_submit(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_open           BOOLEAN;
  v_cap_l          INT;  v_cap_s  INT;
  v_used_l         INT;  v_used_s INT;
  v_need_l         INT := 0;  v_need_s INT := 0;
  v_status_l       TEXT; v_status_s TEXT;
  v_batch_l        BIGINT; v_batch_s BIGINT;
  v_promoted       JSONB := '[]'::jsonb;
  v_phone          TEXT;
  v_time           TEXT;
  v_reg_id         UUID;
  v_part_id        UUID;
  v_parts          JSONB := coalesce(payload->'participants','[]'::jsonb);
  v_n              INT   := jsonb_array_length(coalesce(payload->'participants','[]'::jsonb));
  v_i              INT;
  v_p              JSONB;
  v_progs          TEXT[];
  v_age INT; v_h INT; v_w INT;
BEGIN
  -- ── 0) payload 형태 검증 (쓰기 전 전량 검증: 여기서 return 해도 남는 게 없다) ──
  v_phone := regexp_replace(coalesce(payload->>'phone',''), '\D', '', 'g');
  v_time  := coalesce(payload->>'lesson_time','');

  IF v_n = 0 OR v_n > 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants'); END IF;
  IF length(v_phone) NOT BETWEEN 10 AND 11 OR v_phone !~ '^0[0-9]{9,10}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone'); END IF;
  IF btrim(coalesce(payload->>'rep_name','')) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_rep_name'); END IF;
  IF btrim(coalesce(payload->>'address','')) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_address'); END IF;
  IF coalesce((payload->>'consent_privacy')::boolean, false) IS NOT TRUE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'consent_required'); END IF;
  IF coalesce(payload->>'resident_type','') NOT IN ('resident','life') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_resident_type'); END IF;
  IF coalesce(payload->>'region','') NOT IN
       ('ganghyeon','yangyang','sonyang','hyeonbuk','hyeonnam') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_region'); END IF;
  IF v_time NOT IN ('13:00','15:00','any') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_lesson_time'); END IF;

  -- ── 1) 정원/중복 판정 전 구간 직렬화 ────────────────────────────────────────
  -- 프로그램이 2개라 락도 2개로 쪼갤 수 있지만, 한 신청이 두 프로그램을 동시에
  -- 건드리므로 락 순서 관리 비용 > 이득. 200/300명 규모에선 전역 락 1개가 정답.
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT c.submissions_open, c.capacity_lesson, c.capacity_special
    INTO v_open, v_cap_l, v_cap_s
    FROM surfcamp.config c WHERE c.id = 1;
  IF NOT coalesce(v_open, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed'); END IF;

  -- ── 2) 휴대폰 중복 (활성 신청 1건 원칙) ─────────────────────────────────────
  IF EXISTS (SELECT 1 FROM surfcamp.registration r
              WHERE r.phone = v_phone AND r.status = 'active') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate_phone');
  END IF;

  -- ── 3) 참가자 검증 + 프로그램별 수요 집계 (아직 쓰기 없음) ──────────────────
  FOR v_i IN 0 .. v_n - 1 LOOP
    v_p   := v_parts -> v_i;
    v_age := nullif(v_p->>'age','')::int;
    v_h   := nullif(v_p->>'height_cm','')::int;
    v_w   := nullif(v_p->>'weight_kg','')::int;

    IF btrim(coalesce(v_p->>'name','')) = '' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_participant_name'); END IF;
    IF coalesce(v_p->>'gender','') NOT IN ('M','F') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_gender', 'name', v_p->>'name'); END IF;
    IF v_age IS NULL OR v_age NOT BETWEEN 1 AND 100 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_age', 'name', v_p->>'name'); END IF;
    IF v_h IS NULL OR v_h NOT BETWEEN 80 AND 230 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_height', 'name', v_p->>'name'); END IF;
    IF v_w IS NULL OR v_w NOT BETWEEN 10 AND 200 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_weight', 'name', v_p->>'name'); END IF;
    IF coalesce(v_p->>'surf_exp','') NOT IN ('none','1-3','4+') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_surf_exp', 'name', v_p->>'name'); END IF;

    SELECT coalesce(array_agg(DISTINCT t.x), '{}'::text[]) INTO v_progs
      FROM jsonb_array_elements_text(coalesce(v_p->'programs','[]'::jsonb)) AS t(x);

    IF coalesce(array_length(v_progs,1),0) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no_program', 'name', v_p->>'name'); END IF;
    IF NOT (v_progs <@ ARRAY['lesson','special']::text[]) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_program'); END IF;

    IF 'lesson' = ANY(v_progs) THEN
      -- 요구사항 4: 서핑강습은 만 11세 이상 & 신장 130cm 이상
      IF v_age < 11 OR v_h < 130 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson',
                                  'name', v_p->>'name', 'age', v_age, 'height_cm', v_h);
      END IF;
      v_need_l := v_need_l + 1;
    END IF;
    IF 'special' = ANY(v_progs) THEN v_need_s := v_need_s + 1; END IF;
  END LOOP;

  -- ── 4) 판정 전에 먼저 대기열을 소진시켜 불변식 P 를 복원한다 ────────────────
  -- (관리자 정원 증설 / 이전 트랜잭션의 잔여분이 남아 있을 수 있다)
  v_promoted := surfcamp.promote_program('lesson') || surfcamp.promote_program('special');

  v_used_l := surfcamp.confirmed_count('lesson');
  v_used_s := surfcamp.confirmed_count('special');

  -- 프로그램별 전부-아니면-대기
  v_status_l := CASE WHEN v_need_l = 0 THEN NULL
                     WHEN v_used_l + v_need_l <= v_cap_l THEN 'confirmed'
                     ELSE 'waitlist' END;
  v_status_s := CASE WHEN v_need_s = 0 THEN NULL
                     WHEN v_used_s + v_need_s <= v_cap_s THEN 'confirmed'
                     ELSE 'waitlist' END;

  -- ── 5) 쓰기 ────────────────────────────────────────────────────────────────
  BEGIN
    INSERT INTO surfcamp.registration
      (rep_name, phone, address, address_detail, resident_type, region, lesson_time,
       consent_privacy, consent_notice, consent_media, note, status)
    VALUES
      (btrim(payload->>'rep_name'), v_phone, btrim(payload->>'address'),
       nullif(btrim(coalesce(payload->>'address_detail','')),''),
       payload->>'resident_type', payload->>'region', v_time,
       true,
       coalesce((payload->>'consent_notice')::boolean, false),
       coalesce((payload->>'consent_media')::boolean,  false),
       nullif(btrim(coalesce(payload->>'note','')),''), 'active')
    RETURNING id INTO v_reg_id;

    IF v_need_l > 0 THEN v_batch_l := nextval('surfcamp.batch_seq'); END IF;
    IF v_need_s > 0 THEN v_batch_s := nextval('surfcamp.batch_seq'); END IF;

    FOR v_i IN 0 .. v_n - 1 LOOP
      v_p := v_parts -> v_i;
      INSERT INTO surfcamp.participant
        (registration_id, ordinal, name, gender, age, height_cm, weight_kg, surf_exp)
      VALUES
        (v_reg_id, v_i, btrim(v_p->>'name'), v_p->>'gender', (v_p->>'age')::int,
         (v_p->>'height_cm')::int, (v_p->>'weight_kg')::int, v_p->>'surf_exp')
      RETURNING id INTO v_part_id;

      IF v_p->'programs' ? 'lesson' THEN
        INSERT INTO surfcamp.signup(registration_id, participant_id, program, slot, status, batch_seq, confirmed_at)
        VALUES (v_reg_id, v_part_id, 'lesson', v_time, v_status_l, v_batch_l,
                CASE WHEN v_status_l = 'confirmed' THEN now() END);
      END IF;
      IF v_p->'programs' ? 'special' THEN
        INSERT INTO surfcamp.signup(registration_id, participant_id, program, slot, status, batch_seq, confirmed_at)
        VALUES (v_reg_id, v_part_id, 'special', NULL, v_status_s, v_batch_s,
                CASE WHEN v_status_s = 'confirmed' THEN now() END);
      END IF;
    END LOOP;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'duplicate_phone');
    WHEN check_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson');
  END;

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (v_reg_id, 'submit', jsonb_build_object(
    'lesson',  jsonb_build_object('count', v_need_l, 'status', v_status_l),
    'special', jsonb_build_object('count', v_need_s, 'status', v_status_s)));

  RETURN jsonb_build_object(
    'ok', true,
    'registration_id', v_reg_id,
    'rep_name', btrim(payload->>'rep_name'),
    'phone', v_phone,
    'programs', jsonb_build_object(
      'lesson',  CASE WHEN v_need_l > 0
                      THEN jsonb_build_object('count', v_need_l, 'status', v_status_l) END,
      'special', CASE WHEN v_need_s > 0
                      THEN jsonb_build_object('count', v_need_s, 'status', v_status_s) END),
    'promoted', v_promoted);
END $$;

-- ── 4.3 수정 ─────────────────────────────────────────────────────────────────
-- payload = submit 과 동일하되:
--   * phone 은 무시(신원 키라 변경 불가 — 바꾸려면 취소 후 재신청)
--   * participants[].id 가 있으면 기존 참가자 수정, 없으면 신규 추가
--   * payload 에서 빠진 기존 참가자 = 삭제
--
-- 정원 재판정 규칙 (요구사항 8):
--   R1. 이미 confirmed 인 (참가자, 프로그램)은 편집을 거쳐도 confirmed 를 유지한다.
--       → 아예 건드리지 않는다. 지우고 다시 넣지 않는다.
--   R2. 제거된 신청은 cancelled 로 좌석을 반납한다.
--   R3. 신규 (참가자, 프로그램)만 잔여 정원과 대조해 판정한다.
--   R4. 단, 그 신청서가 해당 프로그램에 이미 '대기' batch 를 갖고 있으면
--       신규분은 판정 없이 그 batch 에 합류시킨다(batch_seq 공유).
--       → 대기 중인 가족이 인원을 추가했다고 반쪽만 승급되는 일이 없고,
--         원래 대기 순번도 그대로 유지된다.
--   R5. 순서: 반납 → 신규 판정 → 승급 루프. 불변식 P 덕분에 공정하다
--       (위 promote_program 주석 참조).
CREATE OR REPLACE FUNCTION public.surfcamp_update(
  p_registration_id UUID,
  p_phone           TEXT,          -- OTP 로 인증된 번호. NULL 이면 관리자 경로.
  payload           JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_open      BOOLEAN;
  v_cap_l     INT; v_cap_s INT;
  v_reg       surfcamp.registration%ROWTYPE;
  v_phone_in  TEXT;
  v_time      TEXT;
  v_parts     JSONB := coalesce(payload->'participants','[]'::jsonb);
  v_n         INT   := jsonb_array_length(coalesce(payload->'participants','[]'::jsonb));
  v_i         INT;
  v_p         JSONB;
  v_progs     TEXT[];
  v_age INT; v_h INT; v_w INT;
  v_pid       UUID;
  v_keep      UUID[] := '{}';
  -- want = { "<participant uuid>": {"lesson":true,"special":false}, … }
  v_want      JSONB := '{}'::jsonb;
  v_freed_l   INT := 0; v_freed_s INT := 0;
  v_new_l     UUID[]; v_new_s UUID[];
  v_add_l     INT := 0; v_add_s INT := 0;
  v_batch     BIGINT;
  v_status    TEXT;
  v_used      INT;
  v_res_l     TEXT; v_res_s TEXT;
  v_promoted  JSONB := '[]'::jsonb;
BEGIN
  -- ── 0) payload 형태 검증 ────────────────────────────────────────────────────
  v_time := coalesce(payload->>'lesson_time','');
  IF v_n = 0 OR v_n > 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants'); END IF;
  IF btrim(coalesce(payload->>'rep_name','')) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_rep_name'); END IF;
  IF btrim(coalesce(payload->>'address','')) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_address'); END IF;
  IF coalesce(payload->>'region','') NOT IN
       ('ganghyeon','yangyang','sonyang','hyeonbuk','hyeonnam') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_region'); END IF;
  IF v_time NOT IN ('13:00','15:00','any') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_lesson_time'); END IF;
  IF coalesce(payload->>'resident_type','') NOT IN ('resident','life') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_resident_type'); END IF;

  -- ── 1) 직렬화 + 소유권 ──────────────────────────────────────────────────────
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT c.submissions_open, c.capacity_lesson, c.capacity_special
    INTO v_open, v_cap_l, v_cap_s FROM surfcamp.config c WHERE c.id = 1;

  SELECT * INTO v_reg FROM surfcamp.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND OR v_reg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
    -- 마감 후에는 본인 수정 불가(취소는 허용). 관리자(p_phone IS NULL)는 항상 가능.
    IF NOT coalesce(v_open, false) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'closed'); END IF;
  END IF;

  -- ── 2) 참가자 검증 + want 맵 구성 (여기까지 쓰기 없음) ──────────────────────
  FOR v_i IN 0 .. v_n - 1 LOOP
    v_p   := v_parts -> v_i;
    v_pid := nullif(v_p->>'id','')::uuid;
    v_age := nullif(v_p->>'age','')::int;
    v_h   := nullif(v_p->>'height_cm','')::int;
    v_w   := nullif(v_p->>'weight_kg','')::int;

    IF v_pid IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM surfcamp.participant pp
          WHERE pp.id = v_pid AND pp.registration_id = p_registration_id
            AND pp.removed_at IS NULL) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'unknown_participant');
    END IF;

    IF btrim(coalesce(v_p->>'name','')) = '' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_participant_name'); END IF;
    IF coalesce(v_p->>'gender','') NOT IN ('M','F') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_gender', 'name', v_p->>'name'); END IF;
    IF v_age IS NULL OR v_age NOT BETWEEN 1 AND 100 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_age', 'name', v_p->>'name'); END IF;
    IF v_h IS NULL OR v_h NOT BETWEEN 80 AND 230 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_height', 'name', v_p->>'name'); END IF;
    IF v_w IS NULL OR v_w NOT BETWEEN 10 AND 200 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_weight', 'name', v_p->>'name'); END IF;
    IF coalesce(v_p->>'surf_exp','') NOT IN ('none','1-3','4+') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_surf_exp', 'name', v_p->>'name'); END IF;

    SELECT coalesce(array_agg(DISTINCT t.x), '{}'::text[]) INTO v_progs
      FROM jsonb_array_elements_text(coalesce(v_p->'programs','[]'::jsonb)) AS t(x);
    IF coalesce(array_length(v_progs,1),0) = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no_program', 'name', v_p->>'name'); END IF;
    IF NOT (v_progs <@ ARRAY['lesson','special']::text[]) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_program'); END IF;
    IF 'lesson' = ANY(v_progs) AND (v_age < 11 OR v_h < 130) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson',
                                'name', v_p->>'name', 'age', v_age, 'height_cm', v_h);
    END IF;
  END LOOP;

  -- ── 3) 참가자 diff 적용 (수정 / 추가) ───────────────────────────────────────
  FOR v_i IN 0 .. v_n - 1 LOOP
    v_p   := v_parts -> v_i;
    v_pid := nullif(v_p->>'id','')::uuid;

    IF v_pid IS NULL THEN
      INSERT INTO surfcamp.participant
        (registration_id, ordinal, name, gender, age, height_cm, weight_kg, surf_exp)
      VALUES
        (p_registration_id, v_i, btrim(v_p->>'name'), v_p->>'gender', (v_p->>'age')::int,
         (v_p->>'height_cm')::int, (v_p->>'weight_kg')::int, v_p->>'surf_exp')
      RETURNING id INTO v_pid;
    ELSE
      UPDATE surfcamp.participant
         SET ordinal   = v_i,
             name      = btrim(v_p->>'name'),
             gender    = v_p->>'gender',
             age       = (v_p->>'age')::int,
             height_cm = (v_p->>'height_cm')::int,
             weight_kg = (v_p->>'weight_kg')::int,
             surf_exp  = v_p->>'surf_exp'
       WHERE id = v_pid;
    END IF;

    v_keep := v_keep || v_pid;
    v_want := v_want || jsonb_build_object(
      v_pid::text, jsonb_build_object(
        'lesson',  (v_p->'programs' ? 'lesson'),
        'special', (v_p->'programs' ? 'special')));
  END LOOP;

  -- ── 4) 반납 대상 집계(로그/문자용) → 반납 실행 ──────────────────────────────
  SELECT count(*) FILTER (WHERE s.program = 'lesson'),
         count(*) FILTER (WHERE s.program = 'special')
    INTO v_freed_l, v_freed_s
    FROM surfcamp.signup s
   WHERE s.registration_id = p_registration_id
     AND s.status = 'confirmed'
     AND coalesce(v_want #> ARRAY[s.participant_id::text, s.program], 'false'::jsonb)
         IS DISTINCT FROM 'true'::jsonb;

  -- 삭제된 참가자 soft delete
  UPDATE surfcamp.participant p
     SET removed_at = now()
   WHERE p.registration_id = p_registration_id
     AND p.removed_at IS NULL
     AND NOT (p.id = ANY(v_keep));

  -- 삭제된 참가자의 신청 + 프로그램 선택 해제분 → cancelled (R2)
  UPDATE surfcamp.signup s
     SET status = 'cancelled', cancelled_at = now()
   WHERE s.registration_id = p_registration_id
     AND s.status <> 'cancelled'
     AND coalesce(v_want #> ARRAY[s.participant_id::text, s.program], 'false'::jsonb)
         IS DISTINCT FROM 'true'::jsonb;

  -- 강습시간 변경 → 활성 lesson 신청의 slot 동기화
  IF v_time <> v_reg.lesson_time THEN
    UPDATE surfcamp.signup s SET slot = v_time
     WHERE s.registration_id = p_registration_id
       AND s.program = 'lesson' AND s.status <> 'cancelled';
  END IF;

  -- ── 5) 신규 (참가자, 프로그램) 산출 — R1 은 여기서 자동으로 지켜진다:
  --        이미 활성 신청이 있는 조합은 후보에서 제외되므로 손대지 않는다.
  SELECT array_agg(t.pid) INTO v_new_l FROM (
    SELECT (kv.key)::uuid AS pid
      FROM jsonb_each(v_want) kv
     WHERE (kv.value->>'lesson')::boolean
       AND NOT EXISTS (SELECT 1 FROM surfcamp.signup s
                        WHERE s.participant_id = (kv.key)::uuid
                          AND s.program = 'lesson' AND s.status <> 'cancelled')) t;
  SELECT array_agg(t.pid) INTO v_new_s FROM (
    SELECT (kv.key)::uuid AS pid
      FROM jsonb_each(v_want) kv
     WHERE (kv.value->>'special')::boolean
       AND NOT EXISTS (SELECT 1 FROM surfcamp.signup s
                        WHERE s.participant_id = (kv.key)::uuid
                          AND s.program = 'special' AND s.status <> 'cancelled')) t;

  v_add_l := coalesce(array_length(v_new_l,1), 0);
  v_add_s := coalesce(array_length(v_new_s,1), 0);

  -- ── 6) 신규분 판정 + 삽입 (R3 / R4) ─────────────────────────────────────────
  IF v_add_l > 0 THEN
    SELECT min(s.batch_seq) INTO v_batch FROM surfcamp.signup s
     WHERE s.registration_id = p_registration_id
       AND s.program = 'lesson' AND s.status = 'waitlist';
    IF v_batch IS NOT NULL THEN
      v_status := 'waitlist';                                     -- R4: 기존 대기 batch 에 합류
    ELSE
      v_used := surfcamp.confirmed_count('lesson');               -- 반납분이 이미 반영된 값
      v_status := CASE WHEN v_used + v_add_l <= v_cap_l THEN 'confirmed' ELSE 'waitlist' END;
      v_batch  := nextval('surfcamp.batch_seq');
    END IF;
    BEGIN
      INSERT INTO surfcamp.signup(registration_id, participant_id, program, slot, status, batch_seq, confirmed_at)
      SELECT p_registration_id, u, 'lesson', v_time, v_status, v_batch,
             CASE WHEN v_status = 'confirmed' THEN now() END
        FROM unnest(v_new_l) u;
    EXCEPTION WHEN check_violation THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson');
    END;
    v_res_l := v_status;
  END IF;

  IF v_add_s > 0 THEN
    SELECT min(s.batch_seq) INTO v_batch FROM surfcamp.signup s
     WHERE s.registration_id = p_registration_id
       AND s.program = 'special' AND s.status = 'waitlist';
    IF v_batch IS NOT NULL THEN
      v_status := 'waitlist';
    ELSE
      v_used := surfcamp.confirmed_count('special');
      v_status := CASE WHEN v_used + v_add_s <= v_cap_s THEN 'confirmed' ELSE 'waitlist' END;
      v_batch  := nextval('surfcamp.batch_seq');
    END IF;
    INSERT INTO surfcamp.signup(registration_id, participant_id, program, slot, status, batch_seq, confirmed_at)
    SELECT p_registration_id, u, 'special', NULL, v_status, v_batch,
           CASE WHEN v_status = 'confirmed' THEN now() END
      FROM unnest(v_new_s) u;
    v_res_s := v_status;
  END IF;

  -- 프로그램을 전부 해제해 빈 신청서가 되는 것은 허용하지 않는다(취소를 쓰게 한다).
  IF NOT EXISTS (SELECT 1 FROM surfcamp.signup s
                  WHERE s.registration_id = p_registration_id AND s.status <> 'cancelled') THEN
    RAISE EXCEPTION 'surfcamp_empty_registration' USING ERRCODE = 'check_violation';
  END IF;

  -- ── 7) 신청 단위 필드 갱신 ─────────────────────────────────────────────────
  UPDATE surfcamp.registration r
     SET rep_name       = btrim(payload->>'rep_name'),
         address        = btrim(payload->>'address'),
         address_detail = nullif(btrim(coalesce(payload->>'address_detail','')),''),
         resident_type  = payload->>'resident_type',
         region         = payload->>'region',
         lesson_time    = v_time,
         consent_media  = coalesce((payload->>'consent_media')::boolean, r.consent_media),
         note           = nullif(btrim(coalesce(payload->>'note','')),'')
   WHERE r.id = p_registration_id;

  -- ── 8) 반납된 좌석으로 대기열 승급 (R5) ────────────────────────────────────
  v_promoted := surfcamp.promote_program('lesson') || surfcamp.promote_program('special');

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id, 'update', jsonb_build_object(
    'freed',  jsonb_build_object('lesson', v_freed_l, 'special', v_freed_s),
    'added',  jsonb_build_object('lesson', v_add_l,   'special', v_add_s),
    'status', jsonb_build_object('lesson', v_res_l,   'special', v_res_s)));

  RETURN jsonb_build_object(
    'ok', true,
    'registration_id', p_registration_id,
    'changed', jsonb_build_object(
      'lesson',  jsonb_build_object('added', v_add_l, 'removed', v_freed_l, 'status', v_res_l),
      'special', jsonb_build_object('added', v_add_s, 'removed', v_freed_s, 'status', v_res_s)),
    'current', (SELECT jsonb_object_agg(g.program, g.j) FROM (
        SELECT s.program,
               jsonb_build_object(
                 'confirmed', count(*) FILTER (WHERE s.status = 'confirmed'),
                 'waitlist',  count(*) FILTER (WHERE s.status = 'waitlist')) AS j
          FROM surfcamp.signup s
         WHERE s.registration_id = p_registration_id AND s.status <> 'cancelled'
         GROUP BY s.program) g),
    'promoted', v_promoted);

EXCEPTION
  WHEN check_violation THEN
    -- 트랜잭션 전체가 롤백되므로 부분 수정이 남지 않는다.
    RETURN jsonb_build_object('ok', false, 'error',
      CASE WHEN SQLERRM LIKE '%empty_registration%' THEN 'empty_registration'
           ELSE 'ineligible_lesson' END);
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'conflict');
END $$;

-- ── 4.4 취소 ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_cancel(
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
  v_reg       surfcamp.registration%ROWTYPE;
  v_phone_in  TEXT;
  v_freed_l   INT; v_freed_s INT;
  v_promoted  JSONB := '[]'::jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT * INTO v_reg FROM surfcamp.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_reg.status <> 'active' THEN
    -- 멱등: 이미 취소된 건은 성공으로 응답하되 승급은 일으키지 않는다.
    RETURN jsonb_build_object('ok', true, 'cancelled', false, 'promoted', '[]'::jsonb); END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  END IF;

  SELECT count(*) FILTER (WHERE s.program = 'lesson'  AND s.status = 'confirmed'),
         count(*) FILTER (WHERE s.program = 'special' AND s.status = 'confirmed')
    INTO v_freed_l, v_freed_s
    FROM surfcamp.signup s WHERE s.registration_id = p_registration_id;

  UPDATE surfcamp.registration
     SET status = 'cancelled', cancelled_at = now(),
         cancel_reason = nullif(btrim(coalesce(p_reason,'')),''),
         cancelled_by  = CASE WHEN p_phone IS NULL THEN 'admin' ELSE 'self' END
   WHERE id = p_registration_id;

  UPDATE surfcamp.signup
     SET status = 'cancelled', cancelled_at = now()
   WHERE registration_id = p_registration_id AND status <> 'cancelled';

  -- 반납된 좌석을 대기열이 즉시 흡수 (불변식 P 복원)
  v_promoted := surfcamp.promote_program('lesson') || surfcamp.promote_program('special');

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id,
          CASE WHEN p_phone IS NULL THEN 'admin_cancel' ELSE 'cancel' END,
          jsonb_build_object('freed', jsonb_build_object('lesson', v_freed_l, 'special', v_freed_s),
                             'reason', p_reason));

  RETURN jsonb_build_object(
    'ok', true, 'cancelled', true,
    'rep_name', v_reg.rep_name, 'phone', v_reg.phone,
    'freed', jsonb_build_object('lesson', v_freed_l, 'special', v_freed_s),
    'promoted', v_promoted);
END $$;

-- ── 4.5 본인조회: 활성 신청 1건(참가자·프로그램·대기순번 포함) ───────────────
CREATE OR REPLACE FUNCTION public.surfcamp_lookup_by_phone(p_phone TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at, 'updated_at', r.updated_at,
      'rep_name', r.rep_name, 'phone', r.phone,
      'address', r.address, 'address_detail', r.address_detail,
      'resident_type', r.resident_type, 'region', r.region, 'lesson_time', r.lesson_time,
      'consent_media', r.consent_media, 'note', r.note, 'status', r.status,
      'participants', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', p.id, 'name', p.name, 'gender', p.gender, 'age', p.age,
                 'height_cm', p.height_cm, 'weight_kg', p.weight_kg, 'surf_exp', p.surf_exp,
                 'signups', coalesce((
                   SELECT jsonb_agg(jsonb_build_object(
                            'program', s.program, 'status', s.status, 'slot', s.slot,
                            -- 내 앞에 몇 명이 대기 중인지
                            'wait_ahead', CASE WHEN s.status = 'waitlist' THEN (
                              SELECT count(*) FROM surfcamp.signup s2
                               WHERE s2.program = s.program AND s2.status = 'waitlist'
                                 AND s2.batch_seq < s.batch_seq) END))
                     FROM surfcamp.signup s
                    WHERE s.participant_id = p.id AND s.status <> 'cancelled'), '[]'::jsonb))
               ORDER BY p.ordinal)
          FROM surfcamp.participant p
         WHERE p.registration_id = r.id AND p.removed_at IS NULL), '[]'::jsonb)) AS x
    FROM surfcamp.registration r
   WHERE r.phone = regexp_replace(p_phone, '\D', '', 'g') AND r.status = 'active') t;
$$;

-- ── 4.6 OTP 발송 (레이트리밋 + 코드 저장을 한 트랜잭션에서 원자적으로) ───────
CREATE OR REPLACE FUNCTION public.surfcamp_otp_set(
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
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:otp:' || v_phone));

  SELECT max(l.sent_at),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 hour'),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 day')
    INTO v_last, v_h, v_d
    FROM surfcamp.otp_send_log l WHERE l.phone = v_phone;

  IF v_last IS NOT NULL AND v_last > now() - make_interval(secs => p_cooldown_sec) THEN
    v_wait := ceil(extract(epoch FROM (v_last + make_interval(secs => p_cooldown_sec)) - now()))::int;
    RETURN jsonb_build_object('ok', false, 'error', 'cooldown', 'retry_after', v_wait);
  END IF;
  IF v_h >= p_max_hour THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_hour',  'retry_after', 3600); END IF;
  IF v_d >= p_max_day  THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_day',   'retry_after', 86400); END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip FROM surfcamp.otp_send_log l
     WHERE l.ip_hash = p_ip_hash AND l.sent_at > now() - interval '1 hour';
    IF v_ip >= p_ip_max_hour THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_ip', 'retry_after', 3600); END IF;
  END IF;

  SELECT count(*) INTO v_g FROM surfcamp.otp_send_log l
   WHERE l.sent_at > now() - interval '1 hour';
  IF v_g >= p_global_max_hour THEN         -- SOLAPI 요금 폭주 차단기
    RETURN jsonb_build_object('ok', false, 'error', 'rate_global', 'retry_after', 600); END IF;

  INSERT INTO surfcamp.otp(phone, code_hash, expires_at, attempts, created_at)
  VALUES (v_phone, p_code_hash, now() + make_interval(secs => p_ttl), 0, now())
  ON CONFLICT (phone) DO UPDATE
    SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
        attempts = 0, created_at = now();

  INSERT INTO surfcamp.otp_send_log(phone, ip_hash) VALUES (v_phone, p_ip_hash);

  IF random() < 0.01 THEN                  -- 기회적 청소
    DELETE FROM surfcamp.otp_send_log WHERE sent_at < now() - interval '7 days';
    DELETE FROM surfcamp.otp           WHERE expires_at < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object('ok', true, 'phone', v_phone);
END $$;

-- ── 4.7 OTP 검증 (시도 5회 제한 / 성공·소진·만료 시 행 삭제) ────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_otp_verify(p_phone TEXT, p_code_hash TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_phone TEXT; v_row surfcamp.otp%ROWTYPE;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:otp:' || v_phone));

  SELECT * INTO v_row FROM surfcamp.otp o WHERE o.phone = v_phone FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_row.expires_at <= now() THEN
    DELETE FROM surfcamp.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  IF v_row.attempts >= 5 THEN
    DELETE FROM surfcamp.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts'); END IF;

  IF v_row.code_hash = p_code_hash THEN
    DELETE FROM surfcamp.otp WHERE phone = v_phone;             -- 1회용
    RETURN jsonb_build_object('ok', true, 'phone', v_phone);
  END IF;

  UPDATE surfcamp.otp SET attempts = attempts + 1 WHERE phone = v_phone;
  RETURN jsonb_build_object('ok', false, 'error', 'mismatch',
                            'attempts_left', 5 - (v_row.attempts + 1));
END $$;

-- ── 4.8 관리자 명단 ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_admin_list(p_include_cancelled BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'created_at'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at, 'rep_name', r.rep_name, 'phone', r.phone,
      'address', r.address, 'address_detail', r.address_detail,
      'resident_type', r.resident_type, 'region', r.region, 'lesson_time', r.lesson_time,
      'status', r.status, 'cancelled_at', r.cancelled_at, 'cancelled_by', r.cancelled_by,
      'consent_media', r.consent_media, 'note', r.note,
      'participants', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', p.id, 'name', p.name, 'gender', p.gender, 'age', p.age,
                 'height_cm', p.height_cm, 'weight_kg', p.weight_kg, 'surf_exp', p.surf_exp,
                 'lesson',  (SELECT s.status FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='lesson'  AND s.status<>'cancelled'),
                 'special', (SELECT s.status FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='special' AND s.status<>'cancelled'))
               ORDER BY p.ordinal)
          FROM surfcamp.participant p
         WHERE p.registration_id = r.id AND p.removed_at IS NULL), '[]'::jsonb)) AS x
    FROM surfcamp.registration r
   WHERE p_include_cancelled OR r.status = 'active') t;
$$;

-- ── 4.9 관리자 강제 취소 (= 소유권 검사 없는 cancel) ─────────────────────────
-- 내부적으로 public.surfcamp_cancel 을 그대로 태우므로
-- 좌석 반납 → surfcamp.promote_program 승급 → 'promoted' 반환까지 동일하다(불변식 P).
CREATE OR REPLACE FUNCTION public.surfcamp_admin_cancel(p_registration_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $$
  SELECT public.surfcamp_cancel(p_registration_id, NULL, p_reason);
$$;

-- ── 4.10 접수 오픈/마감 ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_set_open(p_open BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));
  UPDATE surfcamp.config SET submissions_open = p_open, updated_at = now() WHERE id = 1;
  INSERT INTO surfcamp.event_log(kind, detail) VALUES ('set_open', jsonb_build_object('open', p_open));
  RETURN jsonb_build_object('ok', true, 'open', p_open);
END $$;

-- ── 4.11 정원 조절 — 증설 시 즉시 승급까지 수행(불변식 P) ────────────────────
CREATE OR REPLACE FUNCTION public.surfcamp_set_capacity(p_lesson INT, p_special INT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_promoted JSONB;
BEGIN
  IF p_lesson < 0 OR p_special < 0 OR p_lesson > 5000 OR p_special > 5000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_capacity'); END IF;
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));
  UPDATE surfcamp.config
     SET capacity_lesson = p_lesson, capacity_special = p_special, updated_at = now()
   WHERE id = 1;
  v_promoted := surfcamp.promote_program('lesson') || surfcamp.promote_program('special');
  INSERT INTO surfcamp.event_log(kind, detail)
  VALUES ('set_capacity', jsonb_build_object('lesson', p_lesson, 'special', p_special));
  RETURN jsonb_build_object('ok', true, 'lesson', p_lesson, 'special', p_special, 'promoted', v_promoted);
END $$;

-- ============================================================================
-- 5. 권한 하드닝 + PostgREST 스키마 리로드
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- ★ 레퍼런스(ecology_*)에 빠져 있던 권한 하드닝.
--   Postgres 는 함수 생성 시 EXECUTE 를 PUBLIC 에 기본 부여한다. 그대로 두면
--   anon 키만 있어도 PostgREST 로 surfcamp_submit / surfcamp_admin_list 를
--   그냥 호출할 수 있다. 반드시 회수한다. (시그니처 정확히 일치시켜야 함)
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_availability()',
    'public.surfcamp_submit(jsonb)',
    'public.surfcamp_update(uuid, text, jsonb)',
    'public.surfcamp_cancel(uuid, text, text)',
    'public.surfcamp_lookup_by_phone(text)',
    'public.surfcamp_otp_set(text, text, int, int, int, int, text, int, int)',
    'public.surfcamp_otp_verify(text, text)',
    'public.surfcamp_admin_list(boolean)',
    'public.surfcamp_admin_cancel(uuid, text)',
    'public.surfcamp_set_open(boolean)',
    'public.surfcamp_set_capacity(int, int)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- 내부 헬퍼는 public 에 노출하지 않는다.
-- ★ 위쪽(2절)의 REVOKE ... ON ALL FUNCTIONS IN SCHEMA surfcamp 는 3절보다 먼저
--   실행되므로 여기 함수들에는 적용되지 않는다(그때는 아직 존재하지 않는다).
--   Postgres 는 함수 생성 시 EXECUTE 를 PUBLIC 에 기본 부여하므로,
--   트리거 함수까지 개별적으로 회수해야 실제로 잠긴다.
REVOKE ALL ON FUNCTION surfcamp.promote_program(text)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION surfcamp.confirmed_count(text)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION surfcamp.touch_updated_at()                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION surfcamp.enforce_lesson_eligibility()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION surfcamp.enforce_participant_eligibility() FROM PUBLIC, anon, authenticated;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
