import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import CompEntryForm, {
  type Competition,
} from "@/components/apply/CompEntryForm";

export const metadata: Metadata = {
  title: "대회 참가 신청",
  description:
    "양양군서핑협회 서핑대회 온라인 참가 신청. 회원가입 없이 신청 가능합니다.",
  alternates: { canonical: "https://ysakorea.com/apply/competition" },
  // 대회 오픈 공지 전까지 검색 비노출 (URL 직접 접근만)
  robots: { index: false, follow: false },
};

export const revalidate = 30;

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

async function fetchCompetitions(): Promise<Competition[]> {
  try {
    const res = await fetch(`${CERT_API}/api/public/competitions`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { competitions?: Competition[] };
    return data.competitions ?? [];
  } catch {
    return [];
  }
}

export default async function ApplyCompetitionPage() {
  const initialCompetitions = await fetchCompetitions();

  return (
    <>
      <PageHeader
        title="대회 참가 신청"
        description="양양군서핑협회 주관 서핑대회 온라인 참가 신청"
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "대회 참가 신청", href: "/apply/competition" },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <CompEntryForm initialCompetitions={initialCompetitions} />
      </div>
    </>
  );
}
