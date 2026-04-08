import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { IconCheck } from '@/components/icons';

export const metadata: Metadata = {
  title: '회원안내',
};

const subNav = [
  { label: '문의안내', href: '/contact', active: false },
  { label: '회원안내', href: '/contact/membership', active: true },
  { label: '제휴·협업문의', href: '/contact/partnership', active: false },
];

const benefits = [
  '협회 주관 대회 참가 자격 부여',
  '서핑 교육 프로그램 우선 등록',
  '협회 행사 및 이벤트 참여 기회',
  '서핑 관련 최신 정보 우선 제공',
  '제휴 업체 할인 혜택',
];

export default function MembershipPage() {
  return (
    <>
      <PageHeader
        title="회원안내"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '문의', href: '/contact' },
          { label: '회원안내' },
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

          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-navy mb-4">회원 가입 안내</h2>
            <p className="text-navy/70 text-[15px] leading-relaxed mb-8">
              양양군서핑협회 회원으로 가입하시면 다양한 혜택과 함께 양양 서핑 커뮤니티의
              일원이 되실 수 있습니다. 회원 가입에 관한 자세한 사항은 사무국으로
              문의해 주시기 바랍니다.
            </p>

            {/* Benefits */}
            <div className="bg-white border border-foam rounded-lg p-6 mb-8">
              <h3 className="text-sm font-bold text-ocean mb-4">회원 혜택</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-[15px] text-navy/80">
                    <IconCheck className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact for membership */}
            <div className="bg-ocean/5 rounded-lg p-6">
              <h3 className="text-sm font-bold text-ocean mb-3">가입 문의</h3>
              <div className="space-y-2 text-sm text-navy/70">
                <p>
                  <span className="text-navy/40 mr-2">전화</span>
                  <a href="tel:033-671-6155" className="text-navy font-medium hover:text-ocean transition-colors">
                    033-671-6155
                  </a>
                </p>
                <p>
                  <span className="text-navy/40 mr-2">이메일</span>
                  <a href="mailto:ysa_korea@naver.com" className="text-navy font-medium hover:text-ocean transition-colors">
                    ysa_korea@naver.com
                  </a>
                </p>
                <p>
                  <span className="text-navy/40 mr-2">운영시간</span>
                  <span className="text-navy font-medium">평일 09:00~18:00</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
