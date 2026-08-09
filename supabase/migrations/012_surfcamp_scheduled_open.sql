-- ============================================================================
-- 2026 양양 서핑캠프 — 예약 오픈(scheduled open)
--
-- 배경
--   접수를 2026-08-10 09:00 KST(= 2026-08-10T00:00:00Z)에 자동으로 열어야 한다.
--   외부 cron/스케줄러는 조용히 실패할 여지가 있어(잡 누락 = 오픈 사고) 쓰지 않고,
--   "지금 시각을 보고 선언적으로 판단"하는 방식을 택한다.
--
--     effective_open = submissions_open AND (open_at IS NULL OR now() >= open_at)
--
--   * submissions_open : 관리자 수동 스위치(원값). 이게 false 면 무조건 닫힘.
--   * open_at          : 예약 오픈 시각. NULL 이면 수동 스위치만으로 판단(기존 동작).
--   → 관리자가 submissions_open=true + open_at=예약시각 으로 세팅해 두면
--     그 시각부터 아무 조작 없이 저절로 열린다. 수동 마감은 항상 우선한다.
--
-- ★ 이 파일은 "오픈 판정"만 바꾼다. 자격 검사 · 정원 판정 · 대기 승급 ·
--   중복 검사 · batch 처리 · EXCEPTION 블록 등 나머지 본문은 011 과 100% 동일하다.
--   (운영 중 접수 로직이므로 한 줄이라도 달라지면 사고다)
--
-- ★ 취소(surfcamp_cancel / surfcamp_admin_cancel)는 마감 후에도 가능해야 하므로
--   오픈 여부를 보지 않는다. 이 파일에서 건드리지 않는다.
--
-- 파일 구성 순서
--   1. surfcamp.config.open_at 컬럼 추가
--   2. public.surfcamp_availability() 재정의 (실질 오픈 + 남은 시간 노출)
--   3. public.surfcamp_submit / public.surfcamp_update 재정의 (오픈 판정만 변경)
--   4. public.surfcamp_set_open / public.surfcamp_set_open_at
--   5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- ============================================================================
-- 1. 스키마 변경
-- ============================================================================

ALTER TABLE surfcamp.config ADD COLUMN IF NOT EXISTS open_at TIMESTAMPTZ;

COMMENT ON COLUMN surfcamp.config.open_at IS
  '예약 오픈 시각(UTC). NULL 이면 submissions_open 만으로 판단한다. '
  '실질 오픈 = submissions_open AND (open_at IS NULL OR now() >= open_at)';

-- ============================================================================
-- 2. 잔여현황 — 실질 오픈 여부 / 예약 시각 / 남은 초를 함께 돌려준다
-- ============================================================================
-- 반환 키는 src/lib/surfcamp-db.ts 의 SurfcampAvailability 와 1:1 로 맞춘다.
--   open             : 실질 오픈 여부 (폼·서버액션·RPC 가 모두 이 값을 본다)
--   submissions_open : 관리자 수동 스위치 원값
--   open_at          : 예약 오픈 시각 ISO8601 UTC (없으면 null)
--   opens_in_seconds : 예약까지 남은 초. 이미 지났거나 예약이 없으면 null
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
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='lesson'  AND s.status='waitlist')),
    'special', jsonb_build_object(
      'capacity',  c.capacity_special,
      'confirmed', (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='confirmed'),
      'waitlist',  (SELECT count(*) FROM surfcamp.signup s WHERE s.program='special' AND s.status='waitlist')))
  FROM surfcamp.config c WHERE c.id = 1;
$$;

-- ============================================================================
-- 3. RPC 재정의 (011 본문 그대로 + 오픈 판정만 변경)
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
  SELECT (c.submissions_open AND (c.open_at IS NULL OR now() >= c.open_at)),
         c.capacity_lesson, c.capacity_special
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
      -- 서핑강습 하드 게이트: 만 10세 이상 AND 신장 130cm 이상 (둘 다 충족)
      IF v_age < 10 OR v_h < 130 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'ineligible_lesson',
                                  'name', v_p->>'name', 'age', v_age, 'height_cm', v_h);
      END IF;
      v_need_l := v_need_l + 1;
    END IF;
    IF 'special' = ANY(v_progs) THEN v_need_s := v_need_s + 1; END IF;
  END LOOP;

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

