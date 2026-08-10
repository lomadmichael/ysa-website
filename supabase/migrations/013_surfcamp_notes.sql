-- ============================================================================
-- 2026 양양 서핑캠프 — 신청 건별 메모 2종 (운영 메모 / 신청자 안내)
--
-- 배경
--   접수가 라이브로 돌아가는 중에 신청자들이 문자로 개별 요청을 보내온다.
--   예: "3명 중 김준우만 15:00 으로 옮겨 주세요".
--   희망 강습시간은 신청서 단위 1택 구조라 폼으로는 표현할 수 없고, 최종 배정은
--   어차피 운영본부 권한이므로 배정 단계에서 처리하면 된다. 그런데 그 요청을
--   적어 둘 자리가 없었다. 또 신청자는 "요청이 반영됐는지" 확인할 방법이 없어
--   같은 문의가 반복된다.
--
-- 설계
--   staff_note        내부 운영 메모(배정 참고, 연락 이력 등) — 신청자에게 절대 노출 금지
--   applicant_notice  신청자에게 보여줄 안내 — 관리자가 작성, 신청 조회 페이지에 노출
--
-- ★ 가장 중요한 불변식
--   public.surfcamp_lookup_by_phone(text) 의 반환에 staff_note 가 들어가면 안 된다.
--   여기에는 "연락 두절", "노쇼 이력" 같은 내용이 들어갈 수 있다.
--   → lookup 에는 applicant_notice 만 추가한다. admin_list 에는 둘 다 넣는다.
--
-- ★ 기존 note 컬럼은 폼에서 수집하지 않아 전부 NULL 이고 lookup 에 이미 노출돼 있다.
--   이 파일에서는 건드리지 않는다(신규 컬럼 2개만 추가).
--
-- ★ 재정의하는 두 함수(surfcamp_admin_list / surfcamp_lookup_by_phone)의 본문은
--   009 와 100% 동일하고 반환 키만 추가했다. 화면들이 기존 키를 그대로 쓰므로
--   한 개라도 빠지면 사고다.
--
-- 파일 구성 순서
--   1. surfcamp.registration 컬럼 2개 추가
--   2. public.surfcamp_lookup_by_phone 재정의 (applicant_notice 만 추가)
--   3. public.surfcamp_admin_list 재정의 (staff_note + applicant_notice 추가)
--   4. public.surfcamp_set_notes 신규
--   5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- ============================================================================
-- 1. 스키마 변경
-- ============================================================================
ALTER TABLE surfcamp.registration
  ADD COLUMN IF NOT EXISTS staff_note       TEXT,
  ADD COLUMN IF NOT EXISTS applicant_notice TEXT;

COMMENT ON COLUMN surfcamp.registration.staff_note
  IS '내부 운영 메모. 신청자에게 절대 노출 금지 — lookup RPC 반환에 넣지 말 것.';
COMMENT ON COLUMN surfcamp.registration.applicant_notice
  IS '신청자에게 보여줄 안내. 관리자가 작성하며 신청 조회 페이지에 그대로 노출된다.';

-- ============================================================================
-- 2. 본인조회 — applicant_notice 만 추가한다 (staff_note 금지)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.surfcamp_lookup_by_phone(p_phone TEXT)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', r.id, 'created_at', r.created_at, 'updated_at', r.updated_at,
      'rep_name', r.rep_name, 'phone', r.phone,
      'address', r.address, 'address_detail', r.address_detail,
      'resident_type', r.resident_type, 'region', r.region, 'lesson_time', r.lesson_time,
      'consent_media', r.consent_media, 'note', r.note, 'status', r.status,
      -- ★ 운영 사무국이 신청자에게 보여주려고 쓴 안내만 내보낸다.
      --   staff_note 는 여기에 절대 추가하지 않는다.
      'applicant_notice', r.applicant_notice,
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

-- ============================================================================
-- 3. 관리자 명단 — 두 메모를 모두 노출한다
-- ============================================================================
CREATE OR REPLACE FUNCTION public.surfcamp_admin_list(p_include_cancelled BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
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
                 'special', (SELECT s.status FROM surfcamp.signup s
                              WHERE s.participant_id = p.id AND s.program='special' AND s.status<>'cancelled'))
               ORDER BY p.ordinal)
          FROM surfcamp.participant p
         WHERE p.registration_id = r.id AND p.removed_at IS NULL), '[]'::jsonb)) AS x
    FROM surfcamp.registration r
   WHERE p_include_cancelled OR r.status = 'active') t;
$$;

-- ============================================================================
-- 4. 메모 저장 (관리자 전용)
-- ============================================================================
-- 두 값을 함께 갱신한다. 빈 문자열·공백만 있는 입력은 NULL 로 정규화해
-- "메모 없음"과 "빈 메모"가 화면에서 갈라지지 않게 한다.
-- 취소된 신청에도 메모를 남길 수 있어야 하므로 status 는 보지 않는다.
CREATE OR REPLACE FUNCTION public.surfcamp_set_notes(
  p_registration_id UUID,
  p_staff_note TEXT,
  p_applicant_notice TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_staff TEXT; v_notice TEXT;
BEGIN
  IF p_registration_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_registration'); END IF;

  v_staff  := nullif(btrim(coalesce(p_staff_note, '')), '');
  v_notice := nullif(btrim(coalesce(p_applicant_notice, '')), '');

  UPDATE surfcamp.registration
     SET staff_note = v_staff, applicant_notice = v_notice
   WHERE id = p_registration_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id, 'set_notes',
          jsonb_build_object(
            -- 내용 자체는 남기지 않는다(감사 로그에 개인 응대 이력이 중복 축적되는 것을 피한다).
            'staff_note', v_staff IS NOT NULL,
            'applicant_notice', v_notice IS NOT NULL));

  RETURN jsonb_build_object('ok', true, 'staff_note', v_staff, 'applicant_notice', v_notice);
END $$;

-- ============================================================================
-- 5. 권한 하드닝 재적용 + PostgREST 스키마 리로드
-- ============================================================================

-- CREATE OR REPLACE 는 기존 ACL 을 유지하지만, 신규 함수(surfcamp_set_notes)는
-- 생성 시 PUBLIC 에 EXECUTE 가 기본 부여되므로 반드시 회수해야 한다.
-- (시그니처를 정확히 일치시켜야 한다)
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.surfcamp_lookup_by_phone(text)',
    'public.surfcamp_admin_list(boolean)',
    'public.surfcamp_set_notes(uuid, text, text)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- PostgREST 스키마 캐시 리로드
NOTIFY pgrst, 'reload schema';
