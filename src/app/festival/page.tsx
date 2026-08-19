import type { Metadata } from 'next';
import { getImageProps } from 'next/image';
import ApplyPanel from '@/components/festival/ApplyPanel';
import BeginnerPanel from '@/components/festival/BeginnerPanel';
import FestivalIntroPanel from '@/components/festival/FestivalIntroPanel';
import FestivalTabs from '@/components/festival/FestivalTabs';
import OpenCompetitionPanel, {
  OPEN_COMPETITIONS,
} from '@/components/festival/OpenCompetitionPanel';
import type { InfoRow } from '@/components/festival/CompetitionInfoCard';
import type { RuleDoc } from '@/components/festival/CompetitionDocs';
import { parseFestivalTab, type FestivalTabId } from '@/components/festival/tabs';
import type { EntryWindowKey } from '@/lib/festival-2026';
import { fetchLineupDivisions } from '@/lib/lineup-api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import mainBannerPc from '../../../public/images/festival/mainbanner_2026_pc.jpg';
import mainBannerMobile from '../../../public/images/festival/mainbanner_2026_mobile.jpg';

const PAGE_TITLE = '2026 양양서핑페스티벌 · 대한서핑협회장배 서핑대회';
const PAGE_DESCRIPTION =
  '2026 양양서핑페스티벌 · 대한서핑협회장배 서핑대회 안내. 죽도해변 비기너 서핑대회 대진표와 코리아 오픈(숏보드 · 롱보드 · SUP 서핑) 일정 · 참가 안내를 확인하세요.';
/** 카톡·SNS 공유용 (1200x630). 루트 layout 의 기본 og.jpg 대신 페이지 전용 이미지 사용 */
const OG_IMAGE = {
  url: '/images/og-festival.jpg',
  width: 1200,
  height: 630,
  alt: PAGE_TITLE,
};

