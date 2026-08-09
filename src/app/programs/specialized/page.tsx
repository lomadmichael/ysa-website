import type { Metadata } from 'next';
import { type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { IconSurf, IconRescue, IconSkate, IconYoga, IconAthlete, IconGym } from '@/components/icons';

export const metadata: Metadata = {
  title: '서핑특화 교육',
  description: '양양군서핑협회 서핑특화 교육 - 2026 양양 서핑캠프(접수 중), 서프레스큐, 랜드서핑, 서핑요가, 선수교육, 전문체육교실',
};

const CATEGORIES: {
  title: string;
  description: string;
  color: string;
  icon: ReactNode;
  badge?: string;
  href?: string;
  ctaLabel?: string;
}[] = [
  {
    title: '2026 양양 서핑캠프',
    description:
      '2026 지역자율형 생활체육활동지원 사업으로 진행하는 서핑캠프입니다. 9월 12일(토) 13:00·15:00 서핑강습 200명, 9월 12일(토)~13일(일) 안전교육 및 서핑 티셔츠 만들기 특화 체험프로그램 300명을 모집합니다. 양양군민 및 양양 생활인구라면 누구나 신청할 수 있으며, 서핑강습은 만 11세 이상·신장 130cm 이상만 참여할 수 있습니다.',
    color: 'sunset',
    icon: <IconSurf className="w-7 h-7" />,
    badge: '접수 중',
    href: '/apply/surf-camp',
    ctaLabel: '서핑캠프 접수하기',
  },
  {
    title: '서프레스큐',
    description: '서핑보드를 활용한 수상 인명구조 기법을 교육합니다. 해양 사고 발생 시 신속하고 효과적인 구조 활동을 수행할 수 있는 역량을 갖추게 됩니다.',
    color: 'sunset',
    icon: <IconRescue className="w-7 h-7" />,
  },
  {
    title: '랜드서핑',
    description: '육상에서 서핑보드의 밸런스와 기본 동작을 연습합니다. 서핑 입문자나 비수기 훈련에 효과적인 프로그램입니다.',
    color: 'teal',
    icon: <IconSkate className="w-7 h-7" />,
  },
  {
    title: '서핑요가',
    description: '서핑에 필요한 유연성, 균형감각, 코어 근력을 강화하는 요가 프로그램입니다. 서핑 전후 컨디셔닝에 최적화되어 있습니다.',
    color: 'ocean',
    icon: <IconYoga className="w-7 h-7" />,
  },
  {
    title: '선수교육',
    description: '경기력 향상을 위한 전문 선수 교육 과정입니다. 기술 분석, 전략 수립, 멘탈 트레이닝 등 대회 준비에 필요한 종합적인 교육을 제공합니다.',
    color: 'sunset',
    icon: <IconAthlete className="w-7 h-7" />,
  },
  {
    title: '전문체육교실',
    description: '서핑을 전문 체육 종목으로 배우고자 하는 분들을 위한 체계적인 교육 과정입니다. 단계별 커리큘럼을 통해 안정적인 실력 향상을 돕습니다.',
    color: 'teal',
    icon: <IconGym className="w-7 h-7" />,
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  sunset: { bg: 'bg-sunset/10', text: 'text-sunset' },
  teal: { bg: 'bg-teal/10', text: 'text-teal' },
  ocean: { bg: 'bg-ocean/10', text: 'text-ocean' },
};

export default function SpecializedPage() {
  return (
    <>
      <PageHeader
        title="서핑특화 교육"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '프로그램 안내', href: '/programs' },
          { label: '서핑특화 교육' },
        ]}
        description="서핑특화 교육은 파도 위 기술뿐 아니라 균형, 코어, 움직임 이해, 경기력 향상, 입문 적응을 돕는 확장형 교육 프로그램입니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Intro */}
          <div className="max-w-6xl mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
              서핑 그 이상의 교육
            </h2>
            <p className="text-navy/70 leading-relaxed">
              양양군서핑협회의 서핑특화 교육은 단순한 서핑 기술 교육을 넘어,
              안전 구조, 체력 강화, 경기력 향상 등 서핑을 중심으로 확장된
              종합 교육 프로그램입니다. 입문자부터 전문 선수까지 모든 단계의
              서퍼에게 필요한 교육을 제공합니다.
            </p>
          </div>

          <div className="relative w-full aspect-[21/9] bg-foam rounded-2xl mb-16 overflow-hidden">
            <Image src="/images/program-special.png" alt="서핑특화 교육 현장" fill className="object-cover" />
          </div>

          {/* Categories */}
          <div className="space-y-6">
            {CATEGORIES.map((cat, i) => {
              const colors = colorMap[cat.color];
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 border border-foam hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-start gap-6">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg font-bold text-navy">{cat.title}</h3>
                        {cat.badge && (
                          <span className={`text-xs font-semibold ${colors.bg} ${colors.text} px-3 py-1 rounded-full`}>
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-navy/60 text-sm leading-relaxed max-w-2xl">
                        {cat.description}
                      </p>
                      {cat.href && (
                        <Link
                          href={cat.href}
                          className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${colors.text} hover:gap-2.5 transition-all`}
                        >
                          {cat.ctaLabel ?? '접수하기'}
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div className="mt-16 bg-ocean/5 rounded-2xl p-8 md:p-12">
            <h3 className="text-lg font-bold text-navy mb-4">교육 신청 안내</h3>
            <p className="text-navy/70 text-sm leading-relaxed mb-6">
              「2026 양양 서핑캠프」는 현재 온라인 접수 중입니다.
              그 외 서핑특화 교육 프로그램은 시즌별로 일정이 다르게 운영되며,
              각 프로그램의 상세 일정과 모집 정보는 공지사항을 통해 안내됩니다.
              교육 관련 문의는 협회로 연락해주세요.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/apply/surf-camp"
                className="inline-flex items-center gap-2 bg-sunset text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-sunset/90 transition-colors"
              >
                2026 양양 서핑캠프 접수
              </Link>
              <a
                href="https://bpscomm.kr/yysports/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-navy border border-foam px-6 py-3 rounded-xl text-sm font-medium hover:border-teal/40 transition-colors"
              >
                그 외 교육 신청
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
