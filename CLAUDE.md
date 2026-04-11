@AGENTS.md

## Google Calendar 연동

**방식**: Calendar API v3 + API Key (공개 iCal 피드 사용 안 함)

**이유**: 공개 iCal 피드는 Google 측 캐시로 수정/삭제 반영이 수 시간~수 일 지연됨. 시즌 운영 중 취소/변경 실시간 반영이 필수라 API로 전환.

**필수 환경변수**:
- `GOOGLE_CALENDAR_API_KEY` — Google Cloud Console에서 발급 (Calendar API 활성화 후 Credentials → API key)
- Vercel: Production / Development 환경에 설정 완료
- 로컬: `.env.local`에 설정 (이 파일은 gitignore)

**캐시 정책**: `revalidate: 300` (5분). 캘린더 수정 시 최대 5분 내 사이트 반영.

**관련 파일**:
- `src/lib/google-calendar.ts` — Calendar API 페칭 + 파싱
- `src/lib/calendar-utils.ts` — 순수 유틸 (클라이언트 안전)
- `.env.local.example` — 환경변수 템플릿

**연동 캘린더 2개** (`DEFAULT_CALENDAR_IDS`):
1. 서핑협회 일정 (대회/교육) — `fecd0424...@group.calendar.google.com`
2. 서핑협회 접수일정 (후반기 프로그램) — `58339465...@group.calendar.google.com`

`NEXT_PUBLIC_GOOGLE_CALENDAR_IDS` 환경변수(쉼표 구분)로 오버라이드 가능.
