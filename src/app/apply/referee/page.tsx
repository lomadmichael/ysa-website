import type { Metadata } from "next";
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
        <ApplyForm initialSchedules={initialSchedules} certType="REF" />
      </section>
    </>
  );
}
