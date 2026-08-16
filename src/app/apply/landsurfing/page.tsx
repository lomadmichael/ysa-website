import type { Metadata } from "next";
import LandSurfBanner from "./LandSurfBanner";
import LandSurfForm from "./LandSurfForm";
import {
  LANDSURF,
  LANDSURF_CLOSES_AT,
  LANDSURF_CLOSE_LABEL,
  LANDSURF_SCHEDULE,
} from "@/lib/landsurf-2026";

const OG_DESCRIPTION =
  "2026 랜드서핑 성과공유회 참가 신청. 8월 23일(일) 죽도해변, 랜드서핑교실 1·2기 참가자와 학부모 대상, 참가비 무료.";
/** 카톡·SNS 공유 썸네일 — 접수 페이지 배너와 같은 수업 사진 기반 (1200x630) */
const OG_IMAGE = {
  url: "/images/landsurf/og.jpg",
  width: 1200,
  height: 630,
  alt: "2026 랜드서핑 성과공유회 · 8월 23일(일) 죽도해변",
};

export const metadata: Metadata = {
  title: "랜드서핑 성과공유회 참가 신청",
  description: OG_DESCRIPTION,
  alternates: { canonical: "https://ysakorea.com/apply/landsurfing" },
  openGraph: {
    type: "website",
    url: "/apply/landsurfing",
    title: "2026 랜드서핑 성과공유회 참가 신청",
    description: OG_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 랜드서핑 성과공유회 참가 신청",
    description: OG_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// 접수 마감 여부가 화면에 걸리므로 캐시를 짧게 둔다
export const revalidate = 60;

export default function LandSurfingPage() {
  const closed = Date.now() > LANDSURF_CLOSES_AT;

  return (
    <>
      <LandSurfBanner />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <section className="mb-10 space-y-6">
          <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-navy">{LANDSURF.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-navy/60">
              한 해 동안 랜드서핑교실에서 배운 것을 함께 나누는 자리입니다. 기록을
              겨루기보다 그동안의 연습을 서로 보여주고 즐기는 날입니다.
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                { label: "일시", value: `${LANDSURF.dateLabel} ${LANDSURF.timeLabel}` },
                { label: "집결", value: LANDSURF.assemblePlace },
                { label: "대상", value: LANDSURF.target },
                { label: "참가비", value: LANDSURF.feeLabel },
                { label: "접수 마감", value: LANDSURF_CLOSE_LABEL },
                { label: "주최", value: `${LANDSURF.host} · 주관 ${LANDSURF.organizer}` },
              ].map((f) => (
                <div key={f.label} className="flex gap-3 text-sm">
                  <dt className="w-16 shrink-0 font-semibold text-navy/50">{f.label}</dt>
                  <dd className="font-medium text-navy">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h3 className="mb-4 text-base font-bold text-navy">당일 진행 순서</h3>
            <ol className="space-y-3">
              {LANDSURF_SCHEDULE.map((s) => (
                <li key={s.time} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="w-32 shrink-0 font-mono text-xs text-teal font-semibold pt-0.5">
                    {s.time}
                  </span>
                  <span className="font-semibold text-navy">{s.title}</span>
                  {s.desc && <span className="text-navy/55">{s.desc}</span>}
                </li>
              ))}
            </ol>
            <p className="mt-4 border-t border-gray-100 pt-4 text-xs text-navy/50">
              우천 시 진행 방식이 달라질 수 있으며, 변경 시 접수하신 연락처로
              안내드립니다.
            </p>
          </div>
        </section>

        <LandSurfForm closed={closed} />
      </div>
    </>
  );
}
