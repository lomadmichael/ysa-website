-- 보도자료 썸네일 URL 컬럼 추가
-- OG 이미지 자동 추출 또는 수동 업로드된 이미지 URL을 보관

ALTER TABLE press
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN press.thumbnail_url IS
  '보도자료 대표 이미지 URL. og:image에서 자동 추출하거나 관리자가 직접 업로드.';
