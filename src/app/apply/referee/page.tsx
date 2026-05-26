import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import ApplyForm from "@/components/apply/ApplyForm";

export const metadata: Metadata = {
  title: "심판교육 접수",
  description:
    "양양군서핑협회 심판인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다.",
  alternates: { canonical: "https://ysakorea.com/apply/referee" },
};

export const revalidate = 60;

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ??
  "https://cert-manager-taupe.vercel.app";

interface Schedule {
  id: string;
  cert_type: "REF" | "INS";
  round: number;
  start_date: string;
  end_date: string;
  capacity: number;
  current_count: number;
  waitlist_count: number;
  status: string;
}

async function fetchSchedules(): Promise<Schedule[]> {
  try {
    const res = await fetch(`${CERT_API}/api/public/schedules`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { schedules?: Schedule[] };
    return data.schedules ?? [];
  } catch {
    return [];
  }
}

export default async function ApplyRefereePage() {
  const initialSchedules = await fetchSchedules();

  return (
    <>
      <PageHeader
        title="심판교육 접수"
        description="양양군서핑협회 심판인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다."
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "교육 접수", href: "/apply" },
          { label: "심판교육" },
        ]}
      />
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* 차수 변경·취소 안내 박스 */}
        <div className="mb-8 rounded-xl border border-ocean/15 bg-ocean/5 p-5 text-sm leading-relaxed">
          <p className="font-semibold text-navy mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            신청 후 차수 변경·취소가 필요하신가요?
          </p>
          <ul className="space-y-1.5 text-navy/70 ml-1">
            <li>
              차수 변경·취소는{' '}
              <a
                href="https://golineup.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean underline underline-offset-2 hover:text-ocean/80 font-medium"
              >
                golineup.kr
              </a>
              에 회원가입 후 마이페이지에서 직접 처리 가능합니다.
            </li>
            <li>대기 접수자는 확정자가 취소하면 자동으로 참가자 전환되며 알림톡이 발송됩니다.</li>
            <li>
              자세한 안내는{' '}
              <Link
                href="/programs/referee#faq"
                className="text-ocean underline underline-offset-2 hover:text-ocean/80 font-medium"
              >
                심판 교육 안내 페이지의 FAQ
              </Link>
              를 확인해주세요.
            </li>
          </ul>
        </div>

        <ApplyForm initialSchedules={initialSchedules} certType="REF" />
      </section>
    </>
  );
}
