-- 보도자료에 본문 내용(content) 필드 추가
-- 공지사항(notices)과 동일하게 HTML 컨텐츠 저장용 (TiptapEditor 출력)

ALTER TABLE press
  ADD COLUMN content TEXT NOT NULL DEFAULT '';

-- 기존 행은 content=''로 초기화 (DEFAULT 적용)
