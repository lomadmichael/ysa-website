import Image from 'next/image';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/components/shared/JsonLd';
import { EVENT } from '@/lib/surfcamp-config';
import bannerImage from '../../../../public/images/surf-camp/banner.jpg';
import yysLogoWhite from '../../../../public/images/surf-camp/yys-logo-white.png';

/**
 * 2026 양양 서핑캠프 접수 페이지 히어로 배너.
 *
 * PageHeader 를 대체하므로 breadcrumb(시각 + JSON-LD)도 여기서 함께 책임진다.
 * 원본 배너가 3.8:1 가로형이라 높이를 낮게 고정하고 object-cover 로 잘라 쓴다.
 */

const BREADCRUMBS: { label: string; href?: string }[] = [
  { label: '홈', href: '/' },
  { label: '온라인 접수', href: '/apply' },
  { label: EVENT.name },
];

const PROJECT_NAME = '2026 지역자율형 생활체육활동지원 사업';

export default function CampBanner() {
  return (
    <>
      {/* BreadcrumbList JSON-LD — PageHeader 를 쓰지 않으므로 직접 주입 */}
      <BreadcrumbJsonLd
        items={BREADCRUMBS.map((b) => ({ name: b.label, url: b.href }))}
      />

      <nav
        aria-label="현재 위치"
        className="border-b border-foam bg-white"
      >
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

      <section className="relative h-[200px] overflow-hidden bg-navy md:h-[260px] lg:h-[300px]">
        <Image
          src={bannerImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* 가독성용 스크림 — 좌측(텍스트)과 하단을 어둡게 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(26,26,46,0.9) 0%, rgba(26,26,46,0.7) 45%, rgba(26,26,46,0.2) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{
            background: 'linear-gradient(to top, rgba(26,26,46,0.65), transparent)',
          }}
        />

        <div className="relative mx-auto flex h-full max-w-[1200px] flex-col justify-center px-4 py-5">
          {/*
            ★ self-start 필수.
            부모가 flex-col 이라 align-items 기본값 stretch 가 이미지 가로폭을
            컨테이너 전체로 늘려버린다(w-auto 로는 못 막는다). 원본 비율
            800x371 을 지키려면 교차축 stretch 를 꺼야 한다. 왼쪽 정렬도 겸한다.
          */}
          <Image
            src={yysLogoWhite}
            alt="양양군체육회"
            className="h-8 w-auto self-start drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] md:h-10"
            priority
          />
          <p className="mt-3 text-[11px] font-medium tracking-wide text-white/70 md:text-xs">
            {PROJECT_NAME}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
            {EVENT.name}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-white/85 md:mt-2 md:text-sm">
            {EVENT.specialDateLabel} · 양양군민 및 양양 생활인구 대상 ·{' '}
            <span className="font-bold text-white">참가비 무료</span>
          </p>
          <p className="mt-0.5 text-[11px] text-white/60 md:text-xs">
            주최 {EVENT.host} · 주관 {EVENT.organizer}
          </p>
        </div>
      </section>
    </>
  );
}
