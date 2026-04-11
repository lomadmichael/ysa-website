import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { IconSafety, IconRescue, IconEducation } from '@/components/icons';

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
          <div className="max-w-6xl mb-16">
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
                <IconSafety className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">해양 안전 교육</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                이안류 대처, 응급처치, 심폐소생술 등 바다에서 필요한 안전 지식과 기술을 교육합니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-5">
                <IconRescue className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">비치클린 캠페인</h3>
              <p className="text-navy/60 text-sm leading-relaxed">
                정기적인 해변 정화 활동과 환경 보호 캠페인을 통해 깨끗한 해양 환경을 유지합니다.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <div className="w-12 h-12 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center mb-5">
                <IconEducation className="w-6 h-6" />
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
