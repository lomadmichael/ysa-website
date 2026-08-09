import type { Metadata } from 'next';
import PageHeader from '@/components/shared/PageHeader';
import SurfCampForm from '@/components/apply/surf-camp/SurfCampForm';
import { DEFAULT_CAPACITY, EVENT } from '@/lib/surfcamp-config';
import { getAvailability, type SurfcampAvailability } from '@/lib/surfcamp-db';

/**
 * 2026 양양 서핑캠프 공개 접수 페이지.
 *
 * 잔여현황은 매 요청마다 최신이어야 하므로 캐시하지 않는다.
 * 홍보용으로 검색 노출되어야 하는 페이지이므로 noindex 하지 않는다.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '2026 양양 서핑캠프 접수',
  description:
    '2026 양양 서핑캠프 온라인 접수 — 9월 12일(토)~13일(일) 양양군 일원. 양양군민 및 양양 생활인구 대상, 서핑강습·특화체험 가족 단위 신청. 회원가입 없이 신청할 수 있습니다.',
  alternates: { canonical: 'https://ysakorea.com/apply/surf-camp' },
  openGraph: {
    title: `${EVENT.name} 접수`,
    description:
      '9월 12일(토)~13일(일) · 양양군민 및 양양 생활인구 대상 · 서핑강습 200명 / 특화체험 300명',
    url: 'https://ysakorea.com/apply/surf-camp',
    type: 'website',
  },
};

/** getAvailability 실패 시 안전 폴백 — open:false 로 두어 접수를 열지 않는다. */
const FALLBACK_AVAILABILITY: SurfcampAvailability = {
  open: false,
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
      <PageHeader
        title={EVENT.name}
        description={`${EVENT.specialDateLabel} · 양양군민 및 양양 생활인구 대상 · 주최 ${EVENT.host} / 주관 ${EVENT.organizer}`}
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '온라인 접수', href: '/apply' },
          { label: '2026 양양 서핑캠프' },
        ]}
      />
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <SurfCampForm availability={availability} />
      </section>
    </>
  );
}
