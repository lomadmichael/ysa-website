# ysa-website 작업 인수인계

> 최종 업데이트: 2026-04-19
> 마지막 커밋: `d5a3836 feat(notice): cascading storage cleanup + drag-drop uploader`
> 브랜치: `master`
> 작업 디렉토리: `C:\Users\hongk\Desktop\ClaudeCode\ysa-website`
> 라이브: https://ysakorea.com

## 🆕 최근 세션 (2026-04-19) — 보안 강화 + 공지 파일첨부

### 배포된 변경사항

**1. 🔒 어드민 보안 2중 방어** (commit `7a8c278`)
- Supabase 대시보드 **"Allow new users to sign up" OFF** — anon signup 시 `"Signups not allowed for this instance"` 반환 확인
- `src/app/admin/layout.tsx`에 `ALLOWED_ADMINS` 이메일 화이트리스트 추가
- 화이트리스트 밖 유저 로그인 시 즉시 `supabase.auth.signOut()` + "관리자 권한 없음" 메시지
- 기존 세션·신규 로그인 양쪽 체크
- 신규 관리자 provisioning 스크립트: `scripts/create-admin.mjs` (service_role로 `supabase.auth.admin.createUser()` 호출)

**2. 📎 공지사항 다중 파일 첨부** (commit `aee599c`)
- migration `007_add_notices_attachments.sql` — `notices.attachments JSONB NOT NULL DEFAULT '[]'`
- 공용 컴포넌트 `src/components/admin/AttachmentUploader.tsx` — 다중 선택, 개별 제거, 크기 표시, 업로드 진행 상태
- 관리자 `/admin/notices/new`, `/admin/notices/[id]/edit` 업로더 연결
- 공개 `/notice/[id]` 첨부파일 박스 렌더 (첨부 0개면 자동 숨김)
- 스토리지: 기존 `documents` 버킷 재사용, 경로 접두사 `notices/`
- 기존 공지는 빈 배열(`[]`) 자동 초기화 → 하위호환 OK
- mock 픽스처 (`/notice`, `LatestNotices`)도 attachments 필드 추가해 타입 호환

### 🔑 등록된 관리자 계정 (auth.users)

| 이메일 | 용도 | 비밀번호 전달 |
|---|---|---|
| `michaellee.lomad@gmail.com` | 개발자 본인 | (기존) |
| `ysa_korea@naver.com` | 서핑협회 콘텐츠 편집자 | `!yangyang6155` |

추가 관리자 필요 시: ① `ALLOWED_ADMINS` 배열에 이메일 추가 → ② `scripts/create-admin.mjs` 값 수정 후 실행 → ③ 커밋·배포

### 📄 별도 산출물 (ysa-website 외부)

- `C:\Users\hongk\Desktop\ClaudeCode\양양군서핑협회_홈페이지_견적서_2026-04-19.pdf` — 양양군체육회 제출용 2페이지 견적서 (공급가액 2천만원, 합계 2,200만원 VAT 포함)
- `C:\Users\hongk\Desktop\ClaudeCode\create_ysa_estimate_pdf.py` — 재생성/수정용 Python 스크립트 (reportlab + 맑은고딕)
- 제출 전 공급자 섹션 4곳 수기 기재 필요: 사업자등록번호, 주소, 연락처, 대표자명

### 🔄 후속 개선 (같은 날 추가, commit `d5a3836`)

**3. 🗑️ 공지 첨부 Storage cascading 정리**
- `/admin/notices` 삭제: DB 삭제 후 `attachments` URL을 `deleteFromBucket('documents', ...)`로 일괄 정리
- `/admin/notices/[id]/edit` 저장: `originalAttachments`와 diff 계산, 제거된 URL만 Storage에서 삭제 (취소 시엔 원본 보존)
- `src/lib/storage-helpers.ts`의 `deleteFromBucket`·`extractStoragePath` 재사용

