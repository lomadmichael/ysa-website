import type { Metadata } from 'next';
import CampBanner from '@/components/apply/surf-camp/CampBanner';
import ProgramGuide from '@/components/apply/surf-camp/ProgramGuide';
import SurfCampForm from '@/components/apply/surf-camp/SurfCampForm';
import { DEFAULT_CAPACITY, EVENT, programLabel } from '@/lib/surfcamp-config';
import { getAvailability, type SurfcampAvailability } from '@/lib/surfcamp-db';

/**
 * 2026 양양 서핑캠프 공개 접수 페이지.
 *
 * 잔여현황은 매 요청마다 최신이어야 하므로 캐시하지 않는다.
 * 홍보용으로 검색 노출되어야 하는 페이지이므로 noindex 하지 않는다.
 */
export const dynamic = 'force-dynamic';

const OG_DESCRIPTION = `9월 12일(토)~13일(일) · 양양군민 및 양양 생활인구 대상 · ${programLabel('lesson')} ${DEFAULT_CAPACITY.lesson}명 / ${programLabel('special')} ${DEFAULT_CAPACITY.special}명`;

/** 카톡·SNS 공유 썸네일 — 페이지 상단 배너와 동일한 이미지 (1908x503) */
const OG_IMAGE = {
  url: '/images/surf-camp/banner.jpg',
  width: 1908,
  height: 503,
  alt: `${EVENT.name} 배너`,
};

export const metadata: Metadata = {
  title: '2026 양양 서핑캠프 접수',
  description: `2026 양양 서핑캠프 온라인 접수 — 9월 12일(토)~13일(일) 양양군 일원. 양양군민 및 양양 생활인구 대상, ${programLabel('lesson')}·${programLabel('special')} 가족 단위 신청. 회원가입 없이 신청할 수 있습니다.`,
  alternates: { canonical: 'https://ysakorea.com/apply/surf-camp' },
  openGraph: {
    title: `${EVENT.name} 접수`,
    description: OG_DESCRIPTION,
    url: 'https://ysakorea.com/apply/surf-camp',
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${EVENT.name} 접수`,
    description: OG_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

/**
 * getAvailability 실패 시 안전 폴백 — open:false 로 두어 접수를 열지 않는다.
 * 예약 오픈 정보도 비워 둔다(카운트다운 대신 마감 안내가 뜨는 쪽이 안전하다.
 * DB 를 못 읽는 상황에서 "곧 열립니다"라고 약속하면 안 된다).
 */
const FALLBACK_AVAILABILITY: SurfcampAvailability = {
  open: false,
  submissions_open: false,
  open_at: null,
  opens_in_seconds: null,
  lesson: { capacity: DEFAULT_CAPACITY.lesson, confirmed: 0, waitlist: 0 },
  special: { capacity: DEFAULT_CAPACITY.special, confirmed: 0, waitlist: 0 },
};

export default async function SurfCampApplyPage() {
  let availability = FALLBACK_AVAILABILITY;
  try {
    availability = await getAvailability();
  } catch (e) {
    console.error('[surfcamp] availability fetch failed:', e);
  }

  return (
    <>
      <CampBanner />
      <ProgramGuide availability={availability} />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <SurfCampForm availability={availability} />
      </section>
    </>
  );
}
