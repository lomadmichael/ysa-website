import Image from "next/image";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { LANDSURF } from "@/lib/landsurf-2026";
import bannerImage from "../../../../public/images/landsurf/banner.jpg";
import yysLogoWhite from "../../../../public/images/surf-camp/yys-logo-white.png";

/**
 * 랜드서핑 성과공유회 접수 페이지 히어로 배너 (서핑캠프·맞춤형 대회와 같은 패턴).
 *
 * 배경은 2025년 랜드서핑교실 수업 사진 — 양양보드파크에서 아이들이 타는 장면이다.
 * AI 일러스트 대신 실제 수업 사진을 쓴 이유: 1·2기 참가자가 자기 수업으로 알아본다.
 * 인물이 사진 아래쪽에 몰려 있어 세로 위치를 62% 지점으로 내려 잡았다.
 *
 * PageHeader 를 대체하므로 breadcrumb(시각 + JSON-LD)도 여기서 함께 책임진다.
 */

const BREADCRUMBS: { label: string; href?: string }[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: "랜드서핑 성과공유회" },
];

export default function LandSurfBanner() {
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
                <Link href={crumb.href} className="transition-colors hover:text-navy">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-navy/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </nav>

      <section className="relative h-[236px] overflow-hidden bg-[#0A1E3C] md:h-[292px] lg:h-[330px]">
        <Image
          src={bannerImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 62%" }}
        />
        {/* 가독성용 스크림.
            좌측 텍스트 폭(약 절반)만 덮고 우측은 사진이 그대로 보이게 빠르게 투명해진다.
            — 처음엔 45% 지점까지 0.72 로 깔았더니 좁은 화면에서 사진이 통째로 묻혔다. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(95deg, rgba(10,30,60,0.9) 0%, rgba(10,30,60,0.62) 28%, rgba(10,30,60,0.2) 55%, rgba(10,30,60,0.04) 78%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background: "linear-gradient(to top, rgba(10,30,60,0.45), transparent)",
          }}
        />

        <div className="relative mx-auto flex h-full max-w-[1200px] flex-col justify-center px-4 py-5">
          {/* self-start: 부모 flex-col 의 stretch 가 로고를 가로로 늘리는 것을 막는다 */}
          <Image
            src={yysLogoWhite}
            alt="양양군체육회"
            className="h-8 w-auto self-start drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] md:h-10"
            priority
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
            {LANDSURF.title}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-white/85 md:mt-2 md:text-sm">
            {LANDSURF.dateLabel} · {LANDSURF.venue} ·{" "}
            <span className="font-bold text-white">참가비 무료</span>
          </p>
          <p className="mt-0.5 text-[11px] text-white/65 md:text-xs">
            {LANDSURF.target} 대상
          </p>
          <p className="mt-1.5 text-[11px] text-white/55 md:text-xs">
            주최 {LANDSURF.host} · 주관 {LANDSURF.organizer}
          </p>
        </div>
      </section>
    </>
  );
}
