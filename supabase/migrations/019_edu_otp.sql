-- ============================================================================
-- 심판(REF)·강사(INS)교육 본인조회 OTP  (ysakorea.com/apply/education/my)
--
-- 016_festprog.sql 의 OTP 부분(테이블 2개 + otp_set / otp_verify RPC + 레이트리밋)을
-- edu_ 접두로 그대로 복제한다. 교육 신청 데이터 자체는 cert-manager(golineup.kr) DB 에
-- 있고, 이 저장소 DB 에는 OTP 상태만 둔다.
--
--   1) 데이터는 격리 스키마 edu 에 둔다(PostgREST 노출 스키마 아님 → anon 키로 닿지 않음).
--   2) 접근은 public.edu_otp_set / public.edu_otp_verify SECURITY DEFINER 함수로만,
--      EXECUTE 는 service_role 에게만.
--   3) 락 네임스페이스는 'edu:otp:' — 서핑캠프·페스티벌 OTP 와 분리.
--   4) search_path 를 '' 로 고정하고 모든 객체를 스키마 수식한다.
--   5) 인증번호는 평문 저장 금지 — 앱이 HMAC 한 code_hash 만 저장한다.
--
-- ★ 이 파일은 다른 스키마·테이블을 건드리지 않는다.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS edu;

CREATE TABLE IF NOT EXISTS edu.otp (
  phone       TEXT PRIMARY KEY,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP 발송 레이트리밋 원장. 서버리스라 프로세스 메모리는 무의미 → DB 가 유일한 진실.
CREATE TABLE IF NOT EXISTS edu.otp_send_log (
  id       BIGSERIAL PRIMARY KEY,
  phone    TEXT NOT NULL,
  ip_hash  TEXT,
  sent_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS edu_otp_log_phone ON edu.otp_send_log (phone, sent_at DESC);
CREATE INDEX IF NOT EXISTS edu_otp_log_ip    ON edu.otp_send_log (ip_hash, sent_at DESC);
CREATE INDEX IF NOT EXISTS edu_otp_log_time  ON edu.otp_send_log (sent_at DESC);

-- RLS 를 켜고 정책을 하나도 만들지 않는다 → 소유자(postgres) 외 전부 거부.
-- ★ FORCE ROW LEVEL SECURITY 는 걸지 말 것(소유자까지 막혀 RPC 가 죽는다).
ALTER TABLE edu.otp          ENABLE ROW LEVEL SECURITY;
ALTER TABLE edu.otp_send_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA edu FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES    IN SCHEMA edu FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA edu FROM PUBLIC, anon, authenticated;

-- ── OTP 발송 (레이트리밋 + 코드 저장을 한 트랜잭션에서 원자적으로) ──────────
CREATE OR REPLACE FUNCTION public.edu_otp_set(
  p_phone TEXT, p_code_hash TEXT, p_ttl INT,
  p_cooldown_sec INT DEFAULT 60, p_max_hour INT DEFAULT 5, p_max_day INT DEFAULT 10,
  p_ip_hash TEXT DEFAULT NULL, p_ip_max_hour INT DEFAULT 15, p_global_max_hour INT DEFAULT 400)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_phone TEXT; v_last TIMESTAMPTZ; v_h INT; v_d INT; v_ip INT; v_g INT; v_wait INT;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  IF v_phone !~ '^0[0-9]{9,10}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_phone'); END IF;

  PERFORM pg_advisory_xact_lock(hashtext('edu:otp:' || v_phone));

  SELECT max(l.sent_at),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 hour'),
         count(*) FILTER (WHERE l.sent_at > now() - interval '1 day')
    INTO v_last, v_h, v_d
    FROM edu.otp_send_log l WHERE l.phone = v_phone;

  IF v_last IS NOT NULL AND v_last > now() - make_interval(secs => p_cooldown_sec) THEN
    v_wait := ceil(extract(epoch FROM (v_last + make_interval(secs => p_cooldown_sec)) - now()))::int;
    RETURN jsonb_build_object('ok', false, 'error', 'cooldown', 'retry_after', v_wait);
  END IF;
  IF v_h >= p_max_hour THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_hour', 'retry_after', 3600); END IF;
  IF v_d >= p_max_day THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_day',  'retry_after', 86400); END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip FROM edu.otp_send_log l
     WHERE l.ip_hash = p_ip_hash AND l.sent_at > now() - interval '1 hour';
    IF v_ip >= p_ip_max_hour THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_ip', 'retry_after', 3600); END IF;
  END IF;

  SELECT count(*) INTO v_g FROM edu.otp_send_log l
   WHERE l.sent_at > now() - interval '1 hour';
  IF v_g >= p_global_max_hour THEN         -- SOLAPI 요금 폭주 차단기
    RETURN jsonb_build_object('ok', false, 'error', 'rate_global', 'retry_after', 600); END IF;

  INSERT INTO edu.otp(phone, code_hash, expires_at, attempts, created_at)
  VALUES (v_phone, p_code_hash, now() + make_interval(secs => p_ttl), 0, now())
  ON CONFLICT (phone) DO UPDATE
    SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
        attempts = 0, created_at = now();

  INSERT INTO edu.otp_send_log(phone, ip_hash) VALUES (v_phone, p_ip_hash);

  IF random() < 0.01 THEN                  -- 기회적 청소
    DELETE FROM edu.otp_send_log WHERE sent_at < now() - interval '7 days';
    DELETE FROM edu.otp           WHERE expires_at < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object('ok', true, 'phone', v_phone);
END $$;

-- ── OTP 검증 (시도 5회 제한 / 성공·소진·만료 시 행 삭제) ────────────────────
CREATE OR REPLACE FUNCTION public.edu_otp_verify(p_phone TEXT, p_code_hash TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_phone TEXT; v_row edu.otp%ROWTYPE;
BEGIN
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  PERFORM pg_advisory_xact_lock(hashtext('edu:otp:' || v_phone));

  SELECT * INTO v_row FROM edu.otp o WHERE o.phone = v_phone FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_row.expires_at <= now() THEN
    DELETE FROM edu.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'expired'); END IF;
  IF v_row.attempts >= 5 THEN
    DELETE FROM edu.otp WHERE phone = v_phone;
    RETURN jsonb_build_object('ok', false, 'error', 'too_many_attempts'); END IF;

  IF v_row.code_hash = p_code_hash THEN
    DELETE FROM edu.otp WHERE phone = v_phone;                  -- 1회용
    RETURN jsonb_build_object('ok', true, 'phone', v_phone);
  END IF;

  UPDATE edu.otp SET attempts = attempts + 1 WHERE phone = v_phone;
  RETURN jsonb_build_object('ok', false, 'error', 'mismatch',
                            'attempts_left', 5 - (v_row.attempts + 1));
END $$;

-- ── 권한 하드닝 ─────────────────────────────────────────────────────────────
-- Postgres 는 함수 생성 시 EXECUTE 를 PUBLIC 에 기본 부여한다 → 반드시 회수.
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.edu_otp_set(text, text, int, int, int, int, text, int, int)',
    'public.edu_otp_verify(text, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
