# ysa-website 작업 인수인계

> 최종 업데이트: 2026-05-27
> 마지막 커밋: `4dc3e23 fix(apply): hide capacity counts for finished/closed schedules`
> 브랜치: `master`
> 작업 디렉토리: `C:\Users\hongk\Desktop\ClaudeCode\ysa-website`
> 라이브: https://ysakorea.com

## 🆕 최근 세션 (2026-05-27) — 교육 접수 종료 처리 + FAQ + 페스티벌 오탈자

### 1. 페스티벌 후원사명·오타 수정 (commit `8e8aea4`)
- **제5회**: `까뛰베` → **`K-WAY배`** (정확한 후원사명)
- **제1회**: `국제 서핑페스티벌` → `국제서핑페스티벌` (띄어쓰기 일관성)
- **제1회 descriptionKo**: 한글 오타·어순 정돈 + 따옴표 「 」로 통일
- 다른 회차 (제2/3/6/10회 후원사 없는 것)는 의도된 표기로 그대로 둠

### 2. 교육 접수 종료 차수 자동 마감 + FAQ (commit `359e691`, `83e4190`, `4dc3e23`)

#### 접수 폼 마감 표시 강화 (`ApplyForm`)
- `end_date < 오늘` → **"종료" 배지** + 선택 불가 (1~3차 즉시 적용)
- `status !== 'open'` → "마감" 배지 (cert-manager에서 수동 마감 시 즉시 반영)
- 정원·대기 둘 다 가득 → "정원 마감" 배지
- **종료/마감(closed) 차수는 정원·대기 숫자 숨김** (의미 없는 정보 노이즈 제거)
- cert-manager 데이터 안 건드려도 시즌 진행되면 자동 전환

#### FAQ 시스템 추가
- **공용 컴포넌트 신규**: `src/components/programs/EducationFAQ.tsx`
  - 4건: 차수 변경 / 취소(무료라 환불 X) / 대기 자동 전환·알림톡 / 당일 결석 033-671-6155
  - `<details>` 기반 collapsible (JS 없이 작동, SEO 친화)
  - referee + instructor 양쪽에서 재사용
- **노출 위치**:
  - `/programs/referee`, `/programs/instructor` 하단 FAQ 섹션
  - `/apply/referee` 폼 상단 안내 박스 + FAQ 페이지 링크
  - `/apply/instructor` "9월 오픈 예정" 카드 안내문에 FAQ 링크 한 줄

### 정책 안내 (FAQ 답변 근거)
- 차수 변경·취소: **golineup.kr 회원가입 후 마이페이지에서 직접 처리**
- 환불: **무료 교육이라 별도 환불 절차 없음**
- 대기 → 확정 자동 전환: 확정자 취소 시 대기 순번에 따라 자동, 알림톡 발송
- 당일 결석: 협회 대표번호 **033-671-6155**로 연락

---

## 🗂️ 이전 세션 (2026-04-28) — 콘텐츠 추가 + 성능 + 어드민 기능화 + 보도자료 OG

### 배포된 변경사항

**1. 📝 연혁 2023~2025 추가** (commit `20591b4`)
- `src/app/about/history/page.tsx` TIMELINE 최상단에 3년치 11건 추가
  - 2025: 10년의 기록 전시회, 제2회 군의장배, 제10회 페스티벌, 전문인력 양성, 레저스포츠 체험, 오션프렌들리 (6건)
  - 2024: 제1회 군의장배, 제9회 페스티벌, 전문인력 양성 (3건)
  - 2023: 제8회 페스티벌, 나는 양양의 서핑강사다 (2건)
- 같은 연도 안에서도 최신 월이 위에 오도록 정렬

**2. 🖼️ 협회사업 3개 페이지 hero 이미지 적용** (commit `20591b4`)
- placeholder div → `<Image>` 교체
- `business-education.jpg` (108KB), `business-safety.jpg` (95KB), `business-youth.jpg` (364KB)
- 공통: `aspect-[21/9]` + `fill` + `object-cover`

