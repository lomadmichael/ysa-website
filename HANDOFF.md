# ysa-website 작업 인수인계

> 생성일: 2026-04-14
> 이전 채팅 마지막 커밋: `fdbf88c fix(notice): 실시간 반영 + 보도자료 본문 필드 추가`
> 브랜치: `master`
> 작업 디렉토리: `C:\Users\hongk\Desktop\ClaudeCode\ysa-website`

## 지금까지 진행된 것 (이번 세션)

### 1. 도메인 연결 (완료)
- `ysakorea.com`을 Vercel + 가비아 DNS + 네임서버(Vercel)로 연결 완료
- SSL 자동 발급 (Let's Encrypt, 2026-07-12 만료, 자동 갱신)
- `www.ysakorea.com` → `ysakorea.com` 자동 리디렉트
- 초기 HSTS 캐시 이슈 해결 (브라우저 로컬 상태 문제였음)

### 2. Supabase 프로젝트 연결 (완료)
- **Project**: ysa-website 전용 신규 (Project ref: `cpibyzivkhvzusqmznsf`)
- **URL**: `https://cpibyzivkhvzusqmznsf.supabase.co`
- **환경변수 설정**:
  - 로컬 `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Vercel Production + Development (Preview는 미설정)
- **Storage 버킷**: `media`, `documents` (둘 다 public)
- **Auth**: 관리자 계정 1개 생성 완료 (사용자 설정)
- **스키마 적용**:
  - `migrations/001_initial_schema.sql` (notices, programs, competitions, gallery, press, faq)
  - `migrations/002_add_press_content.sql` (press.content 추가) — **실행 완료**

### 3. 공지·자료실 구현 (Phase 1 + 2 완료)

#### Phase 1: 공지사항
- `src/components/notice/NoticeList.tsx` 신규 — client 컴포넌트로 카테고리 필터 동작
- `src/app/notice/page.tsx` server component 유지, NoticeList 사용
- 필터: 전체 / 대회 / 교육 / 행사 / 협회, 각 건수 표시
- `/admin/notices` 는 기존에 완성돼 있어 그대로 작동 (TiptapEditor 활용)

#### Phase 2: 보도자료
- `/admin/press` 신규: 목록 + CRUD 버튼
- `/admin/press/new`, `/admin/press/[id]/edit` 신규: 제목·출처·원문URL·본문(TiptapEditor)
- `/notice/press` 리뉴얼: 외부 링크 직접 이동 → 상세 페이지로 전환, 본문 요약(140자) 표시
- `/notice/press/[id]` 신규: 본문 + 원문 링크 박스
- `admin/layout.tsx`에 `보도자료` NAV 추가, 대시보드 카드 추가

### 4. 실시간 반영
- 모든 `/notice/*` 경로에 `export const dynamic = 'force-dynamic'` 적용
- 빌드 결과: `○ Static` → **`ƒ Dynamic`** (admin 수정 즉시 반영)

### 5. 연도별 타이틀 이미지 (이전 작업 정리)
- `/festival` 페이지 타임라인에 10개 연도 (2014~2019, 2022~2025) 모두 실제 이미지 적용
- `Title Image/{year}-title.jpg` 경로 구조

## 다음 할 일

### 🔥 우선순위 높음
- [ ] admin에서 공지사항 + 보도자료 **실제 컨텐츠 등록 및 검증**
- [ ] **규정·서식(docs) 구현 (Phase 3)**
  - Migration 003 (documents 테이블) 작성
  - `/admin/documents` CRUD (파일 업로드 + 외부 URL 지원)
  - `/notice/docs` 공개 페이지 리뉴얼 (현재 placeholder)
  - Supabase Storage `documents` 버킷 사용

### 🟡 우선순위 중간
- [ ] **사진·영상 완성 (Phase 4)**
  - `/notice/gallery` 상세 모달/라이트박스 추가
  - `/admin/gallery` Supabase 연결 후 실제 업로드 검증
  - `public/images/history/Gallery/` 에 올려둔 서핑 사진 활용 방식 결정
- [ ] FAQ admin 페이지 (`/admin/faq`) 추가
- [ ] 홈 `GalleryPreview.tsx` TODO 해결 (Supabase 연결)

### 🟢 우선순위 낮음
- [ ] Vercel Preview 환경변수 추가 (Supabase URL/KEY)
- [ ] 공지사항 검색 기능 (제목 + 본문)
- [ ] 페이지네이션 (공지 많아지면)

## 결정/합의사항

- **Supabase 프로젝트**: FormPay와 분리된 **ysa-website 전용** 프로젝트 사용 (관리/권한 독립)
- **실시간 반영 방식**: `revalidate` ISR 대신 `force-dynamic`으로 매 요청 렌더. 트래픽 낮고 admin 수정 후 즉시 확인이 중요.
- **Press 본문**: 상세 페이지 추가하여 본문 + 원문 링크 함께 제공. 카드 클릭 = 상세로 이동 (이전엔 외부 직링크).
- **규정·서식**: 파일 업로드 + 외부 URL 둘 다 지원 (file_url OR external_url), 카테고리 없이 단일 목록 (사용자 확정)

## 막혔던 지점

- 처음엔 admin에서 보도자료 저장 시 `Could not find the 'content' column of 'press' in the schema cache` 발생
  → 원인: Migration 002 미실행. 사용자가 SQL Editor에서 `ALTER TABLE press ADD COLUMN content TEXT NOT NULL DEFAULT ''` 실행으로 해결.
- `ysakorea.com` HSTS 캐시 문제로 인증서 오류 (어제~오늘): 시크릿 창에선 정상 → 브라우저 캐시 문제. `chrome://net-internals/#hsts` 에서 삭제로 해결.

## 관련 파일

### 신규
- `src/components/notice/NoticeList.tsx`
- `src/app/admin/press/page.tsx`
- `src/app/admin/press/new/page.tsx`
- `src/app/admin/press/[id]/edit/page.tsx`
- `src/app/notice/press/[id]/page.tsx`
- `supabase/migrations/002_add_press_content.sql`
- `.env.local` (Supabase 키 3개 추가됨)

### 수정
- `src/app/notice/page.tsx` (dynamic + NoticeList 사용)
- `src/app/notice/[id]/page.tsx` (dynamic)
- `src/app/notice/press/page.tsx` (상세 링크로 전환 + 요약)
- `src/app/notice/gallery/page.tsx` (dynamic)
- `src/app/notice/faq/page.tsx` (dynamic)
- `src/lib/database.types.ts` (PressItem.content)
- `src/app/admin/layout.tsx` (NAV 추가)
- `src/app/admin/page.tsx` (대시보드 카드)

### 미커밋 리소스
- `public/images/history/Gallery/` — 서핑 사진들 (surfing_01~07.jpg 등). 아직 코드 연동 안 됨. Phase 4(사진·영상) 또는 festival 페이지 보강에 사용 예상.

## 배포/빌드 상태

- **Production URL**: `https://ysakorea.com` (커스텀 도메인), `https://ysa-website.vercel.app` (vercel alias)
- **최근 배포**: `fdbf88c` 커밋 기반, Ready 상태
- **Next.js build**: 성공, 모든 `/notice/*` Dynamic rendering 확인
- **Vercel**: michaelleelomad-5867s-projects / ysa-website 프로젝트

## 환경변수 체크리스트

로컬 `.env.local`:
- ✅ `GOOGLE_CALENDAR_API_KEY`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

Vercel:
- ✅ Production: 위 4개 모두
- ✅ Development: 위 4개 모두
- ⚠️ Preview: Supabase 3개 미설정 (필요 시 추가)

## 새 채팅 첫 메시지 (이것만 복사해서 붙여넣으면 됨)

```
C:\Users\hongk\Desktop\ClaudeCode\ysa-website\HANDOFF.md 읽고 이어서 작업해줘
```
