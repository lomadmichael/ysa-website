import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '협회사업',
  description: '양양군서핑협회의 주요 사업 영역 - 대회 운영, 교육 운영, 선수·청소년 육성, 안전문화 조성',
};

const BUSINESS_AREAS = [
  {
    title: '대회 운영',
    description: '공정하고 안전한 서핑 대회를 기획하고 운영합니다. 전국 규모의 대회부터 지역 친선 대회까지, 서퍼들이 실력을 겨루고 성장할 수 있는 무대를 만듭니다.',
    href: '/business',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.02 6.02 0 0 1-7.54 0" />
      </svg>
    ),
  },
  {
    title: '교육 운영',
    description: '강사 양성, 심판 교육, 서핑특화 프로그램 등 체계적인 교육 과정을 운영하여 서핑 전문인력을 양성하고 서핑 문화의 질적 성장을 도모합니다.',
    href: '/business/education',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: '선수·청소년 육성',
    description: '유망 선수 발굴과 청소년 서핑 교육을 통해 양양 서핑의 미래를 준비합니다. 체계적인 훈련 프로그램과 대회 참가 지원으로 선수들의 성장을 돕습니다.',
    href: '/business/youth',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    title: '안전문화 조성',
    description: '해양 안전 교육, 비치클린 캠페인, 서핑 에티켓 홍보 등을 통해 안전하고 건강한 서핑 문화를 만들어갑니다.',
    href: '/business/safety',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
];

export default function BusinessPage() {
  return (
    <>
      <PageHeader
        title="협회사업"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '협회사업' },
        ]}
        description="양양군서핑협회는 대회 운영, 교육 프로그램, 선수·청소년 육성, 안전문화 조성을 통해 양양의 서핑문화를 지속적으로 확장하고 있습니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {BUSINESS_AREAS.map((area) => (
              <Link
                key={area.title}
                href={area.href}
                className="group bg-white rounded-2xl p-8 border border-foam hover:border-teal/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-6 group-hover:bg-teal group-hover:text-white transition-colors duration-300">
                  {area.icon}
                </div>
                <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-ocean transition-colors">
                  {area.title}
                </h3>
                <p className="text-navy/60 leading-relaxed text-sm">
                  {area.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-teal text-sm font-medium">
                  <span>자세히 보기</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
