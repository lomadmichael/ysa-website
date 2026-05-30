import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import ApplyForm from "@/components/apply/ApplyForm";
import EducationFAQ from "@/components/programs/EducationFAQ";

export const metadata: Metadata = {
  title: "강사교육 접수",
  description:
    "양양군서핑협회 강사인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다.",
  alternates: { canonical: "https://ysakorea.com/apply/instructor" },
};

export const revalidate = 60;

// cert-manager 현재 호스트. 구 cert-manager-taupe.vercel.app 은 308 리다이렉트라
// 현재 호스트(golineup.kr)를 fallback 으로 둔다. NEXT_PUBLIC_CERT_API_BASE 로 override.
const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

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

export default async function ApplyInstructorPage() {
  const initialSchedules = await fetchSchedules();

  return (
    <>
      <PageHeader
        title="강사교육 접수"
        description="양양군서핑협회 강사인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다."
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "교육 접수", href: "/apply" },
          { label: "강사교육" },
        ]}
      />
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <ApplyForm initialSchedules={initialSchedules} certType="INS" />
        <EducationFAQ />
      </section>
    </>
  );
}
