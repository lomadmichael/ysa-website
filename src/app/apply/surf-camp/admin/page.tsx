import { Fragment } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import {
  adminList,
  getAvailability,
  type ProgramAvailability,
  type SignupStatus,
  type SurfcampAdminRegistration,
  type SurfcampAvailability,
} from '@/lib/surfcamp-db';
import {
  EVENT,
  genderLabel,
  lessonTimeLabel,
  programLabel,
  regionLabel,
  residentTypeLabel,
  statusLabel,
  surfExpLabel,
} from '@/lib/surfcamp-config';
import { needsYouthAssignment } from '@/lib/surfcamp-validate';
import { ADMIN_COOKIE, verifyAdmin } from './auth';
import {
  adminForceCancel,
  adminLogout,
  setCapacityAction,
  setNotesAction,
  setOpenAction,
  setOpenAtAction,
  setProgramGatesAction,
} from './actions';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '서핑캠프 접수 관리',
  robots: { index: false, follow: false },
};

const ADMIN_PATH = '/apply/surf-camp/admin';

/**
 * 액션들은 useActionState 용 (prev, formData) 시그니처다.
 * 이 화면은 서버 컴포넌트라 form action 이 void 를 요구하므로, 초기 state 를 채워 넣고
 * 반환값을 버리는 얇은 어댑터로 감싼다. (실패 안내는 액션이 리디렉트로 전달한다.)
 */
async function forceCancel(formData: FormData): Promise<void> {
  'use server';
  await adminForceCancel({}, formData);
}

async function toggleOpen(formData: FormData): Promise<void> {
  'use server';
  await setOpenAction({}, formData);
}

async function saveCapacity(formData: FormData): Promise<void> {
  'use server';
  await setCapacityAction({}, formData);
}

async function saveOpenAt(formData: FormData): Promise<void> {
  'use server';
  await setOpenAtAction({}, formData);
}

async function saveProgramGates(formData: FormData): Promise<void> {
  'use server';
  await setProgramGatesAction({}, formData);
}

async function saveNotes(formData: FormData): Promise<void> {
  'use server';
  await setNotesAction({}, formData);
}

/**
 * ★ 시각 표기는 전부 서버에서 문자열로 만들어 내려보낸다.
 *   클라이언트에서 toLocaleString 을 부르면 브라우저 타임존에 따라 값이 달라져
 *   하이드레이션이 깨진다. 이 페이지는 force-dynamic 이라 매 요청 서버 렌더된다.
 */
const WEEKDAY_KO: Record<string, string> = {
  Sun: '일',
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
};

/** ISO(UTC) → 한국시간 구성요소. 파싱 실패 시 null. */
function kstParts(iso: string): Record<string, string> | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(d);
  const out: Record<string, string> = {};
  for (const p of parts) out[p.type] = p.value;
  return out;
}