**4. 📥 AttachmentUploader 드래그&드롭 + 용량 체크**
- 점선 드롭존 + 드래그 중 `border-ocean bg-ocean/5` 하이라이트
- 키보드 접근성: `role="button"` + Enter/Space 키로 파일 선택 다이얼로그
- `maxSizeMB` prop (기본 50MB, Supabase 버킷 한도) — 초과 파일은 업로드 전 필터링 + 에러 메시지
- 기존 클릭 input과 드롭이 동일한 `handleFiles` 경로 공유

### 📋 다음 할 일 / 후속 옵션

- [ ] (선택) Supabase RLS 정책에 이메일 화이트리스트 직접 걸기 — 3중 방어
- [x] ~~공지 삭제 시 Storage 파일 cascading 정리~~ → 2026-04-19 완료
- [x] ~~파일 업로드 드래그&드롭 UX~~ → 2026-04-19 완료
- [x] ~~파일 용량 클라이언트 체크~~ → 2026-04-19 완료 (50MB 기본)
- [ ] (선택) **신규 공지 폼 취소 시 업로드된 Storage 파일 고아 처리** — 현재 `/admin/notices/new`에서 파일 업로드 후 저장 없이 이탈하면 Storage에 고아 파일 남음. `beforeunload` 또는 unmount cleanup 필요
- [ ] 견적서 PDF 확정 버전 — 공급자 빈칸 값 받은 뒤 재생성

## 🎯 프로덕션 현황

| 영역 | 상태 |
|---|---|
| 메인 도메인 | **https://ysakorea.com** (SSL, HSTS 2년) |
| 서브 도메인 | `www.ysakorea.com` → apex 자동 리디렉트 |
| 구 도메인 | `ysakoreaofficial.com` + `www` → **308 리디렉트** → ysakorea.com |
| Vercel 프로젝트 | `michaelleelomad-5867s-projects/ysa-website` |
| Supabase 프로젝트 | `cpibyzivkhvzusqmznsf` (ysakorea) |

## 🛠️ 주요 완성 기능

### 1. 공지·자료실 (5개 탭 모두 완성)
- **공지사항** `/notice` — 카테고리 필터 + 검색(제목·본문) + 페이지네이션(10/p) + **다중 파일 첨부** (2026-04-19 추가)
- **보도자료** `/notice/press` — admin CRUD + 상세 페이지 (TiptapEditor 본문)
- **사진·영상** `/notice/gallery` — 라이트박스 모달 + 키보드 네비게이션 + 다중 파일 업로드
- **규정·서식** `/notice/docs` — 파일 업로드 or 외부 URL 둘 다 지원
- **FAQ** `/notice/faq` — admin CRUD + ▲▼ 정렬

### 2. 관리자 (Admin) 기능
- `/admin/notices`, `/admin/press`, `/admin/docs`, `/admin/gallery`, `/admin/faq`, `/admin/programs`, `/admin/competitions`
- Supabase Auth 로그인 게이트 + **이메일 화이트리스트 2중 방어** (2026-04-19 강화)
- Supabase signup **차단됨** (외부 가입 불가, 등록은 service_role로만)
- TiptapEditor로 리치 본문 작성
- Storage 업로드 + 삭제 시 연동 정리
- 공지사항 다중 파일 첨부 (`AttachmentUploader` 공용 컴포넌트)

### 3. 교육 접수 (/apply)
- `/apply` — 강사·심판 교육 공통 접수 페이지
- `/apply/instructor`, `/apply/referee` — 교육별 분리된 접수
- **외부 서핑특화 교육**: `https://bpscomm.kr/yysports/` (새 탭)
- cert-manager API 연동 (SSR prefetch)
- BirthDatePicker, Kakao 주소 검색, 영수증 레이아웃

### 4. 페스티벌 10주년 `/festival`
- 연도별 타이틀 이미지 (2014~2025, Title Image 폴더)
- 포스터 갤러리, 역대 입상자, 타임라인

