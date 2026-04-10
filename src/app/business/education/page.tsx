import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '교육 운영',
  description: '양양군서핑협회의 교육 운영 사업 - 강사 양성, 심판 교육, 서핑특화 프로그램',
};

const EDUCATION_PROGRAMS = [
  {
    title: '강사 교육',
    description: 'KSA 기준의 전문 서핑 강사를 양성하는 프로그램입니다. 2일간 16시간의 집중 교육을 통해 안전하고 체계적인 서핑 지도 역량을 갖춘 강사를 배출합니다.',
    href: '/programs/instructor',
  },
  {
    title: '심판 교육',
    description: '공정하고 전문적인 경기 운영을 위한 심판 양성 과정입니다. 채점 기준, 경기 규칙, 안전 관리 등 심판에게 필요한 역량을 종합적으로 교육합니다.',
    href: '/programs/referee',
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 서핑요가, 선수교육, 전문체육교실 등 서핑을 중심으로 확장된 다양한 특화 교육 프로그램을 운영합니다.',
    href: '/programs/specialized',
  },
];

export default function EducationPage() {
  return (
    <>
      <PageHeader
        title="교육 운영"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '협회사업', href: '/business' },
          { label: '교육 운영' },
        ]}
        description="강사 양성, 심판 교육, 서핑특화 프로그램 등 체계적인 교육 과정을 운영하여 서핑 전문인력을 양성하고 서핑 문화의 질적 성장을 도모합니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Intro */}
          <div className="max-w-3xl mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
              서핑 전문인력 양성의 허브
            </h2>
            <p className="text-navy/70 leading-relaxed">
              양양군서핑협회는 서핑 산업의 지속 가능한 성장을 위해 전문인력 양성에 힘쓰고 있습니다.
              국제 기준에 부합하는 교육 커리큘럼과 현장 경험이 풍부한 강사진을 통해
              양양의 서핑 서비스 품질을 높이고 있습니다.
            </p>
          </div>

          {/* Placeholder image */}
          <div className="w-full aspect-[21/9] bg-foam rounded-2xl mb-16 flex items-center justify-center">
            <p className="text-navy/30 text-lg">교육 현장 이미지</p>
          </div>

          {/* Program Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EDUCATION_PROGRAMS.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="group bg-white rounded-2xl p-8 border border-foam hover:border-teal/30 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-navy mb-3 group-hover:text-ocean transition-colors">
                  {program.title}
                </h3>
                <p className="text-navy/60 text-sm leading-relaxed mb-6">
                  {program.description}
                </p>
                <div className="flex items-center gap-2 text-teal text-sm font-medium">
                  <span>프로그램 보기</span>
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
