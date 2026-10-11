import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import PageHeader from '@/components/shared/PageHeader';
import { listEduApplications, type EduApplication } from '@/lib/edu-db';
import { verifySession } from '@/lib/edu-otp';
import OtpGate from './OtpGate';
import EduMyContent from './EduMyContent';

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

type SearchParams = Promise<{ cancelled?: string | string[] }>;

export default async function EducationMyPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const cancelledId = typeof sp.cancelled === 'string' ? sp.cancelled : undefined;
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

      <section className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        {!phone ? (
          <OtpGate />
        ) : (
          <EduMyContent
            phone={phone}
            applications={applications}
            loadError={loadError}
            cancelledId={cancelledId}
          />
        )}
      </section>
    </>
  );
}
