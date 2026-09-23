import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { ALOHA_TEAM } from "./aloha-team";

/**
 * 알로하 팀 챌린지 접수 페이지 히어로 (CustomCompBanner 패턴, 이미지 없이 그라데이션).
 * PageHeader 를 대체하므로 breadcrumb(시각 + JSON-LD)도 여기서 함께 책임진다.
 */

const BREADCRUMBS: { label: string; href?: string }[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: ALOHA_TEAM.shortTitle },
];

export default function AlohaTeamBanner() {
  return (
    <>
      <BreadcrumbJsonLd
        items={BREADCRUMBS.map((b) => ({ name: b.label, url: b.href }))}
      />

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
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(120deg, var(--color-ocean) 0%, var(--color-teal) 62%, var(--color-sunset) 130%)",
        }}
      >
        <div className="relative mx-auto max-w-[1200px] px-4 py-9 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Aloha Team Challenge
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-white md:text-3xl lg:text-4xl">
            {ALOHA_TEAM.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            {ALOHA_TEAM.dateLabel} · {ALOHA_TEAM.venue} ·{" "}
            <span className="font-bold text-white">{ALOHA_TEAM.format}</span>
          </p>
          <p className="mt-1.5 text-xs text-white/65">
            주관 양양군서핑협회
          </p>
        </div>
      </section>
    </>
  );
}
