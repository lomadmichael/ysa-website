import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '연혁',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '연혁' },
];

const TIMELINE = [
  {
    year: '2025',
    events: [
      '양양군서핑협회 10주년 기념 페스티벌 개최',
      '서핑특화프로그램 운영 확대',
    ],
  },
  {
    year: '2024',
    events: [
      '서핑 강사 인증제도 고도화',
      '청소년 서핑 육성 프로그램 운영',
    ],
  },
  {
    year: '2022',
    events: [
      '서핑 강사 인증사업 시행',
      '안전 교육 체계 구축',
    ],
  },
  {
    year: '2019',
    events: [
      '협회 명칭 변경 (양양군서핑협회)',
      '국제서핑대회 운영',
    ],
  },
  {
    year: '2017~2019',
    events: [
      '청소년 서핑체험 교실 운영',
      '서핑 저변 확대 프로그램 시행',
    ],
  },
  {
    year: '2014',
    events: [
      '제1회 국제서핑페스티벌 개최',
    ],
  },
  {
    year: '2013',
    events: [
      '양양군서핑협회 발족',
    ],
  },
];

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="연혁" breadcrumbs={BREADCRUMBS} />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* 타임라인 */}
            <div className="relative">
              {/* 세로선 */}
              <div className="absolute left-[23px] md:left-[31px] top-0 bottom-0 w-px bg-foam" />

              <div className="space-y-12">
                {TIMELINE.map((item, index) => (
                  <div key={index} className="relative flex gap-6 md:gap-8">
                    {/* 연도 마커 */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ocean text-white flex items-center justify-center font-bold text-xs md:text-sm">
                        {item.year}
                      </div>
                    </div>

                    {/* 이벤트 목록 */}
                    <div className="pt-2 md:pt-4 pb-2">
                      <ul className="space-y-3">
                        {item.events.map((event, eventIndex) => (
                          <li
                            key={eventIndex}
                            className="text-navy/80 text-sm md:text-base leading-relaxed flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                            {event}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
