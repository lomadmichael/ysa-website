-- ============================================================================
-- 2026 양양 서핑캠프 — 프로그램별 신규접수 게이트
--
-- 배경
--   접수 첫날 두 프로그램이 모두 정원을 채웠다.
--     서핑강습    확정 204 / 정원 204 / 대기 98
--     특화 체험   확정 322 / 정원 330 / 대기 0
--   발주처 결정은 다음과 같다.
--     · 서핑강습은 완전 마감 — 신규 신청을 받지 않는다.
--       단 기존 대기 98명은 그대로 두고, 취소가 나면 순번대로 자동 확정돼야 한다.
--     · 특화 체험은 확정+대기 합계 330명까지만 받는다.
--   지금까지는 전체 오픈/마감 스위치(submissions_open)와 프로그램별 정원밖에 없어
--   정원이 차면 대기가 무제한으로 쌓였다. 그래서 프로그램 단위 게이트를 만든다.
--
-- 설계
--   lesson_open / special_open        false 면 그 프로그램의 신규 신청을 막는다.
--   lesson_total_cap / special_total_cap
--                                     확정+대기 합계 상한. NULL 이면 무제한.
--
--   판정 순서 (신규 수요에만 적용)
--     1. *_open 이 false            → lesson_closed / special_closed
--     2. 확정+대기+이번 신청 > cap   → lesson_full   / special_full
--     3. 통과하면 기존 정원 판정(확정/대기) 로직을 그대로 탄다.
--
-- ★ 가장 중요한 경계 3가지
--   1) 게이트는 "신규 수요"에만 걸린다. 기존 대기자의 자동 승급
--      (surfcamp.promote_program)은 게이트를 보지 않는다 — 강습이 마감돼도
--      취소가 나면 대기 98명은 순번대로 확정돼야 한다.
--   2) 취소(surfcamp_cancel / surfcamp_admin_cancel)는 이 파일에서 건드리지 않는다.
--   3) 한 신청서에 두 프로그램이 섞여 있을 때 한쪽이 막혔다고 전체를 거부하지 않는다.
--      막힌 프로그램만 빼고 나머지는 접수한다. 요청한 프로그램이 전부 막힌 경우에만
--      거부하며, 둘 다 막혔으면 all_programs_closed 를 돌려준다.
--
-- ★ 게이트 판정은 전부 "쓰기 이전"에 끝낸다.
--   surfcamp_update 는 참가자 diff 를 적용한 뒤에야 신규 조합을 알 수 있는 구조지만,
--   여기서는 payload 만으로 신규 수요를 선집계(v_pre_l / v_pre_s)해 쓰기 전에 판정한다.
--   쓰기 이후에 RETURN 으로 거부하면 이미 반영된 참가자 수정이 그대로 커밋된다.
--
-- ★ 재정의하는 두 RPC(surfcamp_submit / surfcamp_update)의 본문은 012 와 동일하다.
--   자격 검사(만 10세·130cm) · 정원 판정 · 대기 승급 · 중복 검사 · batch 처리 ·
--   EXCEPTION 블록은 한 줄도 바꾸지 않았고, 게이트만 끼워 넣었다.
--   (운영 중 접수 로직이므로 한 줄이라도 달라지면 사고다)
--
-- ★ 게이트는 정원(capacity)과 다르다.
--   정원을 바꾸면 대기자가 승급되고 확정 문자가 나간다.
--   게이트는 정원을 건드리지 않으므로 승급도 문자도 발생하지 않는다.
--   그래서 surfcamp_set_program_gates 는 promote_program 을 호출하지 않는다.
--
-- 파일 구성 순서
--   1. surfcamp.config 컬럼 4개 추가
--   2. public.surfcamp_availability() 재정의 (프로그램별 open / total_cap / total_taken)
--   3. public.surfcamp_submit / public.surfcamp_update 재정의 (게이트만 추가)
--   4. public.surfcamp_set_program_gates 신규
--   5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- ============================================================================
-- 1. 스키마 변경
-- ============================================================================

ALTER TABLE surfcamp.config
  ADD COLUMN IF NOT EXISTS lesson_open       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS special_open      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS lesson_total_cap  INT,
  ADD COLUMN IF NOT EXISTS special_total_cap INT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'surfcamp_config_total_cap_chk') THEN
    ALTER TABLE surfcamp.config
      ADD CONSTRAINT surfcamp_config_total_cap_chk
      CHECK ((lesson_total_cap  IS NULL OR lesson_total_cap  >= 0)
         AND (special_total_cap IS NULL OR special_total_cap >= 0));
  END IF;
