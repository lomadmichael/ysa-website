/**
 * 2026 양양 서핑캠프 — 일정 변경(9/12~13 → 9/19~20) 안내 문자 일괄 발송.
 *
 * 일회성 운영 스크립트다. 앱 코드가 아니라 손으로 돌리는 도구이므로
 * 안전장치를 코드가 아니라 실행 방식에 둔다:
 *
 *   1) 기본은 드라이런이다. 실제 발송은 --send 를 명시해야만 일어난다.
 *   2) --to 로 특정 번호에만 보내 테스트한 뒤 전체 발송한다.
 *   3) 이미 보낸 번호는 sent-log 파일에 남겨 재실행 시 건너뛴다.
 *      (중간에 끊겨도 중복 발송이 나지 않게 — 문자는 되돌릴 수 없다)
 *
 * 사용법 (ysa-website 디렉터리에서):
 *   node scripts/surfcamp-notify-date-change.mjs                 # 드라이런, 대상 목록만 출력
 *   node scripts/surfcamp-notify-date-change.mjs --to 01012345678 --send   # 1건 테스트 발송
 *   node scripts/surfcamp-notify-date-change.mjs --send          # 전체 발송
 */

import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SENT_LOG = resolve(ROOT, 'scripts', '.surfcamp-datechange-sent.log');

// ── .env.local 로드 (dotenv 의존성 없이) ──────────────────────────────────────
function loadEnv() {
  const p = resolve(ROOT, '.env.local');
  if (!existsSync(p)) throw new Error('.env.local 이 없습니다');
  const env = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    // ★ 반드시 trim. 값 끝 줄바꿈이 남으면 HMAC 이 깨져 전건 400 이 난다.
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = env.SOLAPI_API_KEY;
const API_SECRET = env.SOLAPI_API_SECRET;
const SENDER = (env.SOLAPI_SENDER || '').replace(/[-\s]/g, '');

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_KEY, API_KEY, API_SECRET, SENDER })) {
  if (!v) throw new Error(`환경변수 누락: ${k}`);
}

// ── 문안 ─────────────────────────────────────────────────────────────────────
const body = (name) => `[양양군체육회] 2026 양양 서핑캠프 일정 변경 안내

${name}님, 신청해 주셔서 감사합니다.
운영 사정으로 아래와 같이 변경되었습니다.

▶ 행사일
변경 전 : 9월 12일(토)~13일(일)
변경 후 : 9월 19일(토)~20일(일)

▶ 운영 방식
당초 3기수로 나누어 운영할 예정이었으나
단일 기수로 통합 운영합니다.
추가 기수는 운영하지 않으니 이 점 양해 부탁드립니다.

· 서핑강습 : 9월 19일(토), 신청하신 시간대 그대로 진행
· 서핑 특화 체험 : 9월 19일(토)~20일(일)
  장소 : 웨이브웍스 (양양군 현남면 인구중앙길 110)

신청 내용은 그대로 유지되며 재신청하실 필요는 없습니다.

▷ 취소를 원하시면
이 번호(010-9542-3775)로 "취소" 문자만 보내 주세요.
확인 후 저희가 취소 처리해 드립니다.

▷ 참가 인원·희망 권역·시간 변경은
아래에서 휴대폰 인증 후 직접 수정하실 수 있습니다.
https://ysakorea.com/apply/surf-camp/my

불편을 드려 죄송합니다.
[로마드협동조합] 양양군체육회 알림 운영 대행`;

// ── 대상 조회 ────────────────────────────────────────────────────────────────
async function fetchTargets() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/surfcamp_admin_list`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_include_cancelled: false }),
  });
  if (!res.ok) throw new Error(`대상 조회 실패: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) ?? [];
  // 활성 신청만. 같은 번호가 두 건일 수 없도록 dedupe (중복 발송 방지)
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (r.status !== 'active') continue;
    const phone = String(r.phone || '').replace(/\D/g, '');
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    out.push({ phone, name: r.rep_name, created_at: r.created_at });
  }
  return out;
}

