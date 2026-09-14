-- ============================================================================
-- 프로그램 단위 취소 — surfcamp_cancel_program
--
-- 배경
--   기존 surfcamp_cancel 은 신청서 전체를 취소한다. 두 프로그램을 함께 신청한
--   가족(2026-09-14 기준 62건)이 "서핑강습만 못 가게 됐다"고 할 때, 지금 구조에서는
--   특화체험까지 같이 날아가므로 운영진이 전화를 받아 손으로 처리해야 했다.
--
--   배정이 끝난 뒤에는 시간·스쿨 변경을 받지 않는 대신 취소만큼은 본인이 직접
--   할 수 있어야 운영 부담이 줄어든다. 그래서 프로그램 하나만 끊는 경로를 만든다.
--
-- 설계
--   · 기존 surfcamp_cancel 은 건드리지 않는다(전체 취소 경로는 그대로).
--   · 해당 프로그램의 signup 만 cancelled 로 바꾸고 그 프로그램만 승급을 돌린다.
--   · 남은 활성 signup 이 하나도 없으면 registration 도 cancelled 로 내린다.
--     그래야 phone unique(active) 제약이 풀려 재신청이 가능하고 명단에서도 빠진다.
--   · p_phone 이 주어지면 저장된 번호와 대조한다(본인 확인). NULL 이면 관리자.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.surfcamp_cancel_program(
  p_registration_id uuid,
  p_phone           text,
  p_program         text,
  p_reason          text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_reg       surfcamp.registration%ROWTYPE;
  v_phone_in  TEXT;
  v_freed     INT;
  v_active    INT;
  v_remaining INT;
  v_whole     BOOLEAN := false;
  v_promoted  JSONB := '[]'::jsonb;
BEGIN
  IF p_program NOT IN ('lesson', 'special') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_program');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT * INTO v_reg FROM surfcamp.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_reg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', true, 'cancelled', false, 'promoted', '[]'::jsonb);
  END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;
  END IF;

  -- 끊을 프로그램에 살아 있는 신청이 있는지
  SELECT count(*) FILTER (WHERE s.status <> 'cancelled'),
         count(*) FILTER (WHERE s.status = 'confirmed')
    INTO v_active, v_freed
    FROM surfcamp.signup s
   WHERE s.registration_id = p_registration_id AND s.program = p_program;

  IF v_active = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_such_program');
  END IF;

  UPDATE surfcamp.signup
     SET status = 'cancelled', cancelled_at = now()
   WHERE registration_id = p_registration_id
     AND program = p_program
     AND status <> 'cancelled';

  -- 남은 프로그램이 없으면 신청서 자체를 취소로 내린다
  SELECT count(*) INTO v_remaining
    FROM surfcamp.signup s
   WHERE s.registration_id = p_registration_id AND s.status <> 'cancelled';

  IF v_remaining = 0 THEN
    v_whole := true;
    UPDATE surfcamp.registration
       SET status = 'cancelled', cancelled_at = now(),
           cancel_reason = nullif(btrim(coalesce(p_reason, '')), ''),
           cancelled_by  = CASE WHEN p_phone IS NULL THEN 'admin' ELSE 'self' END
     WHERE id = p_registration_id;
  END IF;

  -- 자리가 빈 프로그램만 승급을 돌린다
  v_promoted := surfcamp.promote_program(p_program);

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id,
          CASE WHEN p_phone IS NULL THEN 'admin_cancel_program' ELSE 'cancel_program' END,
          jsonb_build_object('program', p_program, 'freed', v_freed,
                             'whole_registration_cancelled', v_whole,
                             'reason', p_reason));

  RETURN jsonb_build_object(
    'ok', true, 'cancelled', true,
    'program', p_program,
    'rep_name', v_reg.rep_name, 'phone', v_reg.phone,
    'freed', v_freed,
    'whole_cancelled', v_whole,
    'promoted', v_promoted);
END $function$;

-- ── 권한 하드닝 ──────────────────────────────────────────────────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_cancel_program(uuid, text, text, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
