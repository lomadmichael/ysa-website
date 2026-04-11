import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';
import { SITE } from '@/lib/constants';

export const metadata: Metadata = {
  title: '조직도',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '조직도' },
];

/** 리더십 체인 (회장 → 부회장 → 사무국장) */
const LEADERSHIP: { title: string; description: string }[] = [
  { title: '회장', description: '협회 최고 의결권자' },
  { title: '부회장', description: '회장 직무 보좌' },
  { title: '사무국장', description: '협회 실무 총괄' },
];

/**
 * 4개 부서 구조.
 * 각 부서는 사무국장 산하에서 해당 분야를 담당.
 */
const DEPARTMENTS: {
  title: string;
  description: string;
  accent: 'sunset' | 'ocean' | 'teal' | 'navy';
  items: string[];
}[] = [
  {
    title: '기획/행정/회계',
    description: '협회 운영 전반과 회계 관리',
    accent: 'navy',
    items: [],
  },
  {
    title: '교육',
    description: '지도자·선수·심판 전문인력 양성',
    accent: 'ocean',
    items: ['지도자', '심판', '선수', '레스큐', '대안서핑'],
  },
  {
    title: '대회',
    description: '서핑 대회 기획 및 현장 운영',
    accent: 'sunset',
    items: ['심판', '대회장 세팅', '운영'],
  },
  {
    title: '경영지원',
    description: '마케팅·홍보·공동사업 지원',
    accent: 'teal',
    items: ['페스티벌', '이벤트', '공동사업', '홍보'],
  },
];

/** accent 색상 → Tailwind class 매핑 (JIT 정적 분석용 하드코드) */
const ACCENT_STYLES: Record<
  'sunset' | 'ocean' | 'teal' | 'navy',
  { bar: string; badge: string; ring: string; chipBg: string; chipText: string }
> = {
  sunset: {
    bar: 'bg-sunset',
    badge: 'bg-sunset/10 text-sunset',
    ring: 'ring-sunset/20',
    chipBg: 'bg-sunset/10',
    chipText: 'text-sunset',
  },
  ocean: {
    bar: 'bg-ocean',
    badge: 'bg-ocean/10 text-ocean',
    ring: 'ring-ocean/20',
    chipBg: 'bg-ocean/10',
    chipText: 'text-ocean',
  },
  teal: {
    bar: 'bg-teal',
    badge: 'bg-teal/10 text-teal',
    ring: 'ring-teal/20',
    chipBg: 'bg-teal/10',
    chipText: 'text-teal',
  },
  navy: {
    bar: 'bg-navy',
    badge: 'bg-navy/10 text-navy/70',
    ring: 'ring-navy/20',
    chipBg: 'bg-navy/5',
    chipText: 'text-navy/60',
  },
};

export default function OrganizationPage() {
  return (
    <>
      <PageHeader
        title="조직도"
        breadcrumbs={BREADCRUMBS}
        description="양양군서핑협회의 운영 조직 구조입니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* ========== 리더십 체인 ========== */}
          <div className="mb-16 md:mb-20">
            <h2 className="text-xl md:text-2xl font-bold text-navy mb-6 md:mb-8">
              리더십
            </h2>
            <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
              {LEADERSHIP.map((leader, i) => (
                <div key={leader.title} className="flex-1 flex items-center">
                  {/* 카드 */}
                  <div className="relative flex-1 bg-white border border-foam rounded-2xl p-6 md:p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                    {/* 좌측 컬러 바 (세로 막대) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sunset rounded-l-2xl" aria-hidden />
                    <p className="text-xs font-semibold uppercase tracking-wider text-sunset mb-2">
                      LEADERSHIP
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-navy mb-2">
                      {leader.title}
                    </h3>
                    <p className="text-sm text-navy/60">{leader.description}</p>
                  </div>
                  {/* 연결 화살표 (데스크탑: 가로, 모바일: 세로) */}
                  {i < LEADERSHIP.length - 1 && (
                    <>
                      <div className="hidden md:flex items-center px-2 text-navy/30" aria-hidden>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                      <div className="md:hidden flex justify-center py-1 text-navy/30" aria-hidden>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="5 12 12 19 19 12" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========== 부서 섹션 ========== */}
          <div className="mb-16 md:mb-20">
            <div className="flex items-baseline gap-3 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-navy">
                부서 및 분과
              </h2>
              <span className="text-xs text-navy/40 font-medium">
                사무국장 산하 {DEPARTMENTS.length}개 부서
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DEPARTMENTS.map((dept) => {
                const styles = ACCENT_STYLES[dept.accent];
                return (
                  <div
                    key={dept.title}
                    className="relative overflow-hidden bg-white border border-foam rounded-2xl p-6 md:p-7 hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* 상단 컬러 바 */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${styles.bar}`} aria-hidden />

                    {/* 헤더 */}
                    <div className="mb-5 pt-2">
                      <h3 className="text-lg md:text-xl font-bold text-navy mb-1.5">
                        {dept.title}
                      </h3>
                      <p className="text-xs text-navy/55 leading-relaxed">
                        {dept.description}
                      </p>
                    </div>

                    {/* 분과 목록 */}
                    {dept.items.length > 0 ? (
                      <ul className="flex flex-wrap gap-1.5 mt-auto">
                        {dept.items.map((item) => (
                          <li
                            key={item}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles.chipBg} ${styles.chipText}`}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-navy/30 italic mt-auto">
                        단일 부서 운영
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========== 연락처 안내 ========== */}
          <div className="bg-white rounded-2xl border border-foam p-8 md:p-10">
            <h2 className="text-xl font-bold text-navy mb-6">연락처 안내</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-navy/50 mb-1">전화번호</p>
                  <p className="text-navy font-medium">{SITE.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-navy/50 mb-1">이메일</p>
                  <p className="text-navy font-medium">{SITE.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
