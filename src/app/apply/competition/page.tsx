import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import CompEntryForm, {
  type Competition,
} from "@/components/apply/CompEntryForm";
import DepositNotice from "@/components/apply/DepositNotice";
import { ENTRY_WINDOWS } from "@/lib/festival-2026";

// 접수 시작(8/4 00:00 KST) 전까지는 검색 비노출, 오픈 이후 자동으로 index 허용.
// `revalidate = 30` 덕분에 오픈 직후 최대 30초 안에 메타데이터가 갱신된다.
export async function generateMetadata(): Promise<Metadata> {
  const entryOpened = Date.now() >= ENTRY_WINDOWS.beach.opensAt;

  return {
    title: "대회 참가 신청",
    description:
      "대한서핑협회장배 서핑대회 온라인 참가 신청. 회원가입 없이 신청 가능합니다.",
    alternates: { canonical: "https://ysakorea.com/apply/competition" },
    robots: entryOpened
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

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
        description="대한서핑협회장배 서핑대회 온라인 참가 신청 (주관: 양양군서핑협회)"
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "대회 참가 신청", href: "/apply/competition" },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* 접수 완료 화면에서는 합계가 포함된 안내로 대체되므로 폼이 슬롯을 제어한다.
            폼이 이 슬롯을 제일 하단에 배치한다 (형님 확정 2026-07-29) */}
        <CompEntryForm initialCompetitions={initialCompetitions}>
          <DepositNotice />
        </CompEntryForm>
      </div>
    </>
  );
}
