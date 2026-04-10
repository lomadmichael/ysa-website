import type { Metadata } from 'next';
import Image from 'next/image';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '연혁',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '연혁' },
];

/**
 * 최신이 위, 오래된 것이 아래 순으로 배치
 * 같은 그룹(같은 연도 또는 연속된 해) 안에서도 최신 월이 위
 */
const TIMELINE: { year: string; items: { date: string; text: string }[] }[] = [
  {
    year: '2022',
    items: [
      { date: '2022. 10.', text: '해양수산부장관배 제7회 양양 서핑 페스티벌 결승전 및 시상식 (죽도)' },
      { date: '2022. 09-10.', text: '해양수산부장관배 제7회 양양 서핑 페스티벌 예선대회 4회 (강현, 죽도, 남애, 서피비치)' },
      { date: '2022. 05-11.', text: '서핑 강사 인증 사업 「나는 양양의 서핑강사다」 진행' },
    ],
  },
  {
    year: '2019',
    items: [
      { date: '2019. 10.', text: '제6회 \'양양 서핑 페스티벌\' 개최' },
      { date: '2019. 02.', text: '국민생활체육 양양군서핑연합회를 「양양군서핑협회」로 명칭 변경' },
      { date: '2019. 01.', text: '제4회 \'새해 일출 서핑\' 개최' },
    ],
  },
  {
    year: '2018',
    items: [
      { date: '2018. 10.', text: '제5회 \'양양 서핑 페스티벌\' 개최' },
      { date: '2018. 01.', text: '제3회 \'새해 일출 서핑\' 개최' },
    ],
  },
  {
    year: '2017 ~ 2019',
    items: [
      { date: '2017 ~ 2019', text: '양양군 관내 청소년 서핑 체험 프로그램 운영' },
      { date: '2017 ~ 2019', text: '양양군 겨울 서핑 프로그램 운영' },
    ],
  },
  {
    year: '2017',
    items: [
      { date: '2017. 10.', text: '제4회 \'양양 서핑 페스티벌\' 개최' },
      { date: '2017. 01.', text: '제2회 \'새해 일출 서핑\' 개최' },
    ],
  },
  {
    year: '2016',
    items: [
      { date: '2016. 10.', text: '제3회 \'양양 서핑 페스티벌\' 개최' },
      { date: '2016. 01.', text: '제1회 \'새해 일출 서핑\' 개최' },
    ],
  },
  {
    year: '2015',
    items: [
      { date: '2015. 10.', text: '제2회 \'양양 서핑 페스티벌\' 개최' },
    ],
  },
  {
    year: '2014',
    items: [
      { date: '2014. 10.', text: '제1회 \'양양군수배 국제서핑 페스티벌\' 개최' },
      { date: '2014. 07.', text: '양양군생활체육회 「국민생활체육 양양군서핑연합회」로 회원 단체 승인' },
    ],
  },
  {
    year: '2013',
    items: [
      { date: '2013. 11.', text: '양양군서핑연합회 발족' },
    ],
  },
];

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="연혁" breadcrumbs={BREADCRUMBS} />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* 상단 히어로 이미지 */}
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-16 md:mb-20">
            <Image
              src="/images/about_list.png"
              alt="양양의 석양 서핑"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 text-white">
              <p className="text-sm md:text-base tracking-widest uppercase opacity-80 mb-2">History</p>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">
                양양의 파도 위에 쌓인<br />
                10년의 시간
              </h2>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* 세로선 */}
              <div className="absolute left-[55px] md:left-[71px] top-0 bottom-0 w-px bg-foam" />

              <div className="space-y-14">
                {TIMELINE.map((group) => (
                  <div key={group.year} className="relative flex gap-6 md:gap-8">
                    {/* 연도 마커 */}
                    <div className="relative z-10 shrink-0">
                      <div className="w-[110px] md:w-[142px] h-12 md:h-14 rounded-full bg-ocean text-white flex items-center justify-center font-bold text-xs md:text-sm">
                        {group.year}
                      </div>
                    </div>

                    {/* 이벤트 목록 */}
                    <div className="pt-1 md:pt-2 pb-2 flex-1">
                      <ul className="space-y-4">
                        {group.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 text-navy/80 text-sm md:text-[15px] leading-relaxed"
                          >
                            <span className="font-semibold text-navy/90 shrink-0 md:w-28">
                              {item.date}
                            </span>
                            <span className="flex-1">{item.text}</span>
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
