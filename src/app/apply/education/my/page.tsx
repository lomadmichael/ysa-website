import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PageHeader from '@/components/shared/PageHeader';
import { listEduApplications, type EduApplication } from '@/lib/edu-db';
import { verifySession } from '@/lib/edu-otp';
import OtpGate from './OtpGate';
import CancelButton from './CancelButton';
import { logoutEduMy } from './actions';

/**
 * 심판(REF)·강사(INS)교육 — 비회원 신청자 본인 신청 확인 · 취소.
 *
 * 신청 원장은 cert-manager(golineup.kr)에 있고, 여기서는 OTP 로 번호 소유만 확인한 뒤
 * 서버 간 API 로 조회·취소한다. 개인 신청 내역이라 캐시·색인하지 않는다.
 * ★ 서버 컴포넌트에서는 쿠키를 읽기만 한다. set/delete 는 actions.ts 에서만.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '교육 신청 확인 · 취소',
  robots: { index: false, follow: false },
};

/** actions.ts 와 같은 값. 'use server' 파일은 상수를 export 할 수 없어 다시 적는다. */
const COOKIE = 'edu_my';
const INQUIRY_TEL = '033-671-6155';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** "YYYY-MM-DD" → { y, m, d, dow } — 요일은 날짜로 계산(하드코딩 금지). */
function parseDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dow = DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { y, m, d, dow };
}

/** "10월 24일(토) ~ 25일(일)" (같은 달이면 종료의 월 생략, 같은 날이면 하나만) */
function formatRange(startISO: string, endISO: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(startISO) || !/^\d{4}-\d{2}-\d{2}/.test(endISO)) {
    return `${startISO} ~ ${endISO}`;
  }
  const s = parseDate(startISO);
  const e = parseDate(endISO);
  const start = `${s.m}월 ${s.d}일(${s.dow})`;
  if (startISO.slice(0, 10) === endISO.slice(0, 10)) return start;
  if (s.y !== e.y) return `${s.y}년 ${start} ~ ${e.y}년 ${e.m}월 ${e.d}일(${e.dow})`;
  const end = s.m === e.m ? `${e.d}일(${e.dow})` : `${e.m}월 ${e.d}일(${e.dow})`;
  return `${start} ~ ${end}`;
}

function certLabel(certType: string): string {
  return certType === 'REF' ? '심판교육' : certType === 'INS' ? '강사교육' : '교육';
}

function StatusBadge({ app }: { app: EduApplication }) {
  const map = {
    confirmed: { text: '확정', cls: 'bg-teal/10 text-teal' },
    waitlisted: {
      text: app.waitlist_order != null ? `대기 ${app.waitlist_order}번` : '대기',
      cls: 'bg-sunset/10 text-sunset',
    },
    cancelled: { text: '취소됨', cls: 'bg-gray-100 text-gray-500' },
  } as const;
  const v = map[app.status] ?? map.cancelled;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.cls}`}>
      {v.text}
    </span>
  );
}

export default async function EducationMyPage() {
  const store = await cookies();
  const phone = verifySession(store.get(COOKIE)?.value);

  let applications: EduApplication[] = [];
  let loadError = '';
  if (phone) {
    try {
      applications = await listEduApplications(phone);
    } catch (e) {
      console.error('[edu-my] list failed:', e);
      loadError = '신청 내역을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
    }
  }

  return (
    <>
      <PageHeader
        title="교육 신청 확인 · 취소"
        description="심판·강사교육 접수에 사용하신 휴대폰 번호로 본인 인증 후 신청 내역을 확인하고 취소할 수 있습니다."
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '온라인 접수', href: '/apply' },
          { label: '교육 신청 확인' },
        ]}
      />

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        {!phone ? (
          <OtpGate />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-navy/60">본인 인증됨</p>
              <form action={logoutEduMy}>
                <button
                  type="submit"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-navy/70 transition hover:bg-gray-50"
                >
                  로그아웃
                </button>
              </form>
            </div>

            {loadError && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {loadError}
              </p>
            )}

            {!loadError && applications.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-lg font-bold text-navy">
                  이 번호로 접수된 심판·강사교육 신청이 없습니다
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-navy/60">
                  아직 신청하지 않으셨거나 이미 종료된 교육일 수 있습니다.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link
                    href="/apply/referee"
                    className="inline-flex items-center justify-center rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90"
                  >
                    심판교육 접수
                  </Link>
                  <Link
                    href="/apply/instructor"
                    className="inline-flex items-center justify-center rounded-lg border border-purple px-5 py-2.5 text-sm font-bold text-purple transition hover:bg-purple/5"
                  >
                    강사교육 접수
                  </Link>
                </div>
              </div>
            )}

            {applications.length > 0 && (
              <ul className="space-y-4">
                {applications.map((app) => {
                  const label = `${app.round}차 ${certLabel(app.cert_type)}`;
                  return (
                    <li
                      key={app.id}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold text-navy">
                            {certLabel(app.cert_type)} {app.round}차
                          </h2>
                          <p className="mt-1 text-sm text-navy/70">
                            {formatRange(app.start_date, app.end_date)}
                          </p>
                        </div>
                        <StatusBadge app={app} />
                      </div>

                      {app.status !== 'cancelled' && (
                        <div className="mt-5 border-t border-gray-100 pt-4">
                          {app.cancellable ? (
                            <CancelButton applicationId={app.id} label={label} />
                          ) : (
                            <p className="text-sm text-navy/60">
                              {app.cancel_block_reason ?? '온라인 취소가 불가합니다.'} (문의{' '}
                              {INQUIRY_TEL})
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="text-center text-xs text-navy/50">
              문의 양양군서핑협회 {INQUIRY_TEL}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
