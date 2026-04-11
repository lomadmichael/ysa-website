import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '대회 운영',
  description: '양양군서핑협회의 대회 운영 사업 - 전국 규모 대회부터 지역 친선 대회까지 공정하고 안전한 서핑 대회를 기획하고 운영합니다.',
};

const HIGHLIGHTS = [
  {
    title: '양양 서핑 페스티벌',
    period: '2014 ~ 현재 (연간 정기)',
    description: '양양군서핑협회가 매년 개최하는 대표 대회. 2014년 제1회 국제서핑페스티벌 이래 2022년 제7회 해양수산부장관배까지 이어지고 있습니다.',
  },
  {
    title: '해양수산부장관배 대회',
    period: '2022 · 2023',
    description: '국가기관 후원 대회 유치 및 운영. 숏보드·롱보드·SUP서핑 전 종목 결선을 양양 일원(강현·죽도·남애·서피비치 등)에서 진행했습니다.',
  },
  {
    title: '새해 일출 서핑',
    period: '2016 ~ 2019',
    description: '양양의 일출과 서핑문화를 결합한 시그니처 이벤트. 지역민·여행자·서퍼가 함께하는 친선 대회 형태로 운영했습니다.',
  },
];

const ROLES = [
  {
    title: '대회 기획',
    desc: '종목·규모·일정·장소 선정부터 참가자 모집, 경기 규정 수립까지 대회 전반의 기획을 담당합니다.',
  },
  {
    title: '운영 인력',
    desc: '협회 자체 양성한 심판진과 운영 스태프가 현장을 책임지며, 공정한 경기 진행을 보장합니다.',
  },
  {
    title: '안전 관리',
    desc: '서프레스큐 인력, 응급 의료 체계, 해상 안전 요원을 상시 배치해 선수와 관중의 안전을 확보합니다.',
  },
  {
    title: '기록·아카이브',
    desc: '대회 결과, 사진, 영상을 기록으로 남기고 협회 공식 채널을 통해 지속적으로 공유합니다.',
  },
];

export default function CompetitionPage() {
  return (
    <>
      <PageHeader
        title="대회 운영"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '협회사업', href: '/business' },
          { label: '대회 운영' },
        ]}
        description="공정하고 안전한 서핑 대회를 기획하고 운영합니다. 전국 규모의 대회부터 지역 친선 대회까지, 서퍼들이 실력을 겨루고 성장할 수 있는 무대를 만듭니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Intro */}
          <div className="max-w-6xl mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
              양양의 서핑문화를 만드는 무대
            </h2>
            <p className="text-navy/70 leading-relaxed">
              대회는 기록을 남기는 일만이 아닙니다. 지역의 에너지를 모으고 서핑문화를 넓히는 일입니다.
              양양군서핑협회는 2014년 제1회 국제서핑페스티벌 개최 이후, 국내외 서퍼들이 양양에서 만나고
              성장할 수 있도록 대회를 기획하고 운영해 왔습니다.
            </p>
          </div>

          {/* 주요 대회 */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-navy mb-8">주요 대회 운영 이력</h3>
            <div className="space-y-4">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-foam"
                >
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                    <h4 className="text-lg font-bold text-navy">{item.title}</h4>
                    <span className="text-xs font-medium text-teal bg-teal/10 px-3 py-1 rounded-full shrink-0 w-fit">
                      {item.period}
                    </span>
                  </div>
                  <p className="text-navy/60 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 역할 */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-navy mb-8">협회의 역할</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ROLES.map((role, i) => (
                <div key={role.title} className="bg-white rounded-2xl p-6 md:p-8 border border-foam">
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-ocean/10 text-ocean flex items-center justify-center text-sm font-bold shrink-0">
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-navy mb-2">{role.title}</h4>
                      <p className="text-sm text-navy/60 leading-relaxed">{role.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-ocean/5 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-navy mb-2">
                진행 중이거나 예정된 대회 정보가 궁금하신가요?
              </h3>
              <p className="text-sm text-navy/60">
                연간 일정, 모집중 일정, 종료된 일정은 일정안내 페이지에서 확인하실 수 있습니다.
              </p>
            </div>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-ocean/90 transition-colors shrink-0"
            >
              일정안내 바로가기
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
