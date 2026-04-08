-- 공지사항
CREATE TABLE notices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('competition', 'education', 'event', 'association')),
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author TEXT,
  thumbnail_url TEXT
);

CREATE INDEX idx_notices_created_at ON notices (created_at DESC);
CREATE INDEX idx_notices_category ON notices (category);
CREATE INDEX idx_notices_pinned ON notices (pinned) WHERE pinned = true;

-- 프로그램
CREATE TABLE programs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('recruiting', 'ongoing', 'closed')),
  schedule TEXT,
  apply_link TEXT,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('instructor', 'referee', 'specialized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_programs_status ON programs (status);
CREATE INDEX idx_programs_category ON programs (category);

-- 대회
CREATE TABLE competitions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('recruiting', 'ongoing', 'closed')),
  schedule TEXT,
  result TEXT,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  year INT NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_competitions_status ON competitions (status);
CREATE INDEX idx_competitions_year ON competitions (year DESC);

-- 갤러리
CREATE TABLE gallery (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  media_urls JSONB NOT NULL DEFAULT '[]',
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_date ON gallery (date DESC);
CREATE INDEX idx_gallery_category ON gallery (category);

-- 보도자료
CREATE TABLE press (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FAQ
CREATE TABLE faq (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_notices_updated_at BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS 정책
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE press ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- 모든 테이블: 누구나 읽기 가능
CREATE POLICY "public_read_notices" ON notices FOR SELECT USING (true);
CREATE POLICY "public_read_programs" ON programs FOR SELECT USING (true);
CREATE POLICY "public_read_competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "public_read_gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "public_read_press" ON press FOR SELECT USING (true);
CREATE POLICY "public_read_faq" ON faq FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능
CREATE POLICY "auth_write_notices" ON notices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_programs" ON programs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_competitions" ON competitions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_press" ON press FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_faq" ON faq FOR ALL USING (auth.role() = 'authenticated');

-- Storage 버킷 (Supabase Dashboard에서 수동 생성 필요)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
