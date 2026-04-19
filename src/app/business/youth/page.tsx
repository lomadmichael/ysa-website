import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '선수·청소년 육성',
  description: '양양군서핑협회의 선수 및 청소년 육성 사업',
};

export default function YouthPage() {
  return (
    <>
      <PageHeader
        title="선수·청소년 육성"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '협회사업', href: '/business' },
          { label: '선수·청소년 육성' },
        ]}
        description="유망 선수 발굴과 청소년 서핑 교육을 통해 양양 서핑의 미래를 준비합니다."
      />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* Intro */}
          <div className="max-w-6xl mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
              양양 서핑의 미래를 키웁니다
            </h2>
            <p className="text-navy/70 leading-relaxed">
              양양군서핑협회는 체계적인 훈련 프로그램과 대회 참가 지원을 통해
              유망 선수를 발굴하고 청소년들에게 서핑의 즐거움을 전하고 있습니다.
              방과 후 교실, 여름 캠프, 전문 선수반 운영 등 다양한 프로그램을 통해
              차세대 서퍼를 육성합니다.
            </p>
          </div>

          {/* Hero image */}
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-16">
            <Image
              src="/images/business-youth.jpg"
              alt="청소년 서핑 교육 및 선수 육성 현장"
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>

          {/* Key Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <h3 className="text-lg font-bold text-navy mb-4">선수 육성</h3>
              <ul className="space-y-3 text-navy/70 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                  전문 선수반 운영 및 체계적 훈련 프로그램
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                  전국 대회 및 국제 대회 참가 지원
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                  선수 장비 및 훈련비 지원
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal mt-2 shrink-0" />
                  체력 및 기술 향상을 위한 맞춤 코칭
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-foam">
              <h3 className="text-lg font-bold text-navy mb-4">청소년 프로그램</h3>
              <ul className="space-y-3 text-navy/70 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset mt-2 shrink-0" />
                  방과 후 서핑 교실 운영
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset mt-2 shrink-0" />
                  여름·겨울 서핑 캠프
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset mt-2 shrink-0" />
                  해양 안전 교육 및 환경 교육
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset mt-2 shrink-0" />
                  청소년 서핑 동아리 지원
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/programs/specialized"
              className="inline-flex items-center gap-2 bg-teal text-white px-8 py-4 rounded-xl font-medium hover:bg-ocean transition-colors"
            >
              서핑특화 프로그램 보기
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
