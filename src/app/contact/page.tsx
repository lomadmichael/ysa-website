import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '문의안내',
};

const subNav = [
  { label: '문의안내', href: '/contact', active: true },
  { label: '회원안내', href: '/contact/membership', active: false },
  { label: '제휴·협업문의', href: '/contact/partnership', active: false },
];

const contactItems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
    label: '전화',
    value: '033-671-6155',
    href: 'tel:033-671-6155',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    label: '이메일',
    value: 'ysa_korea@naver.com',
    href: 'mailto:ysa_korea@naver.com',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    label: '운영시간',
    value: '평일 09:00~18:00',
    href: undefined,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    label: '주소',
    value: '강원도 양양군 현남면 두리 10-11 해양종합레포츠센터',
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="문의안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '문의' },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <nav className="flex gap-1 border-b border-foam mb-10 overflow-x-auto">
            {subNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  item.active
                    ? 'border-ocean text-ocean'
                    : 'border-transparent text-navy/50 hover:text-navy hover:border-navy/20'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <p className="text-navy/70 mb-10 text-[15px] leading-relaxed max-w-2xl">
            양양군서핑협회는 대회, 교육, 회원, 협업, 지역 연계사업에 대한 문의를 공식
            채널을 통해 받고 있습니다.
          </p>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {contactItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4 p-6 bg-white rounded-lg border border-foam"
              >
                <div className="w-10 h-10 rounded-full bg-ocean/10 flex items-center justify-center text-ocean shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-navy/40 font-medium mb-1">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-[15px] text-navy font-medium hover:text-ocean transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-[15px] text-navy font-medium">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Map Placeholder */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy mb-4">찾아오시는 길</h2>
            <div className="w-full h-[320px] md:h-[400px] bg-foam rounded-lg flex items-center justify-center">
              <div className="text-center text-navy/30">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
                <p className="text-sm">지도가 표시될 영역입니다</p>
                <p className="text-xs mt-1">강원도 양양군 현남면 두리 10-11</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
