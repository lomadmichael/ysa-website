-- 규정·서식(documents) 테이블 추가
-- 파일 업로드(Supabase Storage 'documents' 버킷) 또는 외부 링크 둘 다 지원.
-- 목록 정렬 기준: date DESC.

CREATE TABLE IF NOT EXISTS documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  external_url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_source_check CHECK (file_url IS NOT NULL OR external_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS documents_date_idx ON documents (date DESC);

-- Supabase SQL Editor에서 직접 실행 필요 (001/002와 동일 패턴)
