import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '강사 교육',
  description: '양양군서핑협회 강사 교육 프로그램 - ISA 기준 전문 서핑 강사 양성',
};

const CURRICULUM = [
  { title: '서핑 이론', desc: '파도의 원리, 해양 기상, 조류 이해' },
  { title: '안전 관리', desc: '응급처치, 심폐소생술, 이안류 대처법' },
  { title: '지도 기법', desc: '초급~중급 단계별 지도법, 피드백 기법' },
  { title: '실기 평가', desc: '파도 라이딩 실기, 데모 시범 평가' },
  { title: '현장 실습', desc: '실제 교육 현장에서의 지도 실습' },
];

export default function InstructorPage() {
  return (
    <>
      <PageHeader
        title="강사 교육"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '프로그램 안내', href: '/programs' },
          { label: '강사 교육' },
        ]}
        description="강사 교육은 양양의 서핑 서비스 품질과 안전성을 높이기 위한 전문인력 양성 프로그램입니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Placeholder image */}
              <div className="w-full aspect-[16/9] bg-foam rounded-2xl mb-12 flex items-center justify-center">
                <p className="text-navy/30 text-lg">강사 교육 현장 이미지</p>
              </div>

              <h2 className="text-2xl font-bold text-navy mb-6">교육 목적</h2>
              <p className="text-navy/70 leading-relaxed mb-10">
                양양군서핑협회의 강사 교육은 ISA(국제서핑협회) 기준에 부합하는
                전문 서핑 강사를 양성하는 프로그램입니다.
                안전한 서핑 교육 환경을 조성하고, 체계적인 지도 역량을 갖춘
                전문 강사를 배출하여 양양 서핑 산업의 서비스 품질을 높이는 것을 목표로 합니다.
              </p>

              <h2 className="text-2xl font-bold text-navy mb-6">교육 내용</h2>
              <div className="space-y-4 mb-10">
                {CURRICULUM.map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white rounded-xl border border-foam">
                    <div className="w-8 h-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">{item.title}</h4>
                      <p className="text-sm text-navy/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-navy mb-6">강사진</h2>
              <p className="text-navy/70 leading-relaxed mb-10">
                ISA 자격을 보유한 국내 최고 수준의 강사진이 교육을 진행합니다.
                풍부한 현장 경험과 전문 지식을 바탕으로 실질적이고 체계적인 교육을 제공합니다.
              </p>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 border border-foam sticky top-24">
                <h3 className="text-lg font-bold text-navy mb-6">교육 개요</h3>
                <dl className="space-y-5">
                  <div>
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">모집 대상</dt>
                    <dd className="text-sm text-navy font-medium">만 18세 이상 서핑 경력자</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">교육 기간</dt>
                    <dd className="text-sm text-navy font-medium">5일 / 30시간</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">교육 장소</dt>
                    <dd className="text-sm text-navy font-medium">양양 죽도해변 및 교육장</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">준비물</dt>
                    <dd className="text-sm text-navy font-medium">수영복, 래쉬가드, 수건, 자외선 차단제</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">수료 기준</dt>
                    <dd className="text-sm text-navy font-medium">이론 + 실기 평가 통과</dd>
                  </div>
                </dl>

                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 w-full flex items-center justify-center gap-2 bg-sunset text-white px-6 py-4 rounded-xl font-medium hover:bg-sunset/90 transition-colors"
                >
                  외부 신청폼
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