END $$;

COMMENT ON COLUMN surfcamp.config.lesson_open IS
  'false 면 서핑강습 신규 신청을 막는다. 기존 대기자의 자동 승급에는 영향이 없다.';
COMMENT ON COLUMN surfcamp.config.special_open IS
  'false 면 서핑 특화 체험 신규 신청을 막는다. 기존 대기자의 자동 승급에는 영향이 없다.';
COMMENT ON COLUMN surfcamp.config.lesson_total_cap IS
  '서핑강습 확정+대기 합계 상한. NULL 이면 무제한. 정원(capacity_lesson)과 달리 '
  '이 값을 바꿔도 승급/문자는 발생하지 않는다.';
COMMENT ON COLUMN surfcamp.config.special_total_cap IS
  '서핑 특화 체험 확정+대기 합계 상한. NULL 이면 무제한. 정원(capacity_special)과 달리 '
  '이 값을 바꿔도 승급/문자는 발생하지 않는다.';

-- ============================================================================
-- 2. 잔여현황 — 프로그램별 게이트 상태를 함께 돌려준다
-- ============================================================================
-- ★ 기존 키는 하나도 빼지 않는다. 화면들이 그대로 쓰고 있다.
--   최상위 : open / submissions_open / open_at / opens_in_seconds  (012 그대로)
--   프로그램: capacity / confirmed / waitlist                       (009 그대로)
--   프로그램 추가분(014)
--     open        : 그 프로그램의 개별 신규접수 스위치 (전체 오픈 여부와 별개)
--     total_cap   : 확정+대기 합계 상한 (NULL = 무제한)
--     total_taken : 현재 확정+대기 합계
CREATE OR REPLACE FUNCTION public.surfcamp_availability()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT jsonb_build_object(
    'open', (c.submissions_open AND (c.open_at IS NULL OR now() >= c.open_at)),
    'submissions_open', c.submissions_open,
    -- 세션 타임존에 흔들리지 않도록 UTC 로 고정 포맷한다.
    'open_at', CASE WHEN c.open_at IS NULL THEN NULL
                    ELSE to_char(c.open_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END,
    'opens_in_seconds', CASE WHEN c.open_at IS NOT NULL AND c.open_at > now()
                             THEN greatest(0, ceil(extract(epoch FROM c.open_at - now())))::int
                             ELSE NULL END,
    'lesson', jsonb_build_object(
      'capacity',  c.capacity_lesson,
      'confirmed', (SELECT count(*) FROM surfcamp.signup s WHERE s.program='lesson'  AND s.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='lesson'  AND s.status='waitlist'),
      'open',      c.lesson_open,
      'total_cap', c.lesson_total_cap,
      'total_taken', (SELECT count(*) FROM surfcamp.signup s
                       WHERE s.program='lesson'  AND s.status IN ('confirmed','waitlist'))),
    'special', jsonb_build_object(
      'capacity',  c.capacity_special,
      'confirmed', (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='waitlist'),
      'open',      c.special_open,
      'total_cap', c.special_total_cap,
      'total_taken', (SELECT count(*) FROM surfcamp.signup s
                       WHERE s.program='special' AND s.status IN ('confirmed','waitlist'))))
  FROM surfcamp.config c WHERE c.id = 1;
$$;

-- ============================================================================
-- 3. RPC 재정의 (012 본문 그대로 + 게이트만 추가)
-- ============================================================================

-- ── 3.1 접수 ─────────────────────────────────────────────────────────────────
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
  -- ★ 014 추가분: 프로그램별 게이트
  v_l_open         BOOLEAN; v_s_open      BOOLEAN;
  v_l_total_cap    INT;     v_s_total_cap INT;
  v_req_l          INT := 0;  v_req_s INT := 0;   -- 게이트 적용 전 원 수요
  v_block_l        TEXT;    v_block_s TEXT;       -- 막힌 사유(에러 코드) 또는 NULL
  v_take_l         BOOLEAN := false; v_take_s BOOLEAN := false;
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
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  -- ★ 012 변경점: 수동 스위치 원값이 아니라 "실질 오픈"을 읽는다.
  --   예약 시각(open_at)이 아직 안 지났으면 스위치가 켜져 있어도 닫힌 것으로 본다.
  -- ★ 014 변경점: 프로그램별 게이트 값을 같은 SELECT 로 함께 읽는다.
  SELECT (c.submissions_open AND (c.open_at IS NULL OR now() >= c.open_at)),
         c.capacity_lesson, c.capacity_special,
         c.lesson_open, c.special_open, c.lesson_total_cap, c.special_total_cap
    INTO v_open, v_cap_l, v_cap_s,
         v_l_open, v_s_open, v_l_total_cap, v_s_total_cap
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
      -- 서핑강습 하드 게이트: 만 10세 이상 AND 신장 130cm 이상 (둘 다 충족)
      IF v_age < 10 OR v_h < 130 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson',
                                  'name', v_p->>'name', 'age', v_age, 'height_cm', v_h);
      END IF;
      v_req_l := v_req_l + 1;
    END IF;
    IF 'special' = ANY(v_progs) THEN v_req_s := v_req_s + 1; END IF;
  END LOOP;

  -- ── 3.5) ★ 014: 프로그램별 신규접수 게이트 (아직 쓰기 없음) ─────────────────
  --   막힌 프로그램만 수요에서 덜어낸다. 나머지는 그대로 접수한다.
  IF v_req_l > 0 THEN
    IF NOT coalesce(v_l_open, true) THEN
      v_block_l := 'lesson_closed';
    ELSIF v_l_total_cap IS NOT NULL
      AND (SELECT count(*) FROM surfcamp.signup s
            WHERE s.program = 'lesson' AND s.status IN ('confirmed','waitlist'))
          + v_req_l > v_l_total_cap THEN
      v_block_l := 'lesson_full';
    END IF;
  END IF;
  IF v_req_s > 0 THEN
    IF NOT coalesce(v_s_open, true) THEN
      v_block_s := 'special_closed';
    ELSIF v_s_total_cap IS NOT NULL
      AND (SELECT count(*) FROM surfcamp.signup s
            WHERE s.program = 'special' AND s.status IN ('confirmed','waitlist'))
          + v_req_s > v_s_total_cap THEN
      v_block_s := 'special_full';
    END IF;
  END IF;

  v_take_l := (v_req_l > 0 AND v_block_l IS NULL);
  v_take_s := (v_req_s > 0 AND v_block_s IS NULL);
  v_need_l := CASE WHEN v_take_l THEN v_req_l ELSE 0 END;
  v_need_s := CASE WHEN v_take_s THEN v_req_s ELSE 0 END;

  -- 요청한 프로그램이 전부 막힌 경우에만 거부한다(부분 접수가 원칙).
  IF v_need_l = 0 AND v_need_s = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error',
      CASE WHEN v_block_l IS NOT NULL AND v_block_s IS NOT NULL THEN 'all_programs_closed'
           ELSE coalesce(v_block_l, v_block_s, 'no_program') END);
  END IF;

  -- ── 4) 판정 전에 먼저 대기열을 소진시켜 불변식 P 를 복원한다 ────────────────
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

      -- ★ 014: 막힌 프로그램은 신청 행을 만들지 않는다(참가자 자체는 남는다).
      IF v_take_l AND v_p->'programs' ? 'lesson' THEN
        INSERT INTO surfcamp.signup(registration_id, participant_id, program, slot, status, batch_seq, confirmed_at)
        VALUES (v_reg_id, v_part_id, 'lesson', v_time, v_status_l, v_batch_l,
                CASE WHEN v_status_l = 'confirmed' THEN now() END);
      END IF;
      IF v_take_s AND v_p->'programs' ? 'special' THEN
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
    'special', jsonb_build_object('count', v_need_s, 'status', v_status_s),
    'blocked', jsonb_strip_nulls(
                 jsonb_build_object('lesson', v_block_l, 'special', v_block_s))));

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
    -- 막혀서 제외된 프로그램. 화면이 "강습은 마감돼 제외됐습니다"를 안내하는 근거다.
    'blocked', jsonb_strip_nulls(
                 jsonb_build_object('lesson', v_block_l, 'special', v_block_s)),
    'promoted', v_promoted);
