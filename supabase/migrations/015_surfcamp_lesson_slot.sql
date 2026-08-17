-- ============================================================================
-- 서핑강습 배정 시간(signup.slot)을 관리자 조회에 노출한다.
--
-- 배경
--   희망 강습시간(registration.lesson_time)은 "신청서 단위 1택"이라
--   "3명 중 아이만 15시로 옮겨 달라" 같은 개별 요청을 담을 수 없다.
--   최종 배정 권한은 운영본부에 있으므로 이런 요청은 배정 단계에서 처리하면 되는데,
--   그 결과를 적어 둘 자리가 없어 배정표에서 누락될 위험이 있었다.
--
--   signup.slot 은 009 에서 바로 이 목적으로 만들어 둔 컬럼이다(신청 시
--   lesson_time 의 사본이 들어가고, 운영진이 참가자 단위로 바꿀 수 있다).
--   여기서는 그 값을 관리자 조회에 드러내고, 안전하게 바꿀 RPC 를 추가한다.
--
-- ★ 신청자에게 보이는 경로(surfcamp_lookup_by_phone)는 건드리지 않는다.
--   배정 결과는 확정 후 개별 안내가 원칙이며, 조회 화면에 미리 노출하면
--   "왜 나만 시간이 다르냐"는 문의를 부른다.
-- ============================================================================

-- ── 관리자 명단에 참가자별 배정 시간 추가 ────────────────────────────────────
-- 014 본문 그대로에 participants 의 'lesson_slot' 한 줄만 더한다.
CREATE OR REPLACE FUNCTION public.surfcamp_admin_list(p_include_cancelled boolean DEFAULT false)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'created_at'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at, 'rep_name', r.rep_name, 'phone', r.phone,
      'address', r.address, 'address_detail', r.address_detail,
      'resident_type', r.resident_type, 'region', r.region, 'lesson_time', r.lesson_time,
      'status', r.status, 'cancelled_at', r.cancelled_at, 'cancelled_by', r.cancelled_by,
      'consent_media', r.consent_media, 'note', r.note,
      'staff_note', r.staff_note, 'applicant_notice', r.applicant_notice,
      'participants', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', p.id, 'name', p.name, 'gender', p.gender, 'age', p.age,
                 'height_cm', p.height_cm, 'weight_kg', p.weight_kg, 'surf_exp', p.surf_exp,
                 'lesson',  (SELECT s.status FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='lesson'  AND s.status<>'cancelled'),
                 -- 실제 배정 시간. 신청 희망시간과 다르면 운영진이 개별 조정한 것이다.
                 'lesson_slot', (SELECT s.slot FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='lesson'  AND s.status<>'cancelled'),
                 'special', (SELECT s.status FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='special' AND s.status<>'cancelled'))
               ORDER BY p.ordinal)
          FROM surfcamp.participant p
         WHERE p.registration_id = r.id AND p.removed_at IS NULL), '[]'::jsonb)) AS x
    FROM surfcamp.registration r
   WHERE p_include_cancelled OR r.status = 'active') t;
$function$;

-- ── 참가자 1명의 배정 시간 변경 ──────────────────────────────────────────────
-- 정원 판정과 무관하다. 승급도 문자도 일으키지 않는다.
CREATE OR REPLACE FUNCTION public.surfcamp_set_lesson_slot(
  p_participant_id uuid,
  p_slot text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_reg  uuid;
  v_name text;
  v_old  text;
BEGIN
  IF p_slot IS NOT NULL AND p_slot NOT IN ('13:00','15:00','any') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_slot');
  END IF;

  SELECT s.registration_id, p.name, s.slot
    INTO v_reg, v_name, v_old
    FROM surfcamp.signup s
    JOIN surfcamp.participant p ON p.id = s.participant_id
   WHERE s.participant_id = p_participant_id
     AND s.program = 'lesson'
     AND s.status <> 'cancelled';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE surfcamp.signup
     SET slot = p_slot
   WHERE participant_id = p_participant_id
     AND program = 'lesson'
     AND status <> 'cancelled';

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (v_reg, 'set_lesson_slot',
          jsonb_build_object('participant', v_name, 'from', v_old, 'to', p_slot));

  RETURN jsonb_build_object('ok', true, 'participant', v_name, 'from', v_old, 'to', p_slot);
END $function$;

-- ── 권한 하드닝 ──────────────────────────────────────────────────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_admin_list(boolean)',
    'public.surfcamp_set_lesson_slot(uuid, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