-- ── 3.2 수정 ─────────────────────────────────────────────────────────────────
-- 정원 재판정 규칙(R1~R5) · 자격 검사는 011 과 동일하다. 오픈 판정만 바뀌었다.
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

  -- ★ 012 변경점: 실질 오픈(수동 스위치 AND 예약 시각 경과)을 읽는다.
  SELECT (c.submissions_open AND (c.open_at IS NULL OR now() >= c.open_at)),
         c.capacity_lesson, c.capacity_special
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
    -- 서핑강습 하드 게이트: 만 10세 이상 AND 신장 130cm 이상 (둘 다 충족)
    IF 'lesson' = ANY(v_progs) AND (v_age < 10 OR v_h < 130) THEN
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

-- ============================================================================
-- 4. 관리자 스위치
-- ============================================================================

-- ── 4.1 수동 오픈/마감 스위치 ────────────────────────────────────────────────
-- 반환의 'open' 은 "지금 실제로 접수가 열려 있는가"(실질 오픈)다.
-- 예약 시각이 미래인 상태에서 스위치만 켜면 open=false, submissions_open=true 가 되어
-- 관리자 화면이 "예약 시각까지는 닫혀 있다"고 안내할 수 있다.
CREATE OR REPLACE FUNCTION public.surfcamp_set_open(p_open BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_open_at TIMESTAMPTZ; v_effective BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));
  UPDATE surfcamp.config SET submissions_open = p_open, updated_at = now() WHERE id = 1
    RETURNING open_at INTO v_open_at;
  v_effective := coalesce(p_open, false) AND (v_open_at IS NULL OR now() >= v_open_at);
  INSERT INTO surfcamp.event_log(kind, detail)
  VALUES ('set_open', jsonb_build_object(
    'open', v_effective,
    'submissions_open', p_open,
    'open_at', CASE WHEN v_open_at IS NULL THEN NULL
                    ELSE to_char(v_open_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END));
  RETURN jsonb_build_object(
    'ok', true,
    'open', v_effective,
    'submissions_open', p_open,
    'open_at', CASE WHEN v_open_at IS NULL THEN NULL
                    ELSE to_char(v_open_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END);
END $$;

-- ── 4.2 예약 오픈 시각 설정 ──────────────────────────────────────────────────
-- p_open_at 이 NULL 이면 예약을 해제하고 수동 스위치만으로 판단한다.
CREATE OR REPLACE FUNCTION public.surfcamp_set_open_at(p_open_at TIMESTAMPTZ)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_open_at TIMESTAMPTZ; v_iso TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));
  UPDATE surfcamp.config SET open_at = p_open_at, updated_at = now() WHERE id = 1
    RETURNING open_at INTO v_open_at;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'config_missing'); END IF;

  v_iso := CASE WHEN v_open_at IS NULL THEN NULL
                ELSE to_char(v_open_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END;

  INSERT INTO surfcamp.event_log(kind, detail)
  VALUES ('set_open_at', jsonb_build_object('open_at', v_iso));

  RETURN jsonb_build_object('ok', true, 'open_at', v_iso);
END $$;

-- ============================================================================
-- 5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- CREATE OR REPLACE 는 기존 ACL 을 유지하지만, 신규 함수(surfcamp_set_open_at)는
-- 생성 시 PUBLIC 에 EXECUTE 가 기본 부여되므로 반드시 회수해야 한다.
-- (시그니처를 정확히 일치시켜야 한다)
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_availability()',
    'public.surfcamp_submit(jsonb)',
    'public.surfcamp_update(uuid, text, jsonb)',
    'public.surfcamp_set_open(boolean)',
    'public.surfcamp_set_open_at(timestamptz)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
