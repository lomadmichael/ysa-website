import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '프로그램 안내',
  description: '양양군서핑협회의 교육 프로그램 - 강사 교육, 심판 교육, 서핑특화 교육',
};

const PROGRAMS = [
  {
    title: '강사 교육',
    description: 'ISA 기준의 전문 서핑 강사를 양성하는 프로그램입니다. 5일간 30시간의 집중 교육을 통해 안전하고 체계적인 서핑 지도 역량을 갖춘 강사를 배출합니다.',
    href: '/programs/instructor',
    duration: '5일 / 30시간',
    badge: '전문자격',
  },
  {
    title: '심판 교육',
    description: '공정하고 전문적인 경기 운영을 위한 심판 양성 과정입니다. 채점 기준, 경기 규칙, 안전 관리 등 심판에게 필요한 역량을 종합적으로 교육합니다.',
    href: '/programs/referee',
    duration: '교육 일정 별도 공지',
    badge: '심판자격',
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 서핑요가, 선수교육, 전문체육교실 등 서핑을 중심으로 확장된 다양한 특화 교육 프로그램을 운영합니다.',
    href: '/programs/specialized',
    duration: '프로그램별 상이',
    badge: '특화과정',
  },
];

export default function ProgramsPage() {
  return (
    <>
      <PageHeader
        title="프로그램 안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '프로그램 안내' },
        ]}
        description="양양군서핑협회가 운영하는 전문 교육 프로그램을 안내합니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PROGRAMS.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="group bg-white rounded-2xl overflow-hidden border border-foam hover:border-teal/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Placeholder image */}
                <div className="w-full aspect-[4/3] bg-foam flex items-center justify-center">
                  <p className="text-navy/30">{program.title} 이미지</p>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-teal bg-teal/10 px-3 py-1 rounded-full">
                      {program.badge}
                    </span>
                    <span className="text-xs text-navy/40">
                      {program.duration}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-3 group-hover:text-ocean transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-navy/60 text-sm leading-relaxed mb-6">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-2 text-teal text-sm font-medium">
                    <span>자세히 보기</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