/**
 * 홈페이지가 새 일자(9/19~20)로 바뀐 시점.
 * 이 시각 이후 신청자는 처음부터 새 일자를 보고 신청했으므로 변경 안내 대상이 아니다.
 * (운영 배포 ready 시각 — vercel inspect 로 확인)
 */
const DEPLOY_CUTOFF = '2026-08-10T01:10:30Z';

// ── SOLAPI 발송 ──────────────────────────────────────────────────────────────
async function sendOne(to, text) {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', API_SECRET).update(date + salt).digest('hex');

  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to, from: SENDER, text } }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── 실행 ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const doSend = args.includes('--send');
const onlyIdx = args.indexOf('--to');
const only = onlyIdx >= 0 ? args[onlyIdx + 1]?.replace(/\D/g, '') : null;

// 신청자 목록에 없는 번호(운영진 등)로 1건만 미리 보내 문안·수신을 확인한다.
// 발송 로그를 남기지 않으므로 본 발송 대상에 영향이 없다.
const testIdx = args.indexOf('--test-to');
if (testIdx >= 0) {
  const to = args[testIdx + 1]?.replace(/\D/g, '');
  if (!to) throw new Error('--test-to 뒤에 번호를 적어 주세요');
  const text = body('홍길동');
  console.log(`테스트 발송 → ${to} (${text.length}자)`);
  if (!doSend) {
    console.log('드라이런입니다. 실제로 보내려면 --send 를 함께 붙이세요.');
    process.exit(0);
  }
  const r = await sendOne(to, text);
  console.log(r.ok ? '테스트 발송 성공' : '테스트 발송 실패', r.status, JSON.stringify(r.data));
  process.exit(r.ok ? 0 : 1);
}

const alreadySent = new Set(
  existsSync(SENT_LOG)
    ? readFileSync(SENT_LOG, 'utf8').split(/\r?\n/).map((l) => l.split('\t')[0]).filter(Boolean)
    : [],
);

const all = await fetchTargets();
const cutoffMs = Date.parse(DEPLOY_CUTOFF);
const afterCutoff = all.filter((t) => Date.parse(t.created_at) >= cutoffMs);
let targets = all.filter((t) => Date.parse(t.created_at) < cutoffMs);
console.log(
  `전체 활성 ${all.length}건 중 배포(${DEPLOY_CUTOFF}) 이후 신청 ${afterCutoff.length}건은 제외 — 이미 새 일자를 보고 신청했습니다.`,
);
for (const t of afterCutoff) console.log(`  제외: ${t.name} ${t.phone} (${t.created_at})`);
if (only) targets = targets.filter((t) => t.phone === only);
const skipped = targets.filter((t) => alreadySent.has(t.phone));
targets = targets.filter((t) => !alreadySent.has(t.phone));

console.log(`대상 ${targets.length}건 (이미 발송해 건너뜀 ${skipped.length}건)`);
console.log(`문안 길이: ${body('홍길동').length}자 → LMS`);

if (!doSend) {
  console.log('\n--- 드라이런입니다. 실제 발송하려면 --send 를 붙이세요. ---');
  for (const t of targets.slice(0, 5)) console.log(`  ${t.name} / ${t.phone}`);
  if (targets.length > 5) console.log(`  ... 외 ${targets.length - 5}건`);
  process.exit(0);
}

let ok = 0;
const fails = [];
for (const t of targets) {
  const r = await sendOne(t.phone, body(t.name));
  if (r.ok) {
    ok += 1;
    appendFileSync(SENT_LOG, `${t.phone}\t${t.name}\t${new Date().toISOString()}\n`, 'utf8');
  } else {
    fails.push({ ...t, status: r.status, data: r.data });
    console.error(`  실패 ${t.name} ${t.phone}:`, r.status, JSON.stringify(r.data));
  }
  await new Promise((r) => setTimeout(r, 250)); // 초당 4건 — SOLAPI 부하 회피
}

console.log(`\n발송 완료 — 성공 ${ok}건 / 실패 ${fails.length}건`);
if (fails.length) console.log('실패 목록:', fails.map((f) => `${f.name}(${f.phone})`).join(', '));