END $$;

-- ── 3.2 수정 ─────────────────────────────────────────────────────────────────
-- 정원 재판정 규칙(R1~R5) · 자격 검사는 012 와 동일하다. 게이트만 추가됐다.
--
-- ★ 게이트는 "신규로 늘어나는 (참가자 × 프로그램) 조합"에만 걸린다.
--   이미 활성 신청이 있는 조합은 손대지 않으므로, 마감된 프로그램의 기존 확정/대기는
--   수정 화면에서도 그대로 유지된다.
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
  -- ★ 014 추가분: 프로그램별 게이트
  v_l_open      BOOLEAN; v_s_open      BOOLEAN;
  v_l_total_cap INT;     v_s_total_cap INT;
  v_pre_l       INT := 0;  v_pre_s INT := 0;   -- 쓰기 전에 선집계한 신규 수요
  v_block_l     TEXT;    v_block_s TEXT;
  v_take_l      BOOLEAN := true; v_take_s BOOLEAN := true;
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

  -- ★ 012 변경점: 실질 오픈(수동 스위치 AND 예약 시각 경과)을 읽는다.
  -- ★ 014 변경점: 프로그램별 게이트 값을 같은 SELECT 로 함께 읽는다.
  SELECT (c.submissions_open AND (c.open_at IS NULL OR now() >= c.open_at)),
         c.capacity_lesson, c.capacity_special,
         c.lesson_open, c.special_open, c.lesson_total_cap, c.special_total_cap
    INTO v_open, v_cap_l, v_cap_s,
         v_l_open, v_s_open, v_l_total_cap, v_s_total_cap
    FROM surfcamp.config c WHERE c.id = 1;

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
    -- 서핑강습 하드 게이트: 만 10세 이상 AND 신장 130cm 이상 (둘 다 충족)
    IF 'lesson' = ANY(v_progs) AND (v_age < 10 OR v_h < 130) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson',
                                'name', v_p->>'name', 'age', v_age, 'height_cm', v_h);
    END IF;

    -- ★ 014: 신규 수요 선집계. 아래 5)의 v_new_l / v_new_s 와 같은 기준이다
    --   (신규 참가자이거나, 기존 참가자인데 그 프로그램에 활성 신청이 없는 경우).
    --   3)~4)의 쓰기는 "원하지 않는 조합"만 취소하므로 이 판정 결과를 바꾸지 않는다.
    IF 'lesson' = ANY(v_progs) AND (v_pid IS NULL OR NOT EXISTS (
         SELECT 1 FROM surfcamp.signup s
          WHERE s.participant_id = v_pid AND s.program = 'lesson' AND s.status <> 'cancelled'))
    THEN v_pre_l := v_pre_l + 1; END IF;
    IF 'special' = ANY(v_progs) AND (v_pid IS NULL OR NOT EXISTS (
         SELECT 1 FROM surfcamp.signup s
          WHERE s.participant_id = v_pid AND s.program = 'special' AND s.status <> 'cancelled'))
    THEN v_pre_s := v_pre_s + 1; END IF;
  END LOOP;

  -- ── 2.5) ★ 014: 프로그램별 신규접수 게이트 (아직 쓰기 없음) ─────────────────
  --   여기서 거부해야 부분 수정이 커밋되지 않는다.
  IF v_pre_l > 0 THEN
    IF NOT coalesce(v_l_open, true) THEN
      v_block_l := 'lesson_closed';
    ELSIF v_l_total_cap IS NOT NULL
      AND (SELECT count(*) FROM surfcamp.signup s
            WHERE s.program = 'lesson' AND s.status IN ('confirmed','waitlist'))
          + v_pre_l > v_l_total_cap THEN
      v_block_l := 'lesson_full';
    END IF;
  END IF;
  IF v_pre_s > 0 THEN
    IF NOT coalesce(v_s_open, true) THEN
      v_block_s := 'special_closed';
    ELSIF v_s_total_cap IS NOT NULL
      AND (SELECT count(*) FROM surfcamp.signup s
            WHERE s.program = 'special' AND s.status IN ('confirmed','waitlist'))
          + v_pre_s > v_s_total_cap THEN
      v_block_s := 'special_full';
    END IF;
  END IF;

  v_take_l := (v_block_l IS NULL);
  v_take_s := (v_block_s IS NULL);

  -- 늘리려던 프로그램이 전부 막혔을 때만 거부한다. 한쪽만 막혔으면 나머지는 반영한다.
  IF (v_block_l IS NOT NULL OR v_block_s IS NOT NULL)
     AND NOT ((v_pre_l > 0 AND v_take_l) OR (v_pre_s > 0 AND v_take_s)) THEN
    RETURN jsonb_build_object('ok', false, 'error',
      CASE WHEN v_block_l IS NOT NULL AND v_block_s IS NOT NULL THEN 'all_programs_closed'
           ELSE coalesce(v_block_l, v_block_s) END);
  END IF;

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

  -- ★ 014: 막힌 프로그램의 신규분은 통째로 버린다(기존 신청은 위에서 손대지 않았다).
  IF NOT v_take_l THEN v_new_l := NULL; END IF;
  IF NOT v_take_s THEN v_new_s := NULL; END IF;

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
    'status', jsonb_build_object('lesson', v_res_l,   'special', v_res_s),
    'blocked', jsonb_strip_nulls(
                 jsonb_build_object('lesson', v_block_l, 'special', v_block_s))));

  RETURN jsonb_build_object(
    'ok', true,
    'registration_id', p_registration_id,
    'changed', jsonb_build_object(
      'lesson',  jsonb_build_object('added', v_add_l, 'removed', v_freed_l, 'status', v_res_l),
      'special', jsonb_build_object('added', v_add_s, 'removed', v_freed_s, 'status', v_res_s)),
    -- 막혀서 반영하지 못한 추가분. 화면이 그 사실을 알려 주는 근거다.
    'blocked', jsonb_strip_nulls(
                 jsonb_build_object('lesson', v_block_l, 'special', v_block_s)),
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

-- ============================================================================
-- 4. 관리자 — 프로그램별 게이트 설정
-- ============================================================================
-- ★ 정원(surfcamp_set_capacity)과 결정적으로 다른 점:
--   정원을 늘리면 대기자가 승급되고 확정 문자가 나간다.
--   게이트는 정원을 건드리지 않으므로 승급도 문자도 발생하지 않는다.
--   따라서 이 함수는 promote_program 을 호출하지 않는다.
--
-- 상한(p_*_total_cap)은 NULL 이면 무제한이다. 값을 낮춰도 이미 접수된 건은
-- 손대지 않는다 — 신규 신청만 막힌다.
CREATE OR REPLACE FUNCTION public.surfcamp_set_program_gates(
  p_lesson_open       BOOLEAN,
  p_special_open      BOOLEAN,
  p_lesson_total_cap  INT,
  p_special_total_cap INT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_row surfcamp.config%ROWTYPE;
BEGIN
  IF p_lesson_open IS NULL OR p_special_open IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_gate'); END IF;
  IF (p_lesson_total_cap  IS NOT NULL AND (p_lesson_total_cap  < 0 OR p_lesson_total_cap  > 9999))
  OR (p_special_total_cap IS NOT NULL AND (p_special_total_cap < 0 OR p_special_total_cap > 9999)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_total_cap'); END IF;

  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  UPDATE surfcamp.config
     SET lesson_open       = p_lesson_open,
         special_open      = p_special_open,
         lesson_total_cap  = p_lesson_total_cap,
         special_total_cap = p_special_total_cap,
         updated_at        = now()
   WHERE id = 1
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'config_missing'); END IF;

  INSERT INTO surfcamp.event_log(kind, detail)
  VALUES ('set_gates', jsonb_build_object(
    'lesson_open',       v_row.lesson_open,
    'special_open',      v_row.special_open,
    'lesson_total_cap',  v_row.lesson_total_cap,
    'special_total_cap', v_row.special_total_cap));

  RETURN jsonb_build_object(
    'ok', true,
    'lesson_open',       v_row.lesson_open,
    'special_open',      v_row.special_open,
    'lesson_total_cap',  v_row.lesson_total_cap,
    'special_total_cap', v_row.special_total_cap);
END $$;

-- ============================================================================
-- 5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- CREATE OR REPLACE 는 기존 ACL 을 유지하지만, 신규 함수(surfcamp_set_program_gates)는
-- 생성 시 PUBLIC 에 EXECUTE 가 기본 부여되므로 반드시 회수해야 한다.
-- (시그니처를 정확히 일치시켜야 한다)
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_availability()',
    'public.surfcamp_submit(jsonb)',
    'public.surfcamp_update(uuid, text, jsonb)',
    'public.surfcamp_set_program_gates(boolean, boolean, int, int)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
