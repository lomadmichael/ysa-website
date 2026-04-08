import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '심판 교육',
  description: '양양군서핑협회 심판 교육 프로그램 - 공정하고 전문적인 경기 운영을 위한 교육',
};

const CURRICULUM = [
  { title: '경기 규칙', desc: '서핑 경기 공식 규칙 및 진행 절차' },
  { title: '채점 기준', desc: '기술 점수, 난이도 평가, 감점 기준' },
  { title: '안전 관리', desc: '경기 중 안전 사고 대응 및 관리' },
  { title: '경기 운영', desc: '히트 편성, 시간 관리, 결과 발표' },
  { title: '실습 평가', desc: '모의 경기 심판 실습 및 평가' },
];

export default function RefereePage() {
  return (
    <>
      <PageHeader
        title="심판 교육"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '프로그램 안내', href: '/programs' },
          { label: '심판 교육' },
        ]}
        description="심판 교육은 공정하고 전문적인 경기 운영을 위한 교육 과정입니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Placeholder image */}
              <div className="w-full aspect-[16/9] bg-foam rounded-2xl mb-12 flex items-center justify-center">
                <p className="text-navy/30 text-lg">심판 교육 현장 이미지</p>
              </div>

              <h2 className="text-2xl font-bold text-navy mb-6">교육 목적</h2>
              <p className="text-navy/70 leading-relaxed mb-10">
                양양군서핑협회의 심판 교육은 서핑 대회의 공정성과 전문성을 확보하기 위한
                심판 인력 양성 프로그램입니다. 국제 기준에 부합하는 채점 능력과
                경기 운영 역량을 갖춘 심판을 배출하여 대회의 수준을 높이고,
                선수들에게 신뢰받는 경기 환경을 조성하는 것을 목표로 합니다.
              </p>

              <h2 className="text-2xl font-bold text-navy mb-6">교육 내용</h2>
              <div className="space-y-4 mb-10">
                {CURRICULUM.map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-white rounded-xl border border-foam">
                    <div className="w-8 h-8 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy mb-1">{item.title}</h4>
                      <p className="text-sm text-navy/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-2xl font-bold text-navy mb-6">자격 요건</h2>
              <p className="text-navy/70 leading-relaxed">
                서핑 경기에 대한 이해와 기본적인 서핑 경험이 있는 분이라면 누구나 지원할 수 있습니다.
                교육 수료 후 실기 평가를 통과하면 양양군서핑협회 공인 심판 자격이 부여됩니다.
              </p>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 border border-foam sticky top-24">
                <h3 className="text-lg font-bold text-navy mb-6">교육 개요</h3>
                <dl className="space-y-5">
                  <div>
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">모집 대상</dt>
                    <dd className="text-sm text-navy font-medium">서핑 경기 이해도가 있는 만 18세 이상</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">교육 기간</dt>
                    <dd className="text-sm text-navy font-medium">별도 공지</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">교육 장소</dt>
                    <dd className="text-sm text-navy font-medium">양양 해양종합레포츠센터</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">준비물</dt>
                    <dd className="text-sm text-navy font-medium">필기도구, 운동복</dd>
                  </div>
                  <div className="border-t border-foam pt-5">
                    <dt className="text-xs text-navy/40 uppercase tracking-wider mb-1">수료 기준</dt>
                    <dd className="text-sm text-navy font-medium">이론 + 실습 평가 통과</dd>
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