### 5. 실시간 반영
- 모든 `/notice/*` 경로 `force-dynamic`
- 홈 `/` ISR `revalidate = 60` (admin 등록 후 1분 내 메인 반영)

## 📡 SEO & 마케팅

### 검색엔진 등록
| 플랫폼 | 상태 | 토큰 |
|---|---|---|
| 네이버 서치어드바이저 (ysakorea.com) | ✅ | `f44f9a865855ca603cb06b96eb62c3874ae70cf7` |
| 네이버 서치어드바이저 (ysakoreaofficial.com) | ✅ | `8883c3f459f2db540ecd330508d11d29b6855057` |
| 구글 Search Console | ✅ | `HakB1hV_3c09jbTA0acXQPqa4IDuUdR5GQ8USUQZek8` |

### 메타데이터 현황
- **루트 metadata** (layout.tsx): canonical, OG(1200x630 og.jpg), Twitter Card, JSON-LD(SportsOrganization)
- **정적 페이지 15개** 개별 description 추가 완료
- **동적 페이지 3개** (`/notice/[id]`, `/notice/press/[id]`, `/schedule/[id]`): title·description·og:article·publishedTime·canonical
- **PageHeader** 컴포넌트에 **BreadcrumbList JSON-LD** 자동 주입 (~25개 페이지 적용)
- **sitemap.xml**: 30개 정적 경로 + `ysakorea.com` 정규화
- **robots.txt**: admin/api 차단 + `Host: https://ysakorea.com`

### 이미지 최적화 완료
- `hero_03.jpg` 메인 배너 (536KB, Squoosh MozJPEG 85)
- `hero_02.jpg` 10주년 배너 (698KB)
- `about_list.jpg` 연혁 (708KB)
- `og.jpg` SNS 공유 전용 (168KB, 1200×630)

### 보안 — 민감 파일 git 히스토리에서 완전 제거
- 입상자 명단 엑셀 → git-filter-repo로 전체 히스토리 rewrite + force push
- 포크 0개 확인 → 외부 유출 없음

## 🗄️ Supabase 스키마

| 테이블 | 용도 | RLS |
|---|---|---|
| notices | 공지사항 (category, pinned, content, **attachments JSONB**) | public read + auth write |
| press | 보도자료 (content 컬럼) | public read + auth write |
| gallery | 사진/영상 (media_urls JSONB 배열) | public read + auth write |
| documents | 규정·서식 (file_url OR external_url) | public read + auth write |
| faq | FAQ (sort_order) | public read + auth write |
| programs, competitions | 프로그램/대회 | public read + auth write |

**Storage 버킷**: `media` (갤러리), `documents` (규정·서식) — 둘 다 public read + authenticated write RLS 적용

## 📁 마이그레이션 현황

```
supabase/migrations/
├── 001_initial_schema.sql       (notices, programs, competitions, gallery, press, faq)
├── 002_add_press_content.sql    (press.content 컬럼)
├── 003_add_documents.sql        (documents 테이블)
├── 004_storage_documents_policies.sql  (documents 버킷 RLS)
├── 005_documents_rls.sql        (documents 테이블 RLS)
├── 006_storage_media_policies.sql      (media 버킷 RLS)
└── 007_add_notices_attachments.sql     (notices.attachments JSONB, 2026-04-19)
```

모든 마이그레이션은 Supabase 프로덕션에 적용 완료.

## 🔗 외부 연동

- **Google Calendar API v3** — `src/lib/google-calendar.ts`, 환경변수 `GOOGLE_CALENDAR_API_KEY`
  - 서핑협회 일정 캘린더 + 접수일정 캘린더 2개 연동
  - `revalidate: 300` (5분)
- **Kakao Daum 주소 검색** — 접수 페이지
- **cert-manager API** — 교육 접수 prefetch/submit
- **bpscomm.kr/yysports** — 서핑특화 교육 외부 링크

## 🔑 환경변수 체크리스트

