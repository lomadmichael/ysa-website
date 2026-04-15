-- documents 테이블 RLS 활성화 + 정책
-- 다른 테이블(press, notices, gallery 등)과 동일 패턴: 공개 읽기 + authenticated 사용자 쓰기

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_documents"
ON documents FOR SELECT
USING (true);

CREATE POLICY "auth_write_documents"
ON documents FOR ALL
USING (auth.role() = 'authenticated');
