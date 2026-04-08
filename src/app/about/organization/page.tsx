import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: '조직도',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '조직도' },
];

export default function OrganizationPage() {
  return (
    <>
      <PageHeader title="조직도" breadcrumbs={BREADCRUMBS} />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* 조직도 이미지 플레이스홀더 */}
          <div className="bg-foam rounded-2xl border border-foam min-h-[400px] md:min-h-[500px] flex items-center justify-center mb-16">
            <div className="text-center text-navy/40">
              <svg
                className="w-20 h-20 mx-auto mb-4 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                />
              </svg>
              <p className="text-base font-medium">조직도 이미지</p>
              <p className="text-sm mt-1">준비 중입니다</p>
            </div>
          </div>

          {/* 연락처 정보 */}
          <div className="bg-white rounded-2xl border border-foam p-8 md:p-10">
            <h2 className="text-xl font-bold text-navy mb-6">연락처 안내</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-navy/50 mb-1">전화번호</p>
                  <p className="text-navy font-medium">{SITE.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-navy/50 mb-1">이메일</p>
                  <p className="text-navy font-medium">{SITE.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
