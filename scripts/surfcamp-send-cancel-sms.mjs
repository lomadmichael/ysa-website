/**
 * 2026 양양 서핑캠프 — 취소 확인 문자 1건 발송.
 *
 * 본인이 문자로 취소를 요청한 건에 쓴다.
 *
 * ★ 문구에 취소 "사유"를 넣지 않는다.
 *   DB 에는 집계를 위해 사유(예: 일정 변경)를 남기지만, 그 문구가 그대로 문자로
 *   나가면 "행사 일정이 바뀌어서 운영측이 나를 잘랐다"로 읽힌다.
 *   반대로 "본인 요청"이라고 못박으면, 본인이 요청하지 않은 취소에서 반발을 산다.
 *   그래서 문자에는 사유를 빼고 "요청하신 대로" 로만 알린다.
 *
 * 사용법 (ysa-website 디렉터리에서):
 *   node scripts/surfcamp-send-cancel-sms.mjs --to 01012345678          # 드라이런
 *   node scripts/surfcamp-send-cancel-sms.mjs --to 01012345678 --send   # 실제 발송
 */

import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const p = resolve(ROOT, '.env.local');
  if (!existsSync(p)) throw new Error('.env.local 이 없습니다');
  const env = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim(); // trim 필수(HMAC 깨짐 방지)
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = env.SOLAPI_API_KEY;
const API_SECRET = env.SOLAPI_API_SECRET;
const SENDER = (env.SOLAPI_SENDER || '').replace(/[-\s]/g, '');

const args = process.argv.slice(2);
const toIdx = args.indexOf('--to');
const to = toIdx >= 0 ? args[toIdx + 1]?.replace(/\D/g, '') : null;
const doSend = args.includes('--send');
if (!to) throw new Error('사용법: --to 01012345678 [--send]');

// 이름 조회 — 취소된 건까지 포함해서 찾는다(이미 취소 처리한 뒤 보내는 경우가 많다)
const res = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/surfcamp_admin_list`,
  {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_include_cancelled: true }),
  },
);
if (!res.ok) throw new Error(`조회 실패: ${res.status} ${await res.text()}`);
const rows = (await res.json()) ?? [];
const hit = rows.find((r) => String(r.phone || '').replace(/\D/g, '') === to);
if (!hit) throw new Error(`해당 번호의 신청 내역을 찾을 수 없습니다: ${to}`);

const text = `[양양군체육회] 2026 양양 서핑캠프
${hit.rep_name}님, 요청하신 대로 신청을 취소 처리했습니다.

재신청은 접수 기간 중 언제든 가능합니다.
문의 010-9542-3775
[로마드협동조합] 양양군체육회 알림 운영 대행`;

console.log(`대상 : ${hit.rep_name} / ${to} (현재 상태: ${hit.status})`);
console.log(`문안 ${text.length}자\n${'-'.repeat(40)}\n${text}\n${'-'.repeat(40)}`);

if (!doSend) {
  console.log('드라이런입니다. 실제로 보내려면 --send 를 붙이세요.');
  process.exit(0);
}

const date = new Date().toISOString();
const salt = randomBytes(16).toString('hex');
const signature = createHmac('sha256', API_SECRET).update(date + salt).digest('hex');
const sent = await fetch('https://api.solapi.com/messages/v4/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
  },
  body: JSON.stringify({ message: { to, from: SENDER, text } }),
});
const data = await sent.json().catch(() => ({}));
console.log(sent.ok ? '발송 성공' : '발송 실패', sent.status, JSON.stringify(data));
process.exit(sent.ok ? 0 : 1);
