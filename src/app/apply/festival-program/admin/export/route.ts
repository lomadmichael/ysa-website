import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminList } from '@/lib/festprog-db';
import { genderLabel, programLabel, statusLabel } from '@/lib/festprog-config';
import { formatPhone } from '@/lib/festprog-validate';
import { ADMIN_COOKIE, verifyAdmin } from '../auth';

export const dynamic = 'force-dynamic';

/**
 * 현장 운영용 명단 CSV.
 * 신청 1건 = 참가자 1명이므로 행 구조가 그대로 1:1 이다.
 */

const HEADER = [
  '접수일시',
  '프로그램',
  '상태',
  '대기순번',
  '성명',
  '성별',
  '연락처',
  '취소일시',
  '취소주체',
  '취소사유',
  // ★ 운영메모는 내부 전용이다. 명단을 외부에 공유할 때는 이 열을 지우고 보낼 것.
  '운영메모',
];

/** 엑셀이 CSV 를 UTF-8 로 인식하게 하는 선두 바이트 순서 표식(U+FEFF). */
const BOM = String.fromCharCode(0xfeff);

/** RFC 4180: 값 전체를 큰따옴표로 감싸고 내부 큰따옴표는 두 번 반복. */
function esc(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** ISO(UTC) → 한국시간 'YYYY-MM-DD HH:mm' */
function kstDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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
    console.error('[festprog] CSV 내려받기 실패:', e);
    return new Response('명단을 불러오지 못했습니다.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const lines = [HEADER.map(esc).join(',')];
  for (const r of rows) {
    lines.push(
      [
        esc(kstDateTime(r.created_at)),
        esc(programLabel(r.program)),
        esc(statusLabel(r.status)),
        esc(r.status === 'waitlist' && typeof r.wait_ahead === 'number' ? r.wait_ahead + 1 : ''),
        esc(r.name),
        esc(genderLabel(r.gender)),
        // 엑셀이 숫자로 읽어 앞자리 0 을 날리지 않도록 하이픈을 넣어 문자열로 만든다.
        esc(formatPhone(r.phone)),
        esc(kstDateTime(r.cancelled_at)),
        esc(r.cancelled_by === 'admin' ? '관리자' : r.cancelled_by === 'self' ? '본인' : ''),
        esc(r.cancel_reason ?? ''),
        esc(r.staff_note ?? ''),
      ].join(','),
    );
  }

  // BOM(U+FEFF): 엑셀에서 UTF-8 한글이 깨지지 않도록. 줄바꿈은 CRLF.
  const csv = BOM + lines.join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="festival-program-2026.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
