/**
 * 2026 양양서핑페스티벌 현장 프로그램 — 해변 바레 · 하이록스 참가 안내 문자 (8/28 밤 발송)
 *
 * 대상: festprog 확정(confirmed) 신청자. 프로그램별로 문안이 다르다.
 *   · 해변 바레   13:00 · 메인 무대 앞 · 준비물 편한 복장 · 12:45까지 도착
 *   · 해변 하이록스 15:00 · 부스존 우측(무대를 바라보고 오른쪽) · 14:45까지 도착
 *
 * ★ 취소는 참가자가 직접 /apply/festival-program/my 에서 한다(휴대폰 OTP).
 *   그 페이지는 "수정"이 없고 취소만 되므로 문구도 취소로 적는다.
 *
 * ⚠️ .env.local 의 SOLAPI_TEST_MODE 는 이 스크립트에서 쓰지 않는다.
 *    실발송은 오직 --send 플래그로만 일어난다.
 * ⚠️ 실발송 후 재실행 금지 (중복 발송).
 *
 * 사용법 (ysa-website 디렉터리에서):
 *   node scripts/festprog-send-guide-0829.mjs                     # 드라이런 (대상·문안 미리보기)
 *   node scripts/festprog-send-guide-0829.mjs --sample 01012345678 # 샘플 2건(바레·하이록스)을 지정 번호로
 *   node scripts/festprog-send-guide-0829.mjs --send              # 전체 즉시 발송
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
    // 값 끝 개행/공백이 남으면 HMAC 헤더가 깨져 전건 400 (SOLAPI 사고 교훈)
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}
const env = loadEnv();

const MY_URL = 'https://ysakorea.com/apply/festival-program/my';
const SIGN = '[양양군 서핑협회 알림 대행사 : 로마드 협동조합]';

const CANCEL_BLOCK = `■ 참여가 어려우신 경우
아래 링크에서 직접 취소하실 수 있습니다.
${MY_URL}
신청하신 휴대폰 번호를 입력하면 인증번호가 발송되고, 본인 확인 후 취소하실 수 있습니다.
대기하시는 분께 자리를 드릴 수 있으니 미리 알려주시면 감사하겠습니다.`;

const TEXT = {
  barre: (name) => `[2026 양양서핑페스티벌] 해변 바레 안내

${name}님, 신청하신 해변 바레 안내드립니다.

▶ 일시 : 8/29(토) 오후 1시
▶ 장소 : 죽도해변 페스티벌 부스존, 메인 무대 앞
▶ 준비물 : 편한 복장

원활한 진행을 위해 시작 15분 전인 12시 45분까지 메인 무대 앞으로 와 주세요.

${CANCEL_BLOCK}

${SIGN}`,
  hyrox: (name) => `[2026 양양서핑페스티벌] 해변 하이록스 안내

${name}님, 신청하신 해변 하이록스 안내드립니다.

▶ 일시 : 8/29(토) 오후 3시
▶ 장소 : 죽도해변 페스티벌 부스존 우측 (메인 무대를 바라보고 오른쪽)

원활한 진행을 위해 시작 15분 전인 2시 45분까지 해당 장소로 와 주세요.

${CANCEL_BLOCK}

${SIGN}`,
};
const LABEL = { barre: '해변 바레', hyrox: '해변 하이록스' };

const digits = (p) => (p || '').replace(/[^0-9]/g, '');
const mask = (p) => digits(p).replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-****-$3');
const bytes = (s) => Buffer.byteLength(s, 'utf8');

// ── 대상 조회 ────────────────────────────────────────────────────────────────
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: rows, error } = await supabase.rpc('festprog_admin_list', {
  p_include_cancelled: false,
});
if (error) throw new Error(`명단 조회 실패: ${error.message}`);

const targets = (rows ?? [])
  .filter((r) => r.status === 'confirmed' && (r.program === 'barre' || r.program === 'hyrox'))
  .map((r) => ({ name: (r.name || '').trim(), phone: digits(r.phone), program: r.program }))
  .filter((r) => r.phone);

// 동일 번호 2건 이상이면 SOLAPI 가 1건만 보낸다(1026) → 번호 중복을 먼저 잡는다
const byPhone = new Map();
for (const t of targets) {
  const cur = byPhone.get(t.phone);
  if (cur) cur.push(t);
  else byPhone.set(t.phone, [t]);
}
const dups = [...byPhone.entries()].filter(([, v]) => v.length > 1);

const counts = targets.reduce((a, t) => ((a[t.program] = (a[t.program] || 0) + 1), a), {});
console.log('=== 대상 (festprog confirmed) ===');
for (const k of ['barre', 'hyrox']) console.log(`  ${LABEL[k]} : ${counts[k] || 0}명`);
console.log(`  합계 : ${targets.length}명`);
if (dups.length) {
  console.log('\n⚠️ 동일 번호 중복 — 배치를 나눠야 한다:');
  for (const [p, v] of dups) console.log(`   ${mask(p)} → ${v.map((x) => LABEL[x.program]).join(', ')}`);
} else {
  console.log('  중복 번호 없음 ✔');
}

console.log('\n=== 문안 미리보기 ===');
for (const k of ['barre', 'hyrox']) {
  const s = TEXT[k]('홍길동');
  console.log(`\n--- ${LABEL[k]} (${bytes(s)} bytes · ${s.length}자) ---\n${s}`);
}

// ── 발송 ─────────────────────────────────────────────────────────────────────
function authHeader() {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', env.SOLAPI_API_SECRET).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function sendMany(messages) {
  const res = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({ messages }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

const from = digits(env.SOLAPI_SENDER);
const argv = process.argv.slice(2);
const sampleIdx = argv.indexOf('--sample');

if (sampleIdx >= 0) {
  const to = digits(argv[sampleIdx + 1] || '');
  if (!to) throw new Error('--sample <번호> 가 필요합니다');
  // 같은 번호로 2건이면 1건만 나가므로 순차로 보낸다
  for (const k of ['barre', 'hyrox']) {
    const r = await sendMany([{ to, from, text: TEXT[k]('홍길동') }]);
    console.log(`\n샘플 ${LABEL[k]} → ${mask(to)} :`, r.status, JSON.stringify(r.json).slice(0, 200));
  }
} else if (argv.includes('--send')) {
  console.log('\n🔵 실발송 시작…');
  let sent = 0;
  const fails = [];
  // 프로그램별로 나눠 보낸다 (문안이 다르고, 중복 번호가 있어도 배치가 갈린다)
  for (const k of ['barre', 'hyrox']) {
    const list = targets.filter((t) => t.program === k);
    if (!list.length) continue;
    const messages = list.map((t) => ({ to: t.phone, from, text: TEXT[k](t.name) }));
    const r = await sendMany(messages);
    const g = r.json?.groupInfo ?? {};
    const c = g.count ?? {};
    console.log(`  ${LABEL[k]} ${list.length}건 → HTTP ${r.status} · group=${g.groupId ?? '-'} ` +
      `등록성공=${c.registeredSuccess ?? '-'} 실패=${c.registeredFailed ?? '-'}`);
    if (!r.ok) fails.push({ program: k, status: r.status, body: JSON.stringify(r.json).slice(0, 300) });
    else sent += list.length;
    if (Array.isArray(r.json?.failedMessageList) && r.json.failedMessageList.length) {
      for (const f of r.json.failedMessageList) {
        console.log(`     ✘ ${mask(f.to)} ${f.statusCode} ${f.statusMessage ?? ''}`);
      }
    }
  }
  console.log(`\n발송 접수 완료: ${sent}건` + (fails.length ? ` · 실패 배치 ${fails.length}` : ''));
  for (const f of fails) console.log('  실패:', f.program, f.status, f.body);
} else {
  console.log('\n🟡 DRY-RUN — 실행: --sample <번호> / --send');
}
