import type { Metadata } from "next";
import CustomCompBanner from "@/components/apply/CustomCompBanner";
import CustomCompEntryForm from "@/components/apply/CustomCompEntryForm";
import type { Competition } from "@/components/apply/CompEntryForm";
import {
  CUSTOM_COMP,
  CUSTOM_COMP_CLOSE_LABEL,
  CUSTOM_COMP_SLUG,
} from "@/lib/custom-comp-2026";

const OG_TITLE = "2026 맞춤형 서핑대회 참가 신청";
const OG_DESCRIPTION =
  "2026 맞춤형 서핑교실 1~4기 참가자 대상 서핑대회. 8월 23일(일) 죽도해변, 참가비 무료. 회원가입 없이 신청 가능합니다.";
/** 카톡·SNS 공유 썸네일 — 대회 포스터 아트워크 기반 (1200x630) */
const OG_IMAGE = {
  url: "/images/custom-comp/og.jpg",
  width: 1200,
  height: 630,
  alt: "2026 맞춤형 서핑대회 · 8월 23일(일) 죽도해변",
};

export const metadata: Metadata = {
  title: "맞춤형 서핑대회 참가 신청",
  description: OG_DESCRIPTION,
  alternates: {
    canonical: "https://ysakorea.com/apply/custom-competition",
  },
  openGraph: {
    type: "website",
    url: "/apply/custom-competition",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export const revalidate = 30;

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

/** 접수 대상 대회 1건만 가져온다 (접수창 밖이면 lineup 이 목록에서 빼므로 null) */
async function fetchCustomCompetition(): Promise<Competition | null> {
  try {
    const res = await fetch(`${CERT_API}/api/public/competitions`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { competitions?: Competition[] };
    return (
      (data.competitions ?? []).find((c) => c.slug === CUSTOM_COMP_SLUG) ?? null
    );
  } catch {
    return null;
  }
}

export default async function ApplyCustomCompetitionPage() {
  const competition = await fetchCustomCompetition();

  return (
    <>
      <CustomCompBanner />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <CustomCompEntryForm
          initialCompetition={competition}
          brief={<CustomCompBrief />}
        />
      </div>
    </>
  );
}

/** 접수폼 상단 대회 안내 — 접수 완료 화면에서는 숨겨진다 */
function CustomCompBrief() {
  const facts: { label: string; value: string }[] = [
    { label: "일시", value: CUSTOM_COMP.dateLabel },
    { label: "장소", value: CUSTOM_COMP.venue },
    { label: "대상", value: CUSTOM_COMP.target },
    { label: "부문", value: "성인부 · 아동부 (각 48명)" },
    { label: "참가비", value: "무료" },
    { label: "접수 마감", value: CUSTOM_COMP_CLOSE_LABEL },
  ];

  return (
    <section className="mb-10 space-y-6">
      {/* 대회명·일시·장소는 상단 배너가 이미 말했다. 여기는 접수 직전 확인용 요약 */}
      <div className="rounded-2xl border border-ocean/15 bg-ocean/5 p-5 sm:p-6">
        <h2 className="text-xl font-bold text-navy">대회 안내</h2>
        <p className="mt-1.5 text-sm text-navy/60">
          한 해 동안 맞춤형 서핑교실에서 함께 배운 실력을 겨루는 대회입니다.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-3 text-sm">
              <dt className="w-16 shrink-0 font-semibold text-navy/50">
                {f.label}
              </dt>
              <dd className="font-medium text-navy">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-navy">
          접수 전 확인해 주세요
        </h3>
        <ul className="space-y-2.5">
          <li className="flex gap-2.5 text-sm leading-relaxed text-navy/70">
            <span className="shrink-0" aria-hidden="true">
              📌
            </span>
            <span>
              <strong className="text-navy">
                맞춤형 서핑교실 1~4기 참가자
              </strong>
              를 대상으로 하는 대회입니다.
            </span>
          </li>
          <li className="flex gap-2.5 text-sm leading-relaxed text-navy/70">
            <span className="shrink-0" aria-hidden="true">
              📌
            </span>
            <span>
              성인부·아동부 중{" "}
              <strong className="text-navy">한 부문만 신청</strong>할 수
              있습니다.
            </span>
          </li>
          <li className="flex gap-2.5 text-sm leading-relaxed text-navy/70">
            <span className="shrink-0" aria-hidden="true">
              📌
            </span>
            <span>
              참가비는 <strong className="text-navy">없습니다.</strong> 접수와
              동시에 참가가 확정되며, 확인 문자가 발송됩니다.
            </span>
          </li>
          <li className="flex gap-2.5 text-sm leading-relaxed text-navy/70">
            <span className="shrink-0" aria-hidden="true">
              📌
            </span>
            <span>
              세부 진행 순서(조 편성·집결 시간)는{" "}
              <strong className="text-navy">접수 마감 후 개별 안내</strong>
              드립니다.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
