import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '설립목적',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '설립목적' },
];

const MISSIONS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
      </svg>
    ),
    title: '서핑 종목의 보급 및 발전',
    description: '서핑을 널리 보급하고 체계적인 교육과 대회를 통해 양양의 서핑 문화를 발전시킵니다.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    title: '주민 건강증진 및 여가생활',
    description: '지역사회 주민의 건강증진과 활기찬 여가생활을 지원합니다.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: '구성원 간 교류 도모',
    description: '협회 구성원 간의 활발한 교류와 협력을 통해 서핑 커뮤니티를 강화합니다.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: '해양레저 문화 기반 조성',
    description: '양양을 대표하는 해양레저 문화 기반을 만들어갑니다.',
  },
];

export default function PurposePage() {
  return (
    <>
      <PageHeader title="설립목적" breadcrumbs={BREADCRUMBS} />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* 설립목적 텍스트 */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <p className="text-lg md:text-xl text-navy/80 leading-relaxed">
              양양군서핑협회는 서핑 종목을 널리 보급하고 이를 통해 지역사회
              주민의 건강증진과 활기찬 여가생활, 협회 구성원 간의 교류를
              도모하며 양양을 대표하는 해양레저 문화 기반을 만들어가기 위해
              설립되었습니다.
            </p>
          </div>

          {/* 4대 미션 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {MISSIONS.map((mission, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-foam hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-5">
                  {mission.icon}
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">
                  {mission.title}
                </h3>
                <p className="text-navy/60 text-sm leading-relaxed">
                  {mission.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