**3. ⚡ 메인 hero 최적화 + LQIP** (commit `e4a00e3`)
- `hero_03.jpg` 534KB → **128KB** (-76%, MozJPEG q75 / 4:2:0)
- `HeroSection`에 `placeholder="blur"` + `blurDataURL` 복구 → 배경색 튐 제거
- `scripts/optimize-hero.mjs` 재인코딩 + LQIP 자동 생성 유틸

**4. ⚡ 10주년 hero 최적화** (commit `c60a409`)
- `hero_02.jpg` 682KB → **165KB** (-76%)
- `FestivalHero` blur placeholder 복구
- `scripts/optimize-hero.mjs` 메인+10주년 둘 다 처리하도록 일반화

**5. 📊 어드민 대시보드 기능화** (commit `bd78f1f`)
- `src/app/admin/page.tsx` placeholder(—) → 실제 기능
- 7개 테이블 카드: 실제 카운트 (`count: 'exact', head: true` 병렬)
- 최근 업데이트 섹션: 공지·보도·갤러리 통합 최근 8건 + 상대시간(`방금 전 / N분 전`) + 배지
- 빠른 작성 CTA 3개 (공지/보도자료/갤러리) 상단 배치 → 원클릭 진입

**6. 📰 보도자료 OG 자동 추출 + 썸네일 시스템** (commit `15f9167`)
- migration `008_add_press_thumbnail.sql` — `press.thumbnail_url TEXT` 추가, 프로덕션 적용 완료
- `cheerio` 의존성 추가
- API route `POST /api/admin/fetch-og` — Bearer 토큰 검증 + ALLOWED_ADMINS 화이트리스트
  - 외부 페이지 fetch (Chrome UA) → cheerio로 OG 메타 파싱
  - 추출 항목: og:title / og:description / og:site_name / og:image
  - 이미지는 다운로드 후 Supabase Storage `media/press-og/`에 백업 저장 (외부 URL 깨짐 방지)
  - 폴백: Storage 업로드 실패 시 외부 URL 그대로 사용
- `src/lib/admin-auth.ts` — `ALLOWED_ADMINS` + `isAllowedAdmin()` admin layout과 API에서 공통 사용
- `src/components/admin/PressMetaFields.tsx` — 공용 컴포넌트
  - URL 옆 **🔍 정보 가져오기** 버튼 → 자동 채움 (제목·출처·썸네일)
  - 자동 채움은 **빈 필드만** 채워 사용자 입력 보존
  - 직접 업로드 옵션 + 미리보기 + 이미지 제거
- `next.config.ts`에 `*.supabase.co` 이미지 도메인 등록
- 공개 `/notice/press` 리스트형 → **카드형 그리드** (1/2/3열 반응형, 16:9 썸네일, source 배지, 요약 2줄)
- 공개 `/notice/press/[id]` 본문 위 대표 이미지 + `og:image` 메타 추가

### 📋 다음 할 일 / 후속 옵션

- [ ] (선택) 본문 자동 추출 (Mozilla Readability + jsdom) — 저작권/정확도 이슈로 보류 중
- [ ] (선택) 신규 공지·보도자료 폼 취소 시 업로드된 Storage 고아 파일 정리
- [ ] (선택) Supabase RLS 정책에 이메일 화이트리스트 직접 걸기 — 3중 방어
- [ ] 견적서 PDF 확정 버전 — 공급자 빈칸 값 받은 뒤 재생성

---

## 🗂️ 이전 세션 (2026-04-19) — 보안 강화 + 공지 파일첨부

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
- `hero_03.jpg` 메인 배너 — **128KB** (2026-04-28 재인코딩, MozJPEG q75 + LQIP blur)
- `hero_02.jpg` 10주년 배너 — **165KB** (2026-04-28 재인코딩, MozJPEG q75 + LQIP blur)
- `about_list.jpg` 연혁 (708KB)
- `og.jpg` SNS 공유 전용 (168KB, 1200×630)
- `business-education.jpg` (108KB), `business-safety.jpg` (95KB), `business-youth.jpg` (364KB)
- 재인코딩 유틸: `node scripts/optimize-hero.mjs` — 메인+10주년 이미지 일괄 처리 + blurDataURL 자동 생성

