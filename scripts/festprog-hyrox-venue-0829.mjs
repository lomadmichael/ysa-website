/**
 * 해변 하이록스 — 장소 재안내 문자 (2026-08-29 오후, 형님 지시)
 *
 * 배경: 오전 안내는 "부스존 우측"으로 나갔고, 자동 승급 문자는 코드에 박힌
 *   "해양종합레포츠센터 앞 프로그램 부스"로 나가 표기가 갈렸다.
 *   현장 위치가 원래 자리(하이록스 체험존)로 정리되어 확정자 전원에게 다시 보낸다.
 *
 * 대상: festprog hyrox 확정(confirmed) 전원
 *
 * 사용법 (ysa-website 디렉터리에서):
 *   node scripts/festprog-hyrox-venue-0829.mjs          # 드라이런
 *   node scripts/festprog-hyrox-venue-0829.mjs --send   # 실제 발송
 */

import { createClient } from '@supabase/supabase-js';
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
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const env = loadEnv();

const text = (name) => `[양양군서핑협회] 해변 하이록스 장소 안내

${name}님, 오늘 오후 3시 해변 하이록스 장소를 다시 안내드립니다.

▶ 장소 : 페스티벌 무대 왼쪽(해변을 바라보고) 하이록스 체험존
▶ 시간 : 오후 3시 시작

다른 곳으로 오실 필요 없이 하이록스 체험존으로 바로 와 주시면 됩니다.
시작 15분 전인 2시 45분까지 도착해 주세요.

[양양군 서핑협회 알림 대행사 : 로마드 협동조합]`;

const digits = (p) => (p || '').replace(/[^0-9]/g, '');
const mask = (p) => digits(p).replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-****-$3');

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await supabase.rpc('festprog_admin_list', { p_include_cancelled: false });
if (error) throw new Error(`명단 조회 실패: ${error.message}`);

const targets = (data ?? [])
  .filter((r) => r.program === 'hyrox' && r.status === 'confirmed')
  .map((r) => ({ name: (r.name || '').trim(), phone: digits(r.phone) }))
  .filter((r) => r.phone);

const uniq = new Map();
for (const t of targets) if (!uniq.has(t.phone)) uniq.set(t.phone, t);
const list = [...uniq.values()];

console.log(`대상: 하이록스 확정 ${list.length}명 (중복 번호 ${targets.length - list.length}건 접음)`);
console.log(`\n--- 문안 (${Buffer.byteLength(text('홍길동'), 'utf8')} bytes) ---\n${text('홍길동')}\n`);

function authHeader() {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', env.SOLAPI_API_SECRET).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

if (!process.argv.includes('--send')) {
  console.log('🟡 DRY-RUN — 실제 발송: --send');
  for (const t of list) console.log(`   ${t.name} ${mask(t.phone)}`);
} else {
  const from = digits(env.SOLAPI_SENDER);
  const messages = list.map((t) => ({ to: t.phone, from, text: text(t.name) }));
  const res = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({ messages }),
  });
  const json = await res.json().catch(() => ({}));
  const g = json?.groupInfo ?? {};
  const c = g.count ?? {};
  console.log(`🔵 발송 HTTP ${res.status} · group=${g.groupId ?? '-'} ` +
    `등록성공=${c.registeredSuccess ?? '-'} 실패=${c.registeredFailed ?? '-'}`);
  if (Array.isArray(json?.failedMessageList)) {
    for (const f of json.failedMessageList) console.log(`   ✘ ${mask(f.to)} ${f.statusCode} ${f.statusMessage ?? ''}`);
  }
}
