import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '제휴·협업문의',
};

const subNav = [
  { label: '문의안내', href: '/contact', active: false },
  { label: '회원안내', href: '/contact/membership', active: false },
  { label: '제휴·협업문의', href: '/contact/partnership', active: true },
];

const partnershipTypes = [
  {
    title: '대회 후원·협찬',
    description: '서핑 대회 후원 및 브랜드 협찬 참여',
  },
  {
    title: '교육 프로그램 연계',
    description: '서핑 교육 및 안전교육 프로그램 공동 운영',
  },
  {
    title: '지역 연계사업',
    description: '양양군 관광·문화 사업 협력',
  },
  {
    title: '미디어·콘텐츠',
    description: '서핑 콘텐츠 제작, 촬영, 방송 협력',
  },
];

export default function PartnershipPage() {
  return (
    <>
      <PageHeader
        title="제휴·협업문의"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '문의', href: '/contact' },
          { label: '제휴·협업문의' },
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
            <p className="text-navy/70 text-[15px] leading-relaxed mb-10">
              양양군서핑협회는 서핑 문화 확산과 지역 발전을 위해 다양한 기관·기업과의
              협업을 환영합니다. 아래 분야에 해당하는 제휴·협업 문의를 받고 있습니다.
            </p>

            {/* Partnership Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {partnershipTypes.map((type) => (
                <div
                  key={type.title}
                  className="p-5 bg-white border border-foam rounded-lg"
                >
                  <h3 className="text-[15px] font-bold text-navy mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-navy/50">{type.description}</p>
                </div>
              ))}
            </div>

            {/* Contact Info */}
            <div className="bg-ocean/5 rounded-lg p-6">
              <h3 className="text-sm font-bold text-ocean mb-3">
                협업 문의 방법
              </h3>
              <p className="text-sm text-navy/70 mb-4 leading-relaxed">
                협업 제안서 또는 문의 내용을 이메일로 보내주시면, 검토 후
                담당자가 회신드리겠습니다.
              </p>
              <div className="space-y-2 text-sm text-navy/70">
                <p>
                  <span className="text-navy/40 mr-2">이메일</span>
                  <a
                    href="mailto:ysa_korea@naver.com"
                    className="text-navy font-medium hover:text-ocean transition-colors"
                  >
                    ysa_korea@naver.com
                  </a>
                </p>
                <p>
                  <span className="text-navy/40 mr-2">전화</span>
                  <a
                    href="tel:033-671-6155"
                    className="text-navy font-medium hover:text-ocean transition-colors"
                  >
                    033-671-6155
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