### 보안 — 민감 파일 git 히스토리에서 완전 제거
- 입상자 명단 엑셀 → git-filter-repo로 전체 히스토리 rewrite + force push
- 포크 0개 확인 → 외부 유출 없음

## 🗄️ Supabase 스키마

| 테이블 | 용도 | RLS |
|---|---|---|
| notices | 공지사항 (category, pinned, content, **attachments JSONB**) | public read + auth write |
| press | 보도자료 (content + **thumbnail_url**) | public read + auth write |
| gallery | 사진/영상 (media_urls JSONB 배열) | public read + auth write |
| documents | 규정·서식 (file_url OR external_url) | public read + auth write |
| faq | FAQ (sort_order) | public read + auth write |
| programs, competitions | 프로그램/대회 | public read + auth write |

**Storage 버킷**:
- `media` — 갤러리 + **press-og/** (보도자료 OG 썸네일 백업)
- `documents` — 규정·서식 + 공지 첨부
- 둘 다 public read + authenticated write RLS 적용

## 📁 마이그레이션 현황

```
supabase/migrations/
├── 001_initial_schema.sql       (notices, programs, competitions, gallery, press, faq)
├── 002_add_press_content.sql    (press.content 컬럼)
├── 003_add_documents.sql        (documents 테이블)
├── 004_storage_documents_policies.sql  (documents 버킷 RLS)
├── 005_documents_rls.sql        (documents 테이블 RLS)
├── 006_storage_media_policies.sql      (media 버킷 RLS)
├── 007_add_notices_attachments.sql     (notices.attachments JSONB, 2026-04-19)
└── 008_add_press_thumbnail.sql         (press.thumbnail_url TEXT, 2026-04-28)
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
- `next.config.ts` — `*.supabase.co` 이미지 도메인 (2026-04-28)
- `src/lib/constants.ts` — SITE, NAV_ITEMS
- `src/lib/supabase.ts` — 브라우저 + admin 클라이언트
- `src/lib/admin-auth.ts` — `ALLOWED_ADMINS` 화이트리스트 + `isAllowedAdmin()` (admin layout + API route 공통)
- `src/lib/storage-helpers.ts` — 공통 업로드/삭제 유틸
- `src/lib/google-calendar.ts` — Calendar API v3
- `src/lib/database.types.ts` — 타입 정의

### API Routes
- `src/app/api/admin/fetch-og/route.ts` — Bearer 인증 + cheerio OG 메타 추출 + Supabase Storage 백업 (2026-04-28)

### 공통 컴포넌트
- `src/components/shared/PageHeader.tsx` — Breadcrumb + JSON-LD 자동
- `src/components/shared/JsonLd.tsx` — `BreadcrumbJsonLd` 헬퍼
- `src/components/admin/TiptapEditor.tsx` — 리치 에디터
- `src/components/admin/AttachmentUploader.tsx` — 다중 파일 업로더 + 드래그&드롭 + 용량 체크 (2026-04-19)
- `src/components/admin/PressMetaFields.tsx` — 보도자료 URL→OG 자동채움 + 썸네일 업로더 (2026-04-28)
- `src/components/programs/EducationFAQ.tsx` — 심판·강사 교육 공용 FAQ 4건 (2026-05-27)
- `src/components/apply/ApplyForm.tsx` — 종료/마감 차수 자동 처리 + 정원 숫자 숨김 (2026-05-27)
- `src/components/notice/NoticeList.tsx` — 필터+검색+페이지네이션
- `src/components/notice/GalleryLightbox.tsx` — 모달+슬라이드
- `src/components/home/HeroSection.tsx`, `GalleryPreview.tsx`, `LatestNotices.tsx`
- `src/components/festival/HeroSection.tsx` — 10주년 페이지 hero (LQIP blur 적용)

### 운영 스크립트
- `scripts/create-admin.mjs` — 신규 관리자 Supabase auth.users 생성 (service_role)
- `scripts/optimize-hero.mjs` — 메인+10주년 hero 일괄 재인코딩 + blurDataURL 자동 생성

## 🚀 새 채팅 첫 메시지 (복사용)

```
C:\Users\hongk\Desktop\ClaudeCode\ysa-website\HANDOFF.md 읽고 이어서 작업해줘
```
