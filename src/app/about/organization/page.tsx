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
const LEADERSHIP: string[] = ['회장', '부회장', '사무국장'];

/**
 * 사무국장 산하 4개 부서.
 * 첫 번째 원본 조직도 이미지 기준으로 기획/행정/회계는 단일 부서(sub-items 없음).
 */
const DEPARTMENTS: { title: string; accent: 'sunset' | 'ocean' | 'teal' | 'navy'; items: string[] }[] = [
  {
    title: '경영지원',
    accent: 'teal',
    items: ['페스티벌', '이벤트', '공동사업', '홍보'],
  },
  {
    title: '대회',
    accent: 'sunset',
    items: ['심판', '대회장 세팅', '운영'],
  },
  {
    title: '교육',
    accent: 'ocean',
    items: ['지도자', '심판', '선수', '레스큐', '대안서핑'],
  },
  {
    title: '기획/행정/회계',
    accent: 'navy',
    items: [],
  },
];

const ACCENT_STYLES: Record<
  'sunset' | 'ocean' | 'teal' | 'navy',
  { boxBg: string; boxText: string; boxBorder: string; chipBg: string; chipText: string; bar: string }
> = {
  sunset: {
    boxBg: 'bg-sunset/10',
    boxText: 'text-sunset',
    boxBorder: 'border-sunset/30',
    chipBg: 'bg-sunset/10',
    chipText: 'text-sunset',
    bar: 'bg-sunset',
  },
  ocean: {
    boxBg: 'bg-ocean/10',
    boxText: 'text-ocean',
    boxBorder: 'border-ocean/30',
    chipBg: 'bg-ocean/10',
    chipText: 'text-ocean',
    bar: 'bg-ocean',
  },
  teal: {
    boxBg: 'bg-teal/10',
    boxText: 'text-teal',
    boxBorder: 'border-teal/30',
    chipBg: 'bg-teal/10',
    chipText: 'text-teal',
    bar: 'bg-teal',
  },
  navy: {
    boxBg: 'bg-navy/5',
    boxText: 'text-navy/70',
    boxBorder: 'border-navy/20',
    chipBg: 'bg-navy/5',
    chipText: 'text-navy/60',
    bar: 'bg-navy/50',
  },
};

/** 세로 연결선 */
function VLine({ height = 'h-8' }: { height?: string }) {
  return <div className={`w-[2px] ${height} bg-navy/20`} aria-hidden />;
}

/** 리더십 박스 (회장/부회장/사무국장) */
function LeaderBox({ title }: { title: string }) {
  return (
    <div className="min-w-[180px] px-8 py-4 bg-white border-2 border-ocean/30 rounded-lg text-center shadow-sm">
      <p className="text-lg md:text-xl font-bold text-navy">{title}</p>
    </div>
  );
}

/** 부서 박스 (경영지원/대회/교육/기획·행정·회계) */
function DeptBox({ title, accent }: { title: string; accent: keyof typeof ACCENT_STYLES }) {
  const s = ACCENT_STYLES[accent];
  return (
    <div
      className={`min-w-[140px] px-5 py-3 ${s.boxBg} border-2 ${s.boxBorder} rounded-lg text-center`}
    >
      <p className={`text-sm md:text-base font-bold ${s.boxText}`}>{title}</p>
    </div>
  );
}

/** 세로 텍스트 분과 박스 (sub-item). 글자가 위→아래로 쌓임. */
function VerticalItemBox({ label, accent }: { label: string; accent: keyof typeof ACCENT_STYLES }) {
  const s = ACCENT_STYLES[accent];
  return (
    <div
      style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
      className={`${s.boxBg} ${s.boxText} border ${s.boxBorder} rounded-md px-2 py-4 font-semibold text-sm min-h-[110px] flex items-center justify-center tracking-wider`}
    >
      {label}
    </div>
  );
}

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
          {/* ==================================================== */}
          {/* DESKTOP TREE (lg+)                                    */}
          {/* ==================================================== */}
          <div className="hidden lg:block">
            <div className="flex flex-col items-center">
              {/* 회장 */}
              <LeaderBox title={LEADERSHIP[0]!} />
              <VLine />

              {/* 부회장 */}
              <LeaderBox title={LEADERSHIP[1]!} />
              <VLine />

              {/* 사무국장 */}
              <LeaderBox title={LEADERSHIP[2]!} />
              <VLine />

              {/* 사무국장 → 부서 bus: 가로 직선 connector */}
              <div className="relative w-full flex justify-center">
                {/* 가로 bus line */}
                <div
                  className="absolute top-0 h-[2px] bg-navy/20"
                  style={{ left: '12.5%', right: '12.5%' }}
                  aria-hidden
                />
                {/* 부서 4개 + 각 부서 sub-items */}
                <div className="flex justify-between w-full pt-0 gap-4">
                  {DEPARTMENTS.map((dept) => (
                    <div key={dept.title} className="flex-1 flex flex-col items-center">
                      {/* bus → 부서 세로 연결선 */}
                      <VLine height="h-8" />
                      <DeptBox title={dept.title} accent={dept.accent} />

                      {/* 부서 → sub-items */}
                      {dept.items.length > 0 && (
                        <>
                          <VLine height="h-8" />
                          {/* sub bus + sub-items */}
                          <div className="relative flex justify-center gap-2">
                            {/* sub bus line */}
                            {dept.items.length > 1 && (
                              <div
                                className="absolute top-0 h-[2px] bg-navy/20"
                                style={{
                                  left: `calc(100% / ${dept.items.length} / 2)`,
                                  right: `calc(100% / ${dept.items.length} / 2)`,
                                }}
                                aria-hidden
                              />
                            )}
                            {dept.items.map((item) => (
                              <div key={item} className="flex flex-col items-center">
                                <VLine height="h-6" />
                                <VerticalItemBox label={item} accent={dept.accent} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* MOBILE / TABLET (below lg)                            */}
          {/* ==================================================== */}
          <div className="lg:hidden">
            {/* 리더십 체인 (세로) */}
            <div className="mb-12">
              <h2 className="text-lg font-bold text-navy mb-5">리더십</h2>
              <div className="flex flex-col items-stretch gap-0">
                {LEADERSHIP.map((title, i) => (
                  <div key={title} className="flex flex-col items-center">
                    <div className="w-full max-w-sm mx-auto bg-white border-2 border-ocean/30 rounded-lg px-6 py-4 text-center shadow-sm">
                      <p className="text-base font-bold text-navy">{title}</p>
                    </div>
                    {i < LEADERSHIP.length - 1 && (
                      <div className="py-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy/30">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <polyline points="5 12 12 19 19 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 부서 섹션 */}
            <div>
              <h2 className="text-lg font-bold text-navy mb-5">
                부서 및 분과
                <span className="ml-2 text-xs font-medium text-navy/40">
                  사무국장 산하 {DEPARTMENTS.length}개 부서
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEPARTMENTS.map((dept) => {
                  const s = ACCENT_STYLES[dept.accent];
                  return (
                    <div
                      key={dept.title}
                      className="relative overflow-hidden bg-white border border-foam rounded-xl p-5"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 ${s.bar}`} aria-hidden />
                      <h3 className={`text-base font-bold ${s.boxText} mb-3 pt-1`}>
                        {dept.title}
                      </h3>
                      {dept.items.length > 0 ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {dept.items.map((item) => (
                            <li
                              key={item}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.chipBg} ${s.chipText}`}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-navy/30 italic">단일 부서 운영</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========== 연락처 안내 ========== */}
          <div className="mt-16 md:mt-24 bg-white rounded-2xl border border-foam p-8 md:p-10">
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
