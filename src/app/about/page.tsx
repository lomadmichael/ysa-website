import type { Metadata } from 'next';
import Image from 'next/image';
import PageHeader from '@/components/shared/PageHeader';

export const metadata: Metadata = {
  title: '회장 인사말',
  description: '양양군서핑협회 회장 인사말. 파도를 넘어 사람과 문화를 잇는 양양의 지속 가능한 서핑 생태계를 향한 협회의 비전과 약속.',
};

const BREADCRUMBS = [
  { label: '홈', href: '/' },
  { label: '협회소개', href: '/about' },
  { label: '회장 인사말' },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="회장 인사말" breadcrumbs={BREADCRUMBS} />

      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-start">
            {/* 회장 사진 */}
            <div className="w-full md:w-[320px] shrink-0">
              <div className="relative aspect-[3/4] bg-foam rounded-2xl overflow-hidden border border-foam">
                <Image src="/images/president.jpg" alt="양양군서핑협회 회장" fill className="object-cover" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-lg font-bold text-navy">양양군 서핑협회 장래홍 회장</p>
              </div>
            </div>

            {/* 인사말 */}
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-navy mb-8 leading-snug">
                파도 위에서 만나는
                <br />
                건강한 양양을 꿈꿉니다.
              </h2>

              <div className="space-y-6 text-navy/80 leading-relaxed text-[15px] md:text-base">
                <p>안녕하십니까.</p>
                <p>
                  양양군서핑협회 홈페이지를 방문해 주신 여러분을 진심으로
                  환영합니다.
                </p>
                <p>
                  양양군서핑협회는 2013년 발족 이후 서핑의 저변 확대와 청소년
                  육성, 대회 운영, 교육 프로그램 개발을 통해 양양의 서핑문화를
                  함께 만들어 왔습니다.
                </p>
                <p>
                  우리 협회는 서핑이 단순한 레저를 넘어 지역 주민의 건강과
                  행복, 그리고 양양의 미래 성장동력이 될 수 있도록 다양한 사업을
                  추진하고 있습니다.
                </p>
                <p>
                  앞으로도 안전한 서핑 환경 조성, 전문 인력 양성, 국내외 교류
                  확대에 힘쓰며, 양양이 대한민국을 대표하는 서핑 도시로
                  자리매김할 수 있도록 최선을 다하겠습니다.
                </p>
                <p>
                  여러분의 많은 관심과 참여를 부탁드립니다.
                  <br />
                  감사합니다.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}
