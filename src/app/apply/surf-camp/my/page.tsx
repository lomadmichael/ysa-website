import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PageHeader from '@/components/shared/PageHeader';
import { lookupByPhone, type SurfcampRegistration } from '@/lib/surfcamp-db';
import { verifySession } from '@/lib/surfcamp-otp';
import { EVENT, INQUIRY_TEL } from '@/lib/surfcamp-config';
import OtpGate from './OtpGate';
import EditForm from './EditForm';
import { logoutMy } from './actions';

/**
 * 2026 양양 서핑캠프 — 본인 신청 조회 · 수정 · 취소.
 *
 * 개인 신청 내역을 다루는 화면이라 캐시하지 않고 검색엔진에도 노출하지 않는다.
 * ★ 서버 컴포넌트에서는 쿠키를 읽기만 한다. set/delete 는 서버 액션(actions.ts)에서만 가능하다.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '서핑캠프 신청 조회',
  robots: { index: false, follow: false },
};

/** actions.ts 와 같은 값. 'use server' 파일은 상수를 export 할 수 없어 여기에 다시 적는다. */
const COOKIE = 'surfcamp_my';

export default async function SurfCampMyPage() {
  const store = await cookies();
  const phone = verifySession(store.get(COOKIE)?.value);

  let registrations: SurfcampRegistration[] = [];
  let loadError = '';
  if (phone) {
    try {
      registrations = await lookupByPhone(phone);
    } catch (e) {
      console.error('[surfcamp] my lookup failed:', e);
      loadError = '신청 내역을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
    }
  }

  // lookupByPhone 은 활성 신청만 돌려준다(한 번호당 최대 1건).
  const registration = registrations[0] ?? null;

  return (
    <>
      <PageHeader
        title="신청 조회 · 수정 · 취소"
        description={`${EVENT.name} — 접수하신 휴대폰 번호로 본인 인증 후 신청 내용을 확인하고 수정하거나 취소할 수 있습니다.`}
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '온라인 접수', href: '/apply' },
          { label: '2026 양양 서핑캠프', href: '/apply/surf-camp' },
          { label: '신청 조회' },
        ]}
      />

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        {!phone ? (
          <OtpGate />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-navy/60">본인 인증됨</p>
              <form action={logoutMy}>
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

            {!loadError && !registration && (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-lg font-bold text-navy">
                  해당 번호로 접수된 신청이 없습니다
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-navy/60">
                  아직 신청하지 않으셨거나 이미 취소된 신청일 수 있습니다.
                  <br />
                  접수 기간 중에는 아래에서 새로 신청하실 수 있습니다.
                </p>
                <p className="mt-4 text-sm text-navy/60">문의: {INQUIRY_TEL}</p>
                <Link
                  href="/apply/surf-camp"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90"
                >
                  접수 페이지로
                </Link>
              </div>
            )}

            {registration && (
              // 수정/취소 후 갱신된 값으로 폼 초기값을 다시 잡도록 updated_at 을 key 에 넣는다.
              <EditForm
                key={`${registration.id}:${registration.updated_at}`}
                registration={registration}
              />
            )}
          </div>
        )}
      </section>
    </>
  );
}
