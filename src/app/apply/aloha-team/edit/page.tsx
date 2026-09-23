import type { Metadata } from "next";
import Link from "next/link";
import AlohaTeamEditForm from "@/components/apply/AlohaTeamEditForm";
import { ALOHA_TEAM } from "@/components/apply/aloha-team";

export const metadata: Metadata = {
  title: "알로하 팀 챌린지 팀 정보 수정",
  description:
    "알로하 팀 챌린지에 신청한 팀의 대표자가 휴대폰 인증 후 팀원·팀 정보를 수정합니다.",
  robots: { index: false, follow: false },
};

const BREADCRUMBS: { label: string; href?: string }[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: ALOHA_TEAM.shortTitle, href: "/apply/aloha-team" },
  { label: "팀 정보 수정" },
];

export default function AlohaTeamEditPage() {
  return (
    <>
      <nav aria-label="현재 위치" className="border-b border-foam bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-2.5 text-xs text-navy/50">
          {BREADCRUMBS.map((crumb, i) => (
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

      <section
        style={{
          background:
            "linear-gradient(120deg, var(--color-ocean) 0%, var(--color-teal) 62%, var(--color-sunset) 130%)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-4 py-7 md:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Aloha Team Challenge
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl">
            팀 정보 수정
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {ALOHA_TEAM.title}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
        <AlohaTeamEditForm />
      </div>
    </>
  );
}
