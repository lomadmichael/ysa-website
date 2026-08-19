import { fetchLineupDivisions, type LineupDivisionsResponse } from '@/lib/lineup-api';

/**
 * 비기너 대진표 선수 사진 프록시.
 *
 * 라인업이 주는 photo_url 은 **5분 만료 서명 URL** 인데, 라인업 쪽 발급 캐시(최대 4분 경과분 제공)
 * 와 우리 데이터 캐시(60초)가 겹치면 페이지에 박힌 URL 이 브라우저가 로드하는 시점에 이미
 * 만료돼 사진이 전멸한다(전원 같은 시점에 발급되므로 한 번 걸리면 전부).
 *
 * 그래서 페이지에는 만료 없는 이 프록시 URL 을 박고, 서버가 요청 시점에 신선한 서명 URL 로
 * 사진을 받아 CDN 에 길게 캐시시킨다. 선수 사진은 대회 기간 중 바뀌지 않는 자산이다.
 *
 * 폴백 체인: 캐시된 매핑의 URL 로 시도 → 만료(4xx)면 no-store 재조회로 URL 재획득 후 1회
 * 재시도 → 그래도 실패하면 404 (클라이언트 onError 가 이니셜 아바타로 대체).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** CDN 하루 캐시 — 121명 사진이라도 엣지에 앉으면 라인업 원본 부하는 사실상 0 */
const CACHE_HEADER = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400';

function findPhotoUrl(data: LineupDivisionsResponse | null, entryId: string): string | null {
  if (!data) return null;
  for (const division of data.divisions) {
    for (const round of division.rounds) {
      for (const heat of round.heats) {
        for (const athlete of heat.athletes) {
          if (athlete.entry_id === entryId) return athlete.photo_url ?? null;
        }
      }
    }
  }
  return null;
}

async function fetchImage(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  if (!UUID_RE.test(entryId)) return new Response(null, { status: 400 });

  // 1차: 60초 캐시된 편성 데이터의 서명 URL
  let photoUrl = findPhotoUrl(await fetchLineupDivisions(), entryId);
  let image = photoUrl ? await fetchImage(photoUrl) : null;

  // 만료·실패 시 1회 재시도: 캐시를 우회해 방금 발급된 서명 URL 로
  if (!image) {
    photoUrl = findPhotoUrl(await fetchLineupDivisions(undefined, { fresh: true }), entryId);
    image = photoUrl ? await fetchImage(photoUrl) : null;
  }
  if (!image || !image.body) return new Response(null, { status: 404 });

  return new Response(image.body, {
    status: 200,
    headers: {
      'Content-Type': image.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': CACHE_HEADER,
    },
  });
}
