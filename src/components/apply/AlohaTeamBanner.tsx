import Image from "next/image";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { ScrollToFormLink } from "./aloha-team-ui";
import { ALOHA_FORM_ANCHOR, ALOHA_TEAM } from "./aloha-team";
import letteringImage from "../../../public/images/aloha/aloha-lettering.webp";
import illustImage from "../../../public/images/aloha/aloha-illust.webp";
import illustSmImage from "../../../public/images/aloha/aloha-illust-sm.webp";

/**
 * 알로하 팀 챌린지 히어로 — 공식 포스터(대회포스터.jpg) 톤.
 *
 * 포스터는 단색 주황(#EC6C01) 위에 검정 손글씨 레터링과 흰 일러스트(검정 외곽선)
 * 구성이라 그라데이션·스크림 없이 **같은 주황 단색** 위에 포스터에서 배경만 투명하게
 * 따낸 레터링·일러스트를 올린다. 한글 대회명·일정은 HTML 텍스트로 읽히게 둔다.
 *
 * - entry: 접수 페이지. 「참가 신청하기」(폼으로 스크롤) + 「이미 신청했어요 · 팀 정보 수정」
 * - edit : 팀 정보 수정 페이지. 작은 레터링 + 제목
 *
 * PageHeader 를 대체하므로 breadcrumb(시각 + JSON-LD)도 여기서 함께 책임진다.
 */

type Crumb = { label: string; href?: string };

const ENTRY_CRUMBS: Crumb[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: ALOHA_TEAM.shortTitle },
];

const EDIT_CRUMBS: Crumb[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: ALOHA_TEAM.shortTitle, href: "/apply/aloha-team" },
  { label: "팀 정보 수정" },
];

/** 포스터 하단 검정 필 문구 (공식 포스터 기준) */
const PRIZE_LABEL = "상금 1위 100만원 · 2위 50만원 · 3위 30만원";
const COMP_LABEL = "2026 양양군의장배 전국서핑대회";

const pill =
  "inline-flex items-center rounded-full bg-black px-3.5 py-1.5 text-[13px] font-bold leading-none text-white md:text-sm";

export default function AlohaTeamBanner({
  variant = "entry",
}: {
  variant?: "entry" | "edit";
}) {
  const crumbs = variant === "entry" ? ENTRY_CRUMBS : EDIT_CRUMBS;

  return (
    <>
      {variant === "entry" && (
        <BreadcrumbJsonLd
          items={crumbs.map((b) => ({ name: b.label, url: b.href }))}
        />
      )}

      <nav aria-label="현재 위치" className="border-b border-foam bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-2.5 text-xs text-navy/50">
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-navy"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-navy/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </nav>

      {variant === "entry" ? <EntryHero /> : <EditHero />}
    </>
  );
}

function EntryHero() {
  return (
    <section className="relative overflow-hidden bg-[#EC6C01] text-black">
      <div className="mx-auto grid max-w-[1200px] items-center gap-x-6 px-4 pt-6 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:pt-10 lg:gap-x-10">
        <div className="pb-2 md:pb-12">
          <h1>
            <span className={pill}>{COMP_LABEL}</span>
            <Image
              src={letteringImage}
              alt="알로하 팀 챌린지 (ALOHA TEAM CHALLENGE)"
              priority
              sizes="(min-width: 1200px) 600px, (min-width: 768px) 54vw, 100vw"
              className="mt-4 h-auto w-full max-w-[600px] md:mt-5"
            />
          </h1>

          <p className="mt-4 text-[17px] font-extrabold leading-snug md:mt-5 md:text-xl">
            {ALOHA_TEAM.dateLabel} · {ALOHA_TEAM.venue}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug md:text-base">
            알로하 팀 챌린지 · {ALOHA_TEAM.format}
          </p>
          <p className={`${pill} mt-3`}>{PRIZE_LABEL}</p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ScrollToFormLink
              targetId={ALOHA_FORM_ANCHOR}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-base font-bold text-white transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              참가 신청하기
              <span aria-hidden="true">↓</span>
            </ScrollToFormLink>
            <Link
              href="/apply/aloha-team/edit"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-[#FFF4E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              이미 신청했어요 · 팀 정보 수정
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* 일러스트 — 데스크톱은 깃발·보드까지 전체, 모바일은 서퍼 4명 중심 */}
        <div className="relative self-end">
          <Image
            src={illustImage}
            alt=""
            sizes="(min-width: 1200px) 520px, 46vw"
            className="hidden h-auto w-full md:block"
          />
          <Image
            src={illustSmImage}
            alt=""
            sizes="80vw"
            className="mx-auto mt-4 block h-auto w-[82%] max-w-[360px] md:hidden"
          />
        </div>
      </div>
    </section>
  );
}

function EditHero() {
  return (
    <section className="relative overflow-hidden bg-[#EC6C01] text-black">
      <div className="mx-auto grid max-w-[1200px] items-end gap-x-8 px-4 pt-6 md:grid-cols-[minmax(0,1fr)_280px] md:pt-9 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="pb-7 md:pb-10">
          <span className={pill}>{COMP_LABEL}</span>
          <Image
            src={letteringImage}
            alt=""
            priority
            sizes="(min-width: 768px) 380px, 70vw"
            className="mt-3.5 h-auto w-[72%] max-w-[380px]"
          />
          <h1 className="mt-4 text-[28px] font-black leading-tight tracking-tight md:text-4xl">
            팀 정보 수정
          </h1>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed md:text-base">
            {ALOHA_TEAM.shortTitle} · 대표자 휴대폰 인증 후 팀원·팀 정보를
            수정합니다
          </p>
          <Link
            href="/apply/aloha-team"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#FFF4E8]"
          >
            <span aria-hidden="true">←</span> 대회 안내 · 참가 신청
          </Link>
        </div>
        <Image
          src={illustSmImage}
          alt=""
          sizes="340px"
          className="hidden h-auto w-full md:block"
        />
      </div>
    </section>
  );
}
