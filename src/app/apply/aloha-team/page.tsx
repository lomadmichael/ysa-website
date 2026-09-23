import type { Metadata } from "next";
import Link from "next/link";
import AlohaTeamBanner from "@/components/apply/AlohaTeamBanner";
import AlohaTeamEntryForm from "@/components/apply/AlohaTeamEntryForm";
import type { Competition } from "@/components/apply/CompEntryForm";
import {
  ALOHA_REFUND_POLICY,
  ALOHA_TEAM,
  ALOHA_TEAM_SLUG,
} from "@/components/apply/aloha-team";

const OG_TITLE = "2026 양양군의장배 알로하 팀 챌린지 참가 신청";
const OG_DESCRIPTION =
  "10월 9일(금) 죽도해변. 혼성 4인 1팀(남2·여2), 팀당 참가비 100,000원, 20팀 선착순. 팀 대표자가 온라인으로 신청합니다.";

export const metadata: Metadata = {
  title: "알로하 팀 챌린지 참가 신청",
  description: OG_DESCRIPTION,
  alternates: {
    canonical: "https://ysakorea.com/apply/aloha-team",
  },
  openGraph: {
    type: "website",
    url: "/apply/aloha-team",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
};

export const revalidate = 30;

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

/** 접수 대상 대회 1건만 가져온다 (접수창 밖이면 lineup 이 목록에서 빼므로 null) */
async function fetchAlohaCompetition(): Promise<Competition | null> {
  try {
    const res = await fetch(`${CERT_API}/api/public/competitions`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { competitions?: Competition[] };
    return (
      (data.competitions ?? []).find((c) => c.slug === ALOHA_TEAM_SLUG) ?? null
    );
  } catch {
    return null;
  }
}

export default async function ApplyAlohaTeamPage() {
  const competition = await fetchAlohaCompetition();

  return (
    <>
      <AlohaTeamBanner />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
        <AlohaTeamEntryForm
          initialCompetition={competition}
          brief={<AlohaTeamBrief />}
        />
      </div>
    </>
  );
}

/** 접수폼 상단 대회 안내 — 접수 완료 화면에서는 숨겨진다 */
function AlohaTeamBrief() {
  const { bank } = ALOHA_TEAM;
  const facts: { label: string; value: string }[] = [
    { label: "일시", value: `${ALOHA_TEAM.dateLabel} · ${ALOHA_TEAM.venue}` },
    { label: "구성", value: ALOHA_TEAM.format },
    { label: "참가비", value: ALOHA_TEAM.feeLabel },
    { label: "모집", value: ALOHA_TEAM.capacityLabel },
    { label: "접수", value: ALOHA_TEAM.entryPeriodLabel },
  ];

  return (
    <section className="mb-9 space-y-4">
      <Link
        href="/apply/aloha-team/edit"
        className="flex items-center justify-between gap-3 rounded-2xl border border-purple/30 bg-purple/5 px-5 py-3.5 text-sm font-semibold text-navy transition hover:bg-purple/10"
      >
        <span>
          이미 신청한 팀 — <span className="text-purple">팀 정보 수정</span>
        </span>
        <span aria-hidden="true" className="text-purple">
          →
        </span>
      </Link>

      <div className="rounded-2xl border border-ocean/15 bg-ocean/5 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-navy">대회 안내</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-3 text-sm">
              <dt className="w-12 shrink-0 font-semibold text-navy/50">
                {f.label}
              </dt>
              <dd className="font-medium text-navy">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h3 className="mb-3 text-base font-bold text-navy">경기 방식</h3>
        <ul className="space-y-2 text-sm leading-relaxed text-navy/70">
          <li className="flex gap-2.5">
            <span className="shrink-0" aria-hidden="true">🏄</span>
            <span>팀원 4명이 차례로 1인 2라이딩</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0" aria-hidden="true">⏱️</span>
            <span>
              <strong className="text-navy">8개 라이딩 시간을 합산</strong>해
              순위를 정합니다
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0" aria-hidden="true">🛟</span>
            <span>9피트 스펀지보드 제공</span>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-sunset/30 bg-sunset/5 p-5 sm:p-6">
        <h3 className="mb-3 text-base font-bold text-navy">
          참가비 입금 · 선수 교체 · 환불
        </h3>
        <p className="text-sm font-semibold text-navy">
          {bank.name} {bank.account}
        </p>
        <p className="text-xs text-navy/60">예금주 {bank.holder}</p>
        <ul className="mt-3 space-y-1 text-sm text-navy/70">
          <li>
            · 입금자명은 <strong className="text-navy">팀 대표자 이름</strong>
          </li>
          <li>
            · 신청 후 <strong className="text-navy">3일 이내 미입금 시 취소</strong>
          </li>
          {ALOHA_REFUND_POLICY.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-navy/50">
        문의: 인스타그램 @ysa_korea · ysa_korea@naver.com
      </p>
    </section>
  );
}