/** ISO(UTC) → 한국시간 'YYYY-MM-DD HH:mm' */
function kstDateTime(iso: string): string {
  const p = kstParts(iso);
  if (!p) return iso ?? '';
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** ISO(UTC) → '8월 10일(월) 09:00' */
function kstFriendly(iso: string): string {
  const p = kstParts(iso);
  if (!p) return iso ?? '';
  const wd = WEEKDAY_KO[p.weekday ?? ''] ?? (p.weekday ?? '');
  return `${Number(p.month)}월 ${Number(p.day)}일(${wd}) ${p.hour}:${p.minute}`;
}

/** ISO(UTC) → datetime-local 입력값 'YYYY-MM-DDTHH:mm' (한국시간 기준) */
function kstInputValue(iso: string): string {
  const p = kstParts(iso);
  if (!p) return '';
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** 남은 초 → '11시간 3분 후' */
function remainLabel(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `약 ${days}일 ${hours}시간 후`;
  if (hours > 0) return `약 ${hours}시간 ${minutes}분 후`;
  if (minutes > 0) return `약 ${minutes}분 후`;
  return '곧';
}

/** 숫자만 저장된 번호를 보기 좋게. 형식이 다르면 원본을 그대로 둔다. */
function formatPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw ?? '';
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function ProgramCard({ title, data }: { title: string; data: ProgramAvailability }) {
  const remain = Math.max(0, data.capacity - data.confirmed);
  // 확정+대기 합계. 게이트(총 상한)의 판정 좌변이며 정원과는 다른 숫자다.
  const total = data.total_taken ?? data.confirmed + data.waitlist;
  const gateOff = data.open === false;
  const capReached = data.total_cap != null && total >= data.total_cap;
  return (
    <div className="rounded-lg border border-foam bg-white p-4">
      <p className="text-[13px] font-bold text-navy/60">{title}</p>
      <p className="mt-1 text-2xl font-bold text-ocean">
        {data.confirmed}
        <span className="text-base font-normal text-navy/50"> / {data.capacity}명 확정</span>
      </p>
      <p className="mt-1 text-[13px] text-navy/70">
        대기 {data.waitlist}명 · 잔여 {remain}명
      </p>
      <p
        className={`mt-1 text-[13px] font-bold ${gateOff || capReached ? 'text-sunset' : 'text-ocean'}`}
      >
        신규접수 {gateOff ? '마감' : capReached ? '상한 도달' : '접수중'}
        <span className="font-normal text-navy/60">
          {' '}
          · 확정+대기 {total}
          {data.total_cap != null ? ` / 총 상한 ${data.total_cap}` : ' (총 상한 없음)'}
        </span>
      </p>
    </div>
  );
}

/**
 * 서핑강습 신청자 중 저연령 배정 대상 여부.
 * 만 11세 미만이면 저연령 강습이 가능한 스쿨로만 배정할 수 있다.
 * (접수 하드 게이트는 만 10세 이상 & 신장 130cm 이상이므로, 여기 걸리는 건 만 10세뿐이다)
 */
function isYouthAssign(p: SurfcampAdminRegistration['participants'][number]): boolean {
  return p.lesson != null && needsYouthAssignment(p.age);
}

/** 저연령 배정 대상 뱃지. 배정 담당자가 명단을 훑으며 걸러낼 수 있어야 한다. */
function YouthChip() {
  return (
    <span className="inline-block rounded bg-sunset/15 px-1.5 py-0.5 text-[11px] font-bold text-sunset">
      저연령
    </span>
  );
}

/** 메모 입력 상한. actions.ts 의 NOTE_MAX 와 같은 값이어야 한다. */
const NOTE_MAX = 500;

/**
 * 메모 보유 뱃지. 「내부」와 「신청자」를 색으로 갈라 놓아, 명단을 훑을 때
 * 신청자에게 무언가 안내가 나가 있는 건인지 한눈에 보이게 한다.
 */
function NoteChip({ kind }: { kind: 'staff' | 'applicant' }) {
  return kind === 'staff' ? (
    <span className="inline-block rounded bg-navy/10 px-1.5 py-0.5 text-[11px] font-bold text-navy/70">
      내부
    </span>
  ) : (
    <span className="inline-block rounded bg-teal/15 px-1.5 py-0.5 text-[11px] font-bold text-ocean">
      신청자 안내
    </span>
  );
}

/** 참가자별 프로그램 상태 뱃지. Tailwind v4 라 동적 클래스명은 쓰지 않는다. */
function SignupChip({ label, status }: { label: string; status: SignupStatus | null }) {
  if (!status) return null;
  const tone =
    status === 'confirmed'
      ? 'bg-teal/15 text-ocean'
      : status === 'waitlist'
        ? 'bg-sunset/15 text-sunset'
        : 'bg-navy/10 text-navy/50';
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>
      {label} {statusLabel(status)}
    </span>
  );
}

export default async function SurfcampAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const store = await cookies();
  if (!verifyAdmin(store.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin />;
  }

  const sp = await searchParams;
  const message = first(sp.m);
  const showCancelled = first(sp.cancelled) === '1';

  let availability: SurfcampAvailability | null = null;
  let rows: SurfcampAdminRegistration[] = [];
  let loadError = '';
  try {
    [availability, rows] = await Promise.all([getAvailability(), adminList(showCancelled)]);
  } catch (e) {
    console.error('[surfcamp] 관리자 명단 조회 실패:', e);
    loadError = '접수 현황을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }

  const activeCount = rows.filter((r) => r.status === 'active').length;
  const cancelledCount = rows.filter((r) => r.status === 'cancelled').length;
  // 저연령 배정 대상은 "신청 건"이 아니라 "사람" 단위로 센다(배정 작업 단위와 같게).
  const youthCount = rows
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => sum + r.participants.filter(isYouthAssign).length, 0);
  // 실질 오픈(open)과 수동 스위치(submissions_open)는 다르다.
  // 예약 시각이 아직 안 지났으면 스위치가 켜져 있어도 접수는 닫혀 있다.
  const isOpen = availability?.open === true;
  const switchOn = availability?.submissions_open === true;
  const openAtIso = availability?.open_at ?? null;
  const opensInSeconds = availability?.opens_in_seconds ?? null;
  /** 예약 시각이 잡혀 있고 아직 오지 않은 상태 */
  const scheduledPending = openAtIso !== null && opensInSeconds !== null;
  const openAtLabel = openAtIso ? kstFriendly(openAtIso) : '';
  const openAtInput = openAtIso ? kstInputValue(openAtIso) : '';
  const remainText = opensInSeconds !== null ? remainLabel(opensInSeconds) : '';

  const statusText = isOpen ? '접수중' : scheduledPending && switchOn ? '오픈 대기' : '마감';
  const statusColor = isOpen ? '#1B9AAA' : '#F27830';

  return (
    <div className="bg-sand min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foam pb-5">
          <div>
            <h1 className="text-xl font-bold text-navy">{EVENT.name} 접수 관리</h1>
            <p className="text-[13px] text-navy/60">
              주최 {EVENT.host} · 주관 {EVENT.organizer}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`${ADMIN_PATH}/export${showCancelled ? '?cancelled=1' : ''}`}
              className="rounded-md bg-ocean px-3 py-2 text-[13px] font-bold text-white hover:bg-ocean-light transition-colors"
            >
              CSV 내려받기
            </a>
            <form action={adminLogout}>
              <button type="submit" className="text-[13px] text-navy/60 underline">
                로그아웃
              </button>
            </form>
          </div>
        </header>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-[14px] text-ocean"
          >
            {message}
          </p>
        )}
        {loadError && (
          <p role="alert" className="mt-5 rounded-md bg-sunset/10 px-4 py-3 text-[14px] text-sunset">
            {loadError}
          </p>
        )}

        {/* ── 현황 ─────────────────────────────────────────────────────────── */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProgramCard
            title="서핑강습"
            data={availability?.lesson ?? { capacity: 0, confirmed: 0, waitlist: 0 }}
          />
          <ProgramCard
            title={programLabel('special')}
            data={availability?.special ?? { capacity: 0, confirmed: 0, waitlist: 0 }}
          />
          <div className="rounded-lg border border-foam bg-white p-4">
            <p className="text-[13px] font-bold text-navy/60">접수 상태</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: statusColor }}>
              {statusText}
            </p>
            {openAtIso && (
              <p className="mt-1 text-[13px] font-bold text-ocean">
                {scheduledPending
                  ? `${openAtLabel} 접수 시작 예정 (${remainText})`
                  : `${openAtLabel} 예약 오픈 시각 경과`}
              </p>
            )}
            <p className="mt-1 text-[13px] text-navy/70">
              신청 {activeCount}건
              {showCancelled ? ` · 취소 ${cancelledCount}건` : ''}
            </p>
            <p className="mt-1 text-[13px] font-bold text-sunset">
              서핑강습 저연령 배정 대상 {youthCount}명
            </p>
          </div>
        </section>

        {/* ── 운영 조작 ────────────────────────────────────────────────────── */}
        <section className="mt-4 flex flex-wrap items-end gap-6 rounded-lg border border-foam bg-white p-4">
          {/* 스위치 자체의 on/off 는 실질 오픈이 아니라 submissions_open 을 따라간다.
              (예약 대기 중에 "접수 다시 열기"가 뜨면 이미 켜진 스위치를 또 켜게 된다) */}
          <form action={toggleOpen} className="flex items-end gap-2">
            <input type="hidden" name="open" value={switchOn ? 'false' : 'true'} />
            <div>
              <p className="mb-1 text-[13px] font-bold text-navy/60">
                접수 오픈/마감 <span className="font-normal">(수동 스위치)</span>
              </p>
              <button
                type="submit"
                className="h-10 rounded-md border border-ocean px-4 text-[14px] font-bold text-ocean hover:bg-ocean hover:text-white transition-colors"
              >
                {switchOn ? '접수 마감하기' : '접수 다시 열기'}
              </button>
            </div>
          </form>

          <form action={saveCapacity} className="flex items-end gap-2">
            <div>
              <label htmlFor="cap-lesson" className="mb-1 block text-[13px] font-bold text-navy/60">
                서핑강습 정원
              </label>
              <input
                id="cap-lesson"
                type="number"
                name="lesson"
                min={0}
                max={9999}
                required
                defaultValue={availability?.lesson.capacity ?? 0}
                className="h-10 w-24 rounded-md border border-foam bg-white px-3 text-[14px] outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="cap-special" className="mb-1 block text-[13px] font-bold text-navy/60">
                {programLabel('special')} 정원
              </label>
              <input
                id="cap-special"
                type="number"
                name="special"
                min={0}
                max={9999}
                required
                defaultValue={availability?.special.capacity ?? 0}
                className="h-10 w-24 rounded-md border border-foam bg-white px-3 text-[14px] outline-none focus:border-teal"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-md border border-ocean px-4 text-[14px] font-bold text-ocean hover:bg-ocean hover:text-white transition-colors"
            >
              정원 저장
            </button>
          </form>

          <p className="text-[12px] text-navy/50">
            정원을 늘리면 대기자가 순서대로 자동 확정되고 안내 문자가 발송됩니다.
          </p>
        </section>

        {/* ── 프로그램별 신규접수 ──────────────────────────────────────────── */}
        <section className="mt-4 rounded-lg border border-foam bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-bold text-navy">프로그램별 신규접수</h2>
            <p className="text-[12px] font-bold text-ocean">
              위의 「정원」과 다릅니다 — 정원을 바꾸면 대기자가 승급되고 확정 문자가
              나가지만, 여기 설정은 승급도 문자도 일으키지 않고 새 신청만 막습니다.
            </p>
          </div>

          <form action={saveProgramGates} className="mt-3 flex flex-wrap items-end gap-6">
            <div>
              <p className="mb-1 text-[13px] font-bold text-navy/60">서핑강습</p>
              <label className="flex h-10 items-center gap-2 text-[14px] text-navy">
                <input
                  type="checkbox"
                  name="lesson_open"
                  defaultChecked={availability?.lesson.open !== false}
                />
                신규 접수 받기
              </label>
            </div>
            <div>
              <label
                htmlFor="gate-lesson-cap"
                className="mb-1 block text-[13px] font-bold text-navy/60"
              >
                서핑강습 총 상한 <span className="font-normal">(확정+대기)</span>
              </label>
              <input
                id="gate-lesson-cap"
                type="number"
                name="lesson_total_cap"
                min={0}
                max={9999}
                placeholder="무제한"
                defaultValue={availability?.lesson.total_cap ?? ''}
                className="h-10 w-28 rounded-md border border-foam bg-white px-3 text-[14px] outline-none focus:border-teal"
              />
            </div>

            <div>
              <p className="mb-1 text-[13px] font-bold text-navy/60">
                {programLabel('special')}
              </p>
              <label className="flex h-10 items-center gap-2 text-[14px] text-navy">
                <input
                  type="checkbox"
                  name="special_open"
                  defaultChecked={availability?.special.open !== false}
                />
                신규 접수 받기
              </label>
            </div>
            <div>
              <label
                htmlFor="gate-special-cap"
                className="mb-1 block text-[13px] font-bold text-navy/60"
              >
                {programLabel('special')} 총 상한{' '}
                <span className="font-normal">(확정+대기)</span>
              </label>
              <input
                id="gate-special-cap"
                type="number"
                name="special_total_cap"
                min={0}
                max={9999}
                placeholder="무제한"
                defaultValue={availability?.special.total_cap ?? ''}
                className="h-10 w-28 rounded-md border border-foam bg-white px-3 text-[14px] outline-none focus:border-teal"
              />
            </div>

            <button
              type="submit"
              className="h-10 rounded-md border border-ocean px-4 text-[14px] font-bold text-ocean hover:bg-ocean hover:text-white transition-colors"
            >
              신규접수 설정 저장
            </button>
          </form>

          <ul className="mt-3 space-y-1 text-[12px] text-navy/50">
            <li>
              · 체크를 끄면 그 프로그램의 <strong className="text-navy/70">새 신청만</strong>{' '}
              막힙니다. 이미 접수된 확정·대기는 그대로 유지되고, 취소가 발생하면 대기자는
              순번대로 자동 확정됩니다.
            </li>
            <li>
              · 총 상한은 <strong className="text-navy/70">확정+대기 합계</strong> 기준입니다.
              비워 두면 무제한이며, 합계가 상한에 닿으면 새 신청을 받지 않습니다. 상한을
              낮춰도 이미 접수된 건은 취소되지 않습니다.
            </li>
            <li>
              · 두 프로그램을 모두 끄면 신청 폼 자리에 마감 안내가 표시됩니다.
            </li>
          </ul>
        </section>

        {/* ── 예약 오픈 ────────────────────────────────────────────────────── */}
        <section className="mt-4 rounded-lg border border-foam bg-white p-4">
          <div className="flex flex-wrap items-end gap-6">
            <form action={saveOpenAt} className="flex items-end gap-2">
              <div>
                <label htmlFor="open-at" className="mb-1 block text-[13px] font-bold text-navy/60">
                  예약 오픈 시각 <span className="font-normal">(한국시간)</span>
                </label>
                <input
                  id="open-at"
                  type="datetime-local"
                  name="open_at"
                  required
                  defaultValue={openAtInput}
                  className="h-10 rounded-md border border-foam bg-white px-3 text-[14px] outline-none focus:border-teal"
                />
              </div>
              <button
                type="submit"
                className="h-10 rounded-md border border-ocean px-4 text-[14px] font-bold text-ocean hover:bg-ocean hover:text-white transition-colors"
              >
                예약 저장
              </button>
            </form>

            {/* 해제는 입력값이 필요 없으므로 별도 폼으로 둔다(필수 입력 검증에 걸리지 않게) */}
            <form action={saveOpenAt}>
              <input type="hidden" name="intent" value="clear" />
              <button
                type="submit"
                disabled={!openAtIso}
                className="h-10 rounded-md border border-foam px-4 text-[14px] font-bold text-navy/60 transition-colors hover:border-sunset hover:text-sunset disabled:cursor-not-allowed disabled:opacity-40"
              >
                예약 해제
              </button>
            </form>
          </div>

          {switchOn && scheduledPending ? (
            <p
              role="status"
              className="mt-3 rounded-md border border-sunset/40 bg-sunset/10 px-3 py-2 text-[13px] font-bold text-sunset"
            >
              접수 스위치는 켜져 있지만 예약 시각까지는 닫혀 있습니다. {openAtLabel}(
              {remainText})에 자동으로 열립니다.
            </p>
          ) : !switchOn && openAtIso ? (
            <p
              role="status"
              className="mt-3 rounded-md border border-sunset/40 bg-sunset/10 px-3 py-2 text-[13px] font-bold text-sunset"
            >
              예약 시각이 잡혀 있지만 접수 스위치가 꺼져 있어 자동으로 열리지 않습니다. 스위치를 켜
              주세요.
            </p>
          ) : (
            <p className="mt-3 text-[12px] text-navy/50">
              예약 시각을 지정하고 접수 스위치를 켜 두면 그 시각부터 접수가 자동으로 열립니다. 예약을
              해제하면 스위치만으로 판단합니다. 마감은 예약과 무관하게 스위치로 즉시 적용됩니다.
            </p>
          )}
        </section>

        {/* ── 명단 ─────────────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy">
            신청 명단 <span className="text-[14px] font-normal text-navy/60">{rows.length}건</span>
          </h2>
          <a
            href={showCancelled ? ADMIN_PATH : `${ADMIN_PATH}?cancelled=1`}
            className="text-[13px] text-ocean underline"
          >
            {showCancelled ? '취소 건 숨기기' : '취소 건도 보기'}
          </a>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 rounded-lg border border-foam bg-white p-6 text-center text-[14px] text-navy/60">
            아직 신청이 없습니다.
          </p>
        ) : (
          // 좁은 화면에서 표가 페이지 전체를 가로로 밀지 않도록 표만 따로 스크롤시킨다.
          <div className="mt-4 overflow-x-auto rounded-lg border border-foam bg-white">
            <table className="w-full min-w-[1100px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-foam text-left text-navy/60">
                  <th className="px-3 py-2 font-bold">접수일시</th>
                  <th className="px-3 py-2 font-bold">대표자</th>
                  <th className="px-3 py-2 font-bold">연락처</th>
                  <th className="px-3 py-2 font-bold">구분</th>
                  <th className="px-3 py-2 font-bold">권역</th>
                  <th className="px-3 py-2 font-bold">강습시간</th>
                  <th className="px-3 py-2 font-bold">참가자</th>
                  <th className="px-3 py-2 font-bold">메모</th>
                  <th className="px-3 py-2 font-bold">상태</th>
                  <th className="px-3 py-2 font-bold">강제취소</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cancelled = r.status === 'cancelled';
                  const hasNote = Boolean(r.staff_note || r.applicant_notice);
                  return (
                    <Fragment key={r.id}>
                    <tr
                      className={`align-top ${cancelled ? 'text-navy/40' : 'text-navy'}`}
                    >
                      <td className="whitespace-nowrap px-3 py-3">{kstDateTime(r.created_at)}</td>
                      <td className="px-3 py-3 font-bold">{r.rep_name}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatPhone(r.phone)}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {residentTypeLabel(r.resident_type)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{regionLabel(r.region)}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {lessonTimeLabel(r.lesson_time)}
                      </td>
                      <td className="px-3 py-3">
                        <ul className="space-y-1.5">
                          {r.participants.map((p) => (
                            <li key={p.id} className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold">{p.name}</span>
                              <span className="text-navy/60">
                                {genderLabel(p.gender)} · 만 {p.age}세 · {p.height_cm}cm ·{' '}
                                {p.weight_kg}kg · {surfExpLabel(p.surf_exp)}
                              </span>
                              <SignupChip label="강습" status={p.lesson} />
                              <SignupChip label="특화" status={p.special} />
                              {isYouthAssign(p) && <YouthChip />}
                            </li>
                          ))}
                        </ul>
                        {r.note && <p className="mt-1.5 text-[12px] text-navy/50">비고: {r.note}</p>}
                      </td>
                      <td className="px-3 py-3">
                        {hasNote ? (
                          <div className="flex flex-wrap gap-1">
                            {r.staff_note && <NoteChip kind="staff" />}
                            {r.applicant_notice && <NoteChip kind="applicant" />}
                          </div>
                        ) : (
                          <span className="text-[12px] text-navy/40">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {cancelled ? (
                          <span className="text-[12px] font-bold text-navy/50">
                            취소
                            {r.cancelled_by === 'admin' ? '(관리자)' : ''}
                            {r.cancelled_at ? ` · ${kstDateTime(r.cancelled_at)}` : ''}
                          </span>
                        ) : (
                          <span className="text-[12px] font-bold text-ocean">신청</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {cancelled ? (
                          <span className="text-[12px] text-navy/40">-</span>
                        ) : (
                          <form action={forceCancel} className="flex items-center gap-1.5">
                            <input type="hidden" name="registration_id" value={r.id} />
                            <input
                              type="text"
                              name="reason"
                              required
                              maxLength={100}
                              placeholder="취소 사유(필수)"
                              aria-label={`${r.rep_name} 신청 취소 사유`}
                              className="h-8 w-36 rounded border border-foam px-2 text-[12px] outline-none focus:border-teal"
                            />
                            <button
                              type="submit"
                              className="h-8 whitespace-nowrap rounded border border-sunset px-2 text-[12px] font-bold text-sunset hover:bg-sunset hover:text-white transition-colors"
                            >
                              취소
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>

                    {/* 메모 편집 — 표 행을 무겁게 만들지 않도록 접어 둔다.
                        (details 는 네이티브라 서버 컴포넌트에서도 그대로 동작한다) */}
                    <tr className="border-b border-foam">
                      <td colSpan={10} className="px-3 pb-3">
                        <details className="rounded-md border border-foam bg-sand/60 px-3 py-2">
                          <summary className="cursor-pointer text-[12px] font-bold text-navy/70">
                            메모 {hasNote ? '보기 · 수정' : '작성'} — {r.rep_name}
                          </summary>

                          <form action={saveNotes} className="mt-3 space-y-3">
                            <input type="hidden" name="registration_id" value={r.id} />

                            <div className="grid gap-3 lg:grid-cols-2">
                              {/* 내부 전용 */}
                              <div className="rounded-md border border-navy/20 bg-white p-3">
                                <label
                                  htmlFor={`staff-note-${r.id}`}
                                  className="block text-[12px] font-bold text-navy"
                                >
                                  🔒 운영 메모 <span className="text-navy/60">(내부 전용)</span>
                                </label>
                                <p className="mt-0.5 text-[11px] text-navy/50">
                                  신청자에게 보이지 않습니다. 배정 참고·연락 이력 등을 적어 주세요.
                                </p>
                                <textarea
                                  id={`staff-note-${r.id}`}
                                  name="staff_note"
                                  rows={4}
                                  maxLength={NOTE_MAX}
                                  defaultValue={r.staff_note ?? ''}
                                  placeholder="예) 8/9 통화 — 김준우만 15:00 희망. 배정 시 참고."
                                  className="mt-2 w-full rounded border border-foam bg-white px-2 py-1.5 text-[12px] leading-relaxed outline-none focus:border-teal"
                                />
                              </div>

                              {/* 신청자에게 그대로 보이는 값 */}
                              <div className="rounded-md border border-teal bg-teal/5 p-3">
                                <label
                                  htmlFor={`applicant-notice-${r.id}`}
                                  className="block text-[12px] font-bold text-ocean"
                                >
                                  👁 신청자 안내{' '}
                                  <span className="text-ocean/70">(신청자에게 그대로 보임)</span>
                                </label>
                                <p className="mt-0.5 text-[11px] font-bold text-sunset">
                                  여기에 적은 내용은 신청 조회 화면에 그대로 표시됩니다. 내부용
                                  메모를 적지 마세요.
                                </p>
                                <textarea
                                  id={`applicant-notice-${r.id}`}
                                  name="applicant_notice"
                                  rows={4}
                                  maxLength={NOTE_MAX}
                                  defaultValue={r.applicant_notice ?? ''}
                                  placeholder="예) 요청하신 15:00 반 배정은 확정되었습니다."
                                  className="mt-2 w-full rounded border border-teal/50 bg-white px-2 py-1.5 text-[12px] leading-relaxed outline-none focus:border-teal"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="submit"
                                className="h-8 rounded border border-ocean px-3 text-[12px] font-bold text-ocean transition-colors hover:bg-ocean hover:text-white"
                              >
                                메모 저장
                              </button>
                              <span className="text-[11px] text-navy/50">
                                두 칸을 함께 저장합니다. 비워 두면 해당 메모가 지워집니다. (각 최대{' '}
                                {NOTE_MAX}자)
                              </span>
                            </div>
                          </form>
                        </details>
                      </td>
                    </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-[12px] text-navy/50">
          취소 사유는 신청자에게 발송되는 안내 문자에 그대로 포함됩니다. 취소 버튼은 되돌릴 수 없으니
          사유를 확인한 뒤 눌러 주세요.
        </p>
      </div>
    </div>
  );
}