| 변수 | 로컬 `.env.local` | Vercel Production | Vercel Development | Vercel Preview |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | ❌ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | ❌ |
| `GOOGLE_CALENDAR_API_KEY` | ✅ | ✅ | ✅ | ❌ |

## 📋 남은 작업 (TODO)

### 🟢 낮음 (필요할 때 진행)
- [ ] Vercel Preview 환경변수 추가 (Supabase 3개 + Google Calendar)
- [ ] hreflang (현재는 한국어만이라 불필요)
- [ ] 페이지네이션 크기 조정 (공지 수 증가 시)

### 💡 향후 아이디어
- [ ] 공지사항 RSS 피드
- [ ] 뉴스레터 구독
- [ ] 다국어 지원 (영어/일어)

## 🗂️ 데스크탑 백업 폴더

```
C:\Users\hongk\Desktop\
├── ysa-cleanup-2026-04-17\                          (제거한 파일들)
│   ├── 역대 양양서핑페스티벌 입상자 명단_20251016.xlsx
│   ├── hero.png, about.png, program-instructor.png
│   ├── value-4-1.png, staff.jpg
│
└── ysa-website-backup-before-filter-20260417-200338\ (히스토리 rewrite 전 리포)
    (사이트 정상 확인 후 삭제 권장 — 엑셀 포함)
```

## ⚠️ 주의사항

1. **HWP 작업 패턴** (다른 프로젝트 작업 시)
   - `hwp_replace_text`는 반드시 한 줄씩 개별 실행
   - 표 셀은 `hwp_fill_cells` 사용

2. **public/ 폴더는 공개 공간**
   - 민감 파일(개인정보, 엑셀, 내부 문서) 절대 금지
   - 필요 시 Supabase Storage private 버킷 사용

3. **Next.js 15+ 주의**
   - `AGENTS.md`: "This is NOT the Next.js you know" — 새 API 확인 후 코드 작성
   - 동적 params는 `Promise<{ id: string }>` + `use()` 또는 `await params`
   - `node_modules/next/dist/docs/` 참고

4. **HSTS 캐시 주의 (브라우저)**
   - 도메인 설정 변경 후 본인 PC에서만 이상 동작 → 시크릿 창으로 확인
   - `chrome://net-internals/#hsts` 에서 수동 삭제 가능

## 📂 주요 파일 경로

### 프레임워크 설정
- `src/app/layout.tsx` — 루트 메타데이터, JSON-LD, 검증 토큰
- `src/app/sitemap.ts` — 30개 정적 경로
- `src/app/robots.ts` — admin/api 차단
- `src/lib/constants.ts` — SITE, NAV_ITEMS
- `src/lib/supabase.ts` — 브라우저 + admin 클라이언트
- `src/lib/storage-helpers.ts` — 공통 업로드/삭제 유틸
- `src/lib/google-calendar.ts` — Calendar API v3
- `src/lib/database.types.ts` — 타입 정의

### 공통 컴포넌트
- `src/components/shared/PageHeader.tsx` — Breadcrumb + JSON-LD 자동
- `src/components/shared/JsonLd.tsx` — `BreadcrumbJsonLd` 헬퍼
- `src/components/admin/TiptapEditor.tsx` — 리치 에디터
- `src/components/admin/AttachmentUploader.tsx` — 다중 파일 업로더 + 드래그&드롭 + 용량 체크 (2026-04-19)
- `src/components/notice/NoticeList.tsx` — 필터+검색+페이지네이션
- `src/components/notice/GalleryLightbox.tsx` — 모달+슬라이드
- `src/components/home/HeroSection.tsx`, `GalleryPreview.tsx`, `LatestNotices.tsx`

### 운영 스크립트
- `scripts/create-admin.mjs` — 신규 관리자 Supabase auth.users 생성 (service_role)

## 🚀 새 채팅 첫 메시지 (복사용)

```
C:\Users\hongk\Desktop\ClaudeCode\ysa-website\HANDOFF.md 읽고 이어서 작업해줘
```
