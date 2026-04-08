import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { type FaqItem } from '@/lib/database.types';

export const metadata: Metadata = {
  title: 'FAQ',
};

const subNav = [
  { label: '공지사항', href: '/notice', active: false },
  { label: '보도자료', href: '/notice/press', active: false },
  { label: '사진·영상', href: '/notice/gallery', active: false },
  { label: '규정·서식', href: '/notice/docs', active: false },
  { label: 'FAQ', href: '/notice/faq', active: true },
];

const mockFaqs: FaqItem[] = [
  {
    id: 1,
    question: '양양군서핑협회에 가입하려면 어떻게 하나요?',
    answer: '협회 홈페이지 회원안내 페이지에서 가입 절차를 확인하시거나, 사무국(033-671-6155)으로 문의해 주시기 바랍니다.',
    category: null,
    sort_order: 1,
  },
  {
    id: 2,
    question: '서핑 교육 프로그램은 언제 진행되나요?',
    answer: '서핑 교육 프로그램은 연중 수시로 운영되며, 구체적인 일정은 공지사항을 통해 안내됩니다. 강사 양성교육, 심판 교육, 서핑특화 교육 등 다양한 프로그램이 준비되어 있습니다.',
    category: null,
    sort_order: 2,
  },
  {
    id: 3,
    question: '대회 참가 신청은 어떻게 하나요?',
    answer: '대회정보 페이지에서 모집중인 대회를 확인하시고, 각 대회별 안내에 따라 신청하실 수 있습니다. 대회에 따라 온라인 접수 또는 현장 접수로 진행됩니다.',
    category: null,
    sort_order: 3,
  },
  {
    id: 4,
    question: '협회와 제휴·협업을 하고 싶습니다.',
    answer: '제휴·협업문의 페이지를 통해 문의해 주시거나, 이메일(ysa_korea@naver.com)로 협업 제안서를 보내주시면 검토 후 회신드리겠습니다.',
    category: null,
    sort_order: 4,
  },
  {
    id: 5,
    question: '양양에서 서핑하기 좋은 시기는 언제인가요?',
    answer: '양양은 연중 서핑이 가능하지만, 특히 6~10월이 파도 조건이 좋아 서핑하기에 적합합니다. 초보자의 경우 여름철에 시작하는 것을 권장합니다.',
    category: null,
    sort_order: 5,
  },
];

async function getFaqs(): Promise<FaqItem[]> {
  try {
    if (!isSupabaseConfigured) return mockFaqs;
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data && data.length > 0 ? data : mockFaqs;
  } catch {
    return mockFaqs;
  }
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <PageHeader
        title="공지·자료실"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '공지·자료실', href: '/notice' },
          { label: 'FAQ' },
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

          <h2 className="text-xl font-bold text-navy mb-8">
            자주 묻는 질문
          </h2>

          {/* FAQ Accordion */}
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-white border border-foam rounded-lg overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none hover:bg-ocean/5 transition-colors">
                  <span className="flex items-center gap-3">
                    <span className="text-teal font-bold text-sm shrink-0">
                      Q
                    </span>
                    <span className="text-[15px] font-medium text-navy">
                      {faq.question}
                    </span>
                  </span>
                  <svg
                    className="w-5 h-5 text-navy/30 shrink-0 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <div className="pt-3 border-t border-foam">
                    <p className="text-sm text-navy/70 leading-relaxed pl-7">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
