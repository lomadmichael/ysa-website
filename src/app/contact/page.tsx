import type { Metadata } from 'next';
import { type ReactNode } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import KakaoMap from '@/components/shared/KakaoMap';
import { IconPhone, IconEmail, IconClock, IconLocation } from '@/components/icons';

export const metadata: Metadata = {
  title: '문의안내',
};

const subNav = [
  { label: '문의안내', href: '/contact', active: true },
  { label: '회원안내', href: '/contact/membership', active: false },
  { label: '제휴·협업문의', href: '/contact/partnership', active: false },
];

const contactItems: { icon: ReactNode; label: string; value: string; href?: string }[] = [
  {
    icon: <IconPhone className="w-6 h-6" />,
    label: '전화',
    value: '033-671-6155',
    href: 'tel:033-671-6155',
  },
  {
    icon: <IconEmail className="w-6 h-6" />,
    label: '이메일',
    value: 'ysa_korea@naver.com',
    href: 'mailto:ysa_korea@naver.com',
  },
  {
    icon: <IconClock className="w-6 h-6" />,
    label: '운영시간',
    value: '평일 09:00~18:00',
    href: undefined,
  },
  {
    icon: <IconLocation className="w-6 h-6" />,
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

          {/* 카카오맵 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-navy mb-4">찾아오시는 길</h2>
            <div className="rounded-lg overflow-hidden border border-foam">
              <KakaoMap mapKey="ktpwvmdmu8d" timestamp="1775787564496" height="400" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
