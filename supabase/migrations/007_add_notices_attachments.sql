-- notices에 첨부파일(다중) 컬럼 추가
-- JSONB 배열: [{ url, name, size }, ...]
-- 파일은 기존 'documents' 스토리지 버킷의 notices/ 경로 하위에 업로드.

ALTER TABLE notices
ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN notices.attachments IS
  'Array of {url: string, name: string, size: number}. Files stored in documents bucket under notices/ prefix.';
