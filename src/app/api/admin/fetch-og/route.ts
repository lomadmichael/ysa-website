import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { isAllowedAdmin } from '@/lib/admin-auth';
import type { Database } from '@/lib/database.types';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'media';
const STORAGE_PREFIX = 'press-og/';

// 일부 한국 언론사가 default UA 차단함 → Chrome UA 명시
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
};

type FetchOgPayload = {
  url?: unknown;
};

type FetchOgResponse = {
  title: string | null;
  description: string | null;
  source: string | null;
  thumbnailUrl: string | null;
  /** OG 메타에 있던 원본 이미지 URL (디버깅·폴백 용) */
  originalImageUrl: string | null;
};

function getMeta($: cheerio.CheerioAPI, names: string[]): string | null {
  for (const name of names) {
    const v =
      $(`meta[property="${name}"]`).attr('content') ??
      $(`meta[name="${name}"]`).attr('content');
    if (v && v.trim().length > 0) return v.trim();
  }
  return null;
}

/** og:image 등에서 받은 src를 절대 URL로 변환 */
function resolveAbsoluteUrl(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

/** 원본 이미지 다운로드 → Supabase Storage에 저장 → public URL 반환 */
async function uploadImageToStorage(
  imageUrl: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { headers: FETCH_HEADERS });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 너무 큰 이미지(10MB 초과)는 무시 — fallback to 외부 URL
    if (buffer.byteLength > 10 * 1024 * 1024) return null;

    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    const path = `${STORAGE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey);
    const { error: upErr } = await adminClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType, cacheControl: '604800', upsert: false });
    if (upErr) {
      console.warn('[fetch-og] storage upload failed:', upErr.message);
      return null;
    }

    const { data: urlData } = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[fetch-og] image upload error:', err);
    return null;
  }
}

export async function POST(req: Request) {
  // 1. 인증: Authorization Bearer 토큰을 Supabase로 검증 + 화이트리스트
  const authHeader = req.headers.get('authorization') || '';
  const accessToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  if (!accessToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  const verifyClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userErr } = await verifyClient.auth.getUser(accessToken);
  if (userErr || !userData?.user || !isAllowedAdmin(userData.user.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // 2. 입력 파싱
  let body: FetchOgPayload;
  try {
    body = (await req.json()) as FetchOgPayload;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const targetUrl = typeof body.url === 'string' ? body.url.trim() : '';
  if (!/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // 3. 원문 페이지 fetch
  let html: string;
  try {
    const res = await fetch(targetUrl, {
      headers: FETCH_HEADERS,
      redirect: 'follow',
      // 일부 사이트는 cache 헤더에 민감
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `fetch failed: ${res.status}` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `fetch error: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 502 },
    );
  }

  // 4. 메타 추출
  const $ = cheerio.load(html);
  const title =
    getMeta($, ['og:title', 'twitter:title']) ||
    $('title').first().text().trim() ||
    null;
  const description = getMeta($, [
    'og:description',
    'twitter:description',
    'description',
  ]);
  const source =
    getMeta($, ['og:site_name', 'application-name', 'twitter:site']) || null;
  const rawImage = getMeta($, ['og:image', 'og:image:url', 'twitter:image']);
  const originalImageUrl = rawImage ? resolveAbsoluteUrl(rawImage, targetUrl) : null;

  // 5. 이미지가 있으면 Supabase Storage에 백업 (외부 도메인 핫링크 의존 제거)
  let thumbnailUrl: string | null = null;
  if (originalImageUrl) {
    thumbnailUrl = await uploadImageToStorage(
      originalImageUrl,
      supabaseUrl,
      serviceRoleKey,
    );
    // Storage 업로드 실패 시 외부 URL을 fallback (next.config remotePatterns에 따라 막힐 수 있음)
    if (!thumbnailUrl) thumbnailUrl = originalImageUrl;
  }

  const payload: FetchOgResponse = {
    title,
    description,
    source,
    thumbnailUrl,
    originalImageUrl,
  };
  return NextResponse.json(payload);
}