export const metadata: Metadata = {
  title: '서핑페스티벌·대회',
  description: PAGE_DESCRIPTION,
  alternates: { canonical: 'https://ysakorea.com/festival' },
  openGraph: {
    type: 'website',
    url: '/festival',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

interface Competition {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
  /** 접수창 키 — 비기너는 beach, 오픈부는 open (SUP 레이싱 취소로 beach = 비기너 전용) */
  windowKey: EntryWindowKey;
  rows: InfoRow[];
}

/**
 * 취소된 대회 — 화면에 렌더하지 않는다 (2026-08-11 형님 확정).
 *
 * 「코리아 오픈 — SUP 레이싱」은 **참가자 부족으로 대회 취소**.
 * 접수분(확정 35건 · 실인원 13명, 전원 입금 완료)은 운영 DB 에 그대로 보존되고,
 * 여기 정의도 지우지 않고 남겨 둔다 — 취소 안내·환불 정산·결과보고에 필요한 원본이다.
 * 되살릴 때는 아래 객체를 탭 구성(FESTIVAL_TABS)과 패널에 다시 넣고 접수창(windowKey)만 확인하면 된다.
 */
const CANCELLED_COMPETITIONS: Competition[] = [
  {
    id: 'sup-race',
    icon: '🚣',
    title: '코리아 오픈 — SUP 레이싱',
    subtitle: '누구나 참가할 수 있는 기록 경기',
    badge: '대회 취소',
    badgeClass: 'text-navy/50 bg-navy/10',
    accentClass: 'bg-navy/10 text-navy/50',
    windowKey: 'beach',
    rows: [
      { label: '장소', value: '죽도해변' },
      {
        label: '대회일',
        value: '8월 29일(토) ~ 30일(일)',
        note: '※ 기상 상황에 따라 9월 첫째주로 변경 가능',
      },
      {
        label: '종목',
        value: '스프린터 · 테크니컬 · 롱 디스턴스 (각 남 / 여, 인원 제한 없음)',
      },
      { label: '참가대상', value: '제한 없음' },
      { label: '심사', value: '기록경기 (피니시라인 초 재기)' },
      { label: '접수', value: '8월 5일(수) 09:00 ~ 8월 9일(일) 23:59' },
      { label: '참가비', value: '종목당 5만원' },
      {
        label: '시상',
        value: '1위 30만원 · 2위 20만원 · 3위 10만원',
        note: '6개 부문 각각 시상',
      },
      { label: '참가 굿즈', value: '모자 · 티셔츠' },
    ],
  },
];
void CANCELLED_COMPETITIONS; // 보존용 — 렌더하지 않음

/**
 * 대회 운영 문서 — 자료실(/notice/docs)에 올라온 파일을 그대로 링크한다.
 *
 * URL 을 하드코딩하지 않는 이유: 형님이 관리자에서 새 버전 PDF 로 교체하면
 * 저장소 경로가 바뀌는데, 하드코딩해 두면 이 페이지 링크만 조용히 죽는다.
 * 제목 키워드로 찾으므로 파일을 지웠다 다시 올려도(=id 가 바뀌어도) 계속 잡힌다.
 */
async function getCompetitionDocs(): Promise<{
  rulebook: RuleDoc | null;
  objection: RuleDoc | null;
}> {
  const empty = { rulebook: null, objection: null };
  try {
    if (!isSupabaseConfigured) return empty;
    const { data, error } = await supabase
      .from('documents')
      .select('title, file_url, external_url, date')
      .order('date', { ascending: false });
    if (error) throw error;

    const pick = (keyword: string): RuleDoc | null => {
      const hit = (data ?? []).find((d) => d.title?.includes(keyword));
      const href = hit?.file_url ?? hit?.external_url;
      return hit && href ? { title: hit.title, href } : null;
    };
    return { rulebook: pick('ISA'), objection: pick('이의제기') };
  } catch {
    // 자료실 조회가 실패해도 페스티벌 페이지 전체가 죽으면 안 된다
    return empty;
  }
}

// 자료실에서 문서를 교체하면 최대 5분 안에 이 페이지 링크도 갱신된다
// (대진표는 lineup-api 에서 60초 캐시로 따로 관리)
export const revalidate = 300;

/** `?tab=` 쿼리 (Next 16: searchParams 는 Promise) */
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function FestivalPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // 인스타 등 외부 링크가 `/festival?tab=beginner` 로 바로 들어와도
  // 첫 페인트에 해당 탭(대진표 포함)이 그려져야 한다 — 그래서 SSR 에서 탭을 읽는다
  const initialTab: FestivalTabId = parseFestivalTab((await searchParams).tab);

  // 자료실 문서와 대진표는 서로 무관하니 병렬로 (둘 다 실패해도 페이지는 뜬다)
  const [docs, lineup] = await Promise.all([
    getCompetitionDocs(),
    fetchLineupDivisions(),
  ]);

  // 공식 배너 art direction — 데스크톱(16:9)·모바일(2:3) 각각 한 장만 다운로드
  const bannerAlt =
    '2026 양양서핑페스티벌 — 8월 죽도해변, 대한서핑협회장배 서핑대회와 함께 펼쳐지는 서핑 축제';
  const {
    props: { srcSet: bannerDesktopSrcSet },
  } = getImageProps({ alt: bannerAlt, sizes: '100vw', src: mainBannerPc });
  const {
    props: { srcSet: bannerMobileSrcSet, alt: _alt, ...bannerImgProps },
  } = getImageProps({ alt: bannerAlt, sizes: '100vw', src: mainBannerMobile });

  const panels = [
    { id: 'festival' as const, content: <FestivalIntroPanel /> },
    {
      id: 'beginner' as const,
      content: <BeginnerPanel lineup={lineup} docs={docs} />,
    },
    ...OPEN_COMPETITIONS.map((comp) => ({
      id: comp.id,
      content: <OpenCompetitionPanel comp={comp} />,
    })),
    { id: 'apply' as const, content: <ApplyPanel /> },
  ];

  return (
    <div className="-mt-16">
      {/* Hero — 공식 배너 (타이틀이 이미지에 포함된 디자인) */}
      <section className="relative overflow-hidden bg-navy pt-16">
        <picture>
          <source media="(min-width: 768px)" srcSet={bannerDesktopSrcSet} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt는 bannerAlt로 명시 전달 */}
          <img
            {...bannerImgProps}
            srcSet={bannerMobileSrcSet}
            alt={bannerAlt}
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </picture>

        {/* 배너에 타이틀이 있어 텍스트는 스크린리더·검색엔진 전용 */}
        <div className="sr-only">
          <h1>2026 양양서핑페스티벌</h1>
          <p>8월 죽도해변 — 대한서핑협회장배 서핑대회와 함께 펼쳐지는 서핑 축제</p>
        </div>
      </section>

      {/* 배너 바로 아래 탭 — 패널은 서버에서 미리 렌더해 넘긴다 */}
      <FestivalTabs initialTab={initialTab} panels={panels} />
    </div>
  );
}
