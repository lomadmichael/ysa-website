import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminList } from '@/lib/surfcamp-db';
import {
  genderLabel,
  lessonTimeLabel,
  regionLabel,
  residentTypeLabel,
  statusLabel,
  surfExpLabel,
} from '@/lib/surfcamp-config';
import { ADMIN_COOKIE, verifyAdmin } from '../auth';

export const dynamic = 'force-dynamic';

/**
 * 배정용 명단 CSV.
 *
 * ★ 신청서 1건이 아니라 "참가자 1명"이 1행이다.
 *   현장 운영진은 신청서 목록이 아니라 보드·슈트 배정에 쓸 개인 단위 명단이 필요하다.
 *   같은 신청서의 참가자들은 대표자·연락처 등 신청 단위 값이 반복 출력된다.
 */

const HEADER = [
  '접수일시',
  '신청상태',
  '대표자',
  '연락처',
  '주소',
  '상세주소',
  '참가자구분',
  '희망권역',
  '희망시간',
  '참가자명',
  '성별',
  '나이',
  '신장(cm)',
  '몸무게(kg)',
  '서핑경험',
  '서핑강습',
  '특화체험',
  '초상권동의',
  '비고',
];

/** 엑셀이 CSV 를 UTF-8 로 인식하게 하는 선두 바이트 순서 표식(U+FEFF). */
const BOM = String.fromCharCode(0xfeff);

/** RFC 4180: 값 전체를 큰따옴표로 감싸고 내부 큰따옴표는 두 번 반복. */
function esc(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** ISO(UTC) → 한국시간 'YYYY-MM-DD HH:mm' */
function kstDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const at = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${at('year')}-${at('month')}-${at('day')} ${at('hour')}:${at('minute')}`;
}

/** 엑셀이 숫자로 읽어 앞자리 0 을 날리지 않도록 하이픈을 넣어 문자열로 만든다. */
function formatPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw ?? '';
}

export async function GET(request: NextRequest) {
  const store = await cookies();
  if (!verifyAdmin(store.get(ADMIN_COOKIE)?.value)) {
    return new Response('unauthorized', { status: 401 });
  }

  const includeCancelled = request.nextUrl.searchParams.get('cancelled') === '1';

  let rows;
  try {
    rows = await adminList(includeCancelled);
  } catch (e) {
    console.error('[surfcamp] CSV 내려받기 실패:', e);
    return new Response('명단을 불러오지 못했습니다.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = [HEADER.map(esc).join(',')];
  for (const r of rows) {
    const common = [
      esc(kstDateTime(r.created_at)),
      esc(r.status === 'cancelled' ? '취소' : '신청'),
      esc(r.rep_name),
      esc(formatPhone(r.phone)),
      esc(r.address),
      esc(r.address_detail ?? ''),
      esc(residentTypeLabel(r.resident_type)),
      esc(regionLabel(r.region)),
      esc(lessonTimeLabel(r.lesson_time)),
    ];
    for (const p of r.participants) {
      lines.push(
        [
          ...common,
          esc(p.name),
          esc(genderLabel(p.gender)),
          esc(p.age),
          esc(p.height_cm),
          esc(p.weight_kg),
          esc(surfExpLabel(p.surf_exp)),
          esc(p.lesson ? statusLabel(p.lesson) : '미신청'),
          esc(p.special ? statusLabel(p.special) : '미신청'),
          esc(r.consent_media ? '동의' : '미동의'),
          esc(r.note ?? ''),
        ].join(','),
      );
    }
  }

  // BOM(U+FEFF): 엑셀에서 UTF-8 한글이 깨지지 않도록. 줄바꿈은 CRLF.
  const csv = BOM + lines.join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="surfcamp-2026-registrations.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
