import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '안전문화 조성',
  description: '양양군서핑협회의 안전문화 조성 사업 - 해양 안전 교육, 비치클린, 서핑 에티켓',
};

export default function SafetyPage() {
  return (
    <>
      <PageHeader
        title="안전문화 조성"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '협회사업', href: '/business' },
          { label: '안전문화 조성' },
        ]}
        description="해양 안전 교육, 비치클린 캠페인, 서핑 에티켓 홍보 등을 통해 안전하고 건강한 서핑 문화를 만들어갑니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Intro */}
          <div className="max-w-3xl mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
              안전한 바다, 건강한 서핑문화
            </h2>
            <p className="text-navy/70 leading-relaxed">
              양양군서핑협회는 서퍼와 해변 이용객 모두가 안전하게 바다를 즐길 수 있도록
              다양한 안전 교육과 캠페인을 진행하고 있습니다.
              서핑 에티켓 교육, 해양 안전 수칙 보급, 비치클린 활동을 통해
              지속 가능한 해양 환경을 지켜나갑니다.
            </p>
          </div>

          {/* Placeholder image */}
          <div className="w-full aspect-[21/9] bg-foam rounded-2xl mb-16 flex items-center justify-center">
            <p className="text-navy/30 text-lg">안전문화 활동 이미지</p>
          </div>

          {/* Safety Areas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <div className="w-12 h-12 rounded-xl bg-sunset/10 text-sunset flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">해양 안전 교육</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                이안류 대처, 응급처치, 심폐소생술 등 바다에서 필요한 안전 지식과 기술을 교육합니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 1 0 6.72 14.94M12.75 3.031a9 9 0 0 1 6.72 14.94m0 0-.177.823A3 3 0 0 1 16.5 21H13.5a3 3 0 0 1-2.793-1.896" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">비치클린 캠페인</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                정기적인 해변 정화 활동과 환경 보호 캠페인을 통해 깨끗한 해양 환경을 유지합니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <div className="w-12 h-12 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">서핑 에티켓 교육</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                파도 위 우선권, 라인업 매너, 초보자 배려 등 서퍼 간 지켜야 할 예의와 규칙을 알립니다.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/programs/specialized"
              className="inline-flex items-center gap-2 bg-teal text-white px-8 py-4 rounded-xl font-medium hover:bg-ocean transition-colors"
            >
              서핑특화 프로그램 보기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
