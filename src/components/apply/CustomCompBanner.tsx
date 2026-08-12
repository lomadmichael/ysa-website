import Image from "next/image";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/components/shared/JsonLd";
import { CUSTOM_COMP } from "@/lib/custom-comp-2026";
import bannerImage from "../../../public/images/custom-comp/banner.jpg";
import yysLogoWhite from "../../../public/images/surf-camp/yys-logo-white.png";

/**
 * 2026 맞춤형 서핑대회 접수 페이지 히어로 배너 (서핑캠프 CampBanner 패턴).
 *
 * 배경은 대회 포스터의 **글자 없는 원본 아트워크**를 쓴다. 완성 포스터를 깔면
 * 포스터 안 타이포와 배너 타이포가 겹쳐 읽히지 않는다.
 * 모래 위 선수들이 보이도록 세로 위치를 62% 지점으로 잡고, 크림색 모래 위에서
 * 흰 글씨가 죽지 않게 포스터와 같은 딥그린으로 스크림을 덮는다.
 *
 * PageHeader 를 대체하므로 breadcrumb(시각 + JSON-LD)도 여기서 함께 책임진다.
 */

const BREADCRUMBS: { label: string; href?: string }[] = [
  { label: "홈", href: "/" },
  { label: "온라인 접수", href: "/apply" },
  { label: CUSTOM_COMP.title },
];

export default function CustomCompBanner() {
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

      <section className="relative h-[236px] overflow-hidden bg-[#042A69] md:h-[292px] lg:h-[330px]">
        <Image
          src={bannerImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 24%" }}
        />
        {/* 가독성용 스크림.
            모래(크림)를 배경으로 쓰면 흰 글씨가 죽어 스크림을 진하게 깔아야 하고,
            그러면 포스터의 시원한 색이 탁해진다. 그래서 원래 어두운 **바다(코발트)**
            구간을 배경으로 잡고, 같은 계열의 딥코발트로 얇게만 덮는다. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(4,42,105,0.88) 0%, rgba(4,42,105,0.6) 48%, rgba(4,42,105,0.08) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background:
              "linear-gradient(to top, rgba(4,42,105,0.55), transparent)",
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
            {CUSTOM_COMP.title}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-white/85 md:mt-2 md:text-sm">
            {CUSTOM_COMP.dateLabel} · {CUSTOM_COMP.venue} ·{" "}
            <span className="font-bold text-white">참가비 무료</span>
          </p>
          <p className="mt-0.5 text-[11px] text-white/65 md:text-xs">
            {CUSTOM_COMP.target} 대상
          </p>
          <p className="mt-1.5 text-[11px] text-white/55 md:text-xs">
            주최 양양군 · 양양군체육회 · 주관 양양군서핑협회
          </p>
        </div>
      </section>
    </>
  );
}
