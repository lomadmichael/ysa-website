/**
 * 2026 양양 서핑캠프 — 대기 → 확정 승급 안내 문자.
 *
 * 관리자 화면으로 취소하면 승급 문자가 자동으로 나가지만,
 * DB(RPC)에서 직접 취소하면 승급만 일어나고 문자는 나가지 않는다.
 * 그때 승급자에게 수동으로 알리기 위한 스크립트다.
 *
 * 승급자는 "내가 확정됐는지" 알 방법이 없으므로 이 문자가 빠지면 안 된다.
 *
 * 사용법 (ysa-website 디렉터리에서):
 *   node scripts/surfcamp-send-promotion-sms.mjs --to 01012345678 --count 2            # 드라이런
 *   node scripts/surfcamp-send-promotion-sms.mjs --to 01012345678 --count 2 --send     # 발송
 *
 * --count 는 확정된 인원 수(해당 프로그램 기준). 생략하면 문구에서 인원을 뺀다.
 * --program lesson|special (기본 lesson)
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
const val = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const to = val('--to')?.replace(/\D/g, '');
const count = val('--count');
const program = val('--program') ?? 'lesson';
const doSend = args.includes('--send');
if (!to) throw new Error('사용법: --to 01012345678 [--count 2] [--program lesson|special] [--send]');

const PROGRAM_LABEL = { lesson: '서핑강습', special: '서핑 특화 체험' };
const SCHEDULE = {
  lesson: '9월 19일(토), 신청하신 시간대로 진행됩니다.',
  special: '9월 19일(토)~20일(일)\n  장소 : 웨이브웍스 (양양군 현남면 인구중앙길 110)',
};

// 이름 조회
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/surfcamp_admin_list`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_include_cancelled: true }),
});
if (!res.ok) throw new Error(`조회 실패: ${res.status} ${await res.text()}`);
const rows = (await res.json()) ?? [];
const hit = rows.find((r) => String(r.phone || '').replace(/\D/g, '') === to);
if (!hit) throw new Error(`해당 번호의 신청 내역을 찾을 수 없습니다: ${to}`);

const who = count ? `${PROGRAM_LABEL[program]} ${count}명` : PROGRAM_LABEL[program];

const text = `[양양군체육회] 2026 양양 서핑캠프
${hit.rep_name}님, 대기 중이던 신청이 확정되었습니다.

· ${who} — 확정
  ${SCHEDULE[program]}

기다려 주셔서 감사합니다.
참여가 어려우시면 다른 분을 위해 이 번호로 "취소" 문자를 보내 주세요.

문의 010-9542-3775
[로마드협동조합] 양양군체육회 알림 운영 대행`;

console.log(`대상 : ${hit.rep_name} / ${to} (${PROGRAM_LABEL[program]} ${count ?? '-'}명)`);
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
