import type { Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { IconCompetition, IconEducation, IconYouth, IconSafety } from '@/components/icons';

export const metadata: Metadata = {
  title: '협회사업',
  description: '양양군서핑협회의 주요 사업 영역 - 대회 운영, 교육 운영, 선수·청소년 육성, 안전문화 조성',
};

const BUSINESS_AREAS: { title: string; description: string; href: string; icon: ReactNode }[] = [
  {
    title: '대회 운영',
    description: '공정하고 안전한 서핑 대회를 기획하고 운영합니다. 전국 규모의 대회부터 지역 친선 대회까지, 서퍼들이 실력을 겨루고 성장할 수 있는 무대를 만듭니다.',
    href: '/business',
    icon: <IconCompetition />,
  },
  {
    title: '교육 운영',
    description: '강사 양성, 심판 교육, 서핑특화 프로그램 등 체계적인 교육 과정을 운영하여 서핑 전문인력을 양성하고 서핑 문화의 질적 성장을 도모합니다.',
    href: '/business/education',
    icon: <IconEducation />,
  },
  {
    title: '선수·청소년 육성',
    description: '유망 선수 발굴과 청소년 서핑 교육을 통해 양양 서핑의 미래를 준비합니다. 체계적인 훈련 프로그램과 대회 참가 지원으로 선수들의 성장을 돕습니다.',
    href: '/business/youth',
    icon: <IconYouth />,
  },
  {
    title: '안전문화 조성',
    description: '해양 안전 교육, 비치클린 캠페인, 서핑 에티켓 홍보 등을 통해 안전하고 건강한 서핑 문화를 만들어갑니다.',
    href: '/business/safety',
    icon: <IconSafety />,
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
