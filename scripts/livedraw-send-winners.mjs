/**
 * 2026 코리아 오픈 유튜브 라이브 「경품 당첨 안내」 문자
 *
 * /live/draw 에서 추첨한 당첨자 중 **아직 문자를 받지 않은 사람**에게만 보낸다.
 * 발송에 성공하면 livedraw.winners.notified_at 을 찍어 중복 발송을 막는다
 * (그래서 이 스크립트는 여러 번 돌려도 같은 사람에게 두 번 가지 않는다 —
 *  추첨을 나눠서 할 때마다 그냥 다시 실행하면 된다).
 *
 * 경품별 수령 안내는 업체와 협의한 내용을 아래 CLAIM 에 채워야 한다.
 * 【 】 가 남아 있으면 --send 를 거부한다.
 *
 * 사용법:
 *   node scripts/livedraw-send-winners.mjs                        # dry-run (대상·문안 확인)
 *   node scripts/livedraw-send-winners.mjs --sample 01012345678   # 문안 샘플 1건
 *   node scripts/livedraw-send-winners.mjs --send                 # 실제 발송
 */
import { createClient } from '@supabase/supabase-js';
import { createHmac, randomBytes } from 'crypto';
import { readFileSync } from 'fs';

function loadEnv() {
  const env = {};
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  // ⚠️ CRLF 로 저장된 줄이 섞여 있으면 아래 정규식의 (.*)$ 가 \r 때문에 매칭되지 않아
  //    그 줄만 통째로 무시된다 (SOLAPI_SENDER 가 빈 값으로 보이던 원인). 줄바꿈을 먼저 정규화한다.
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    // 값 끝 개행/공백이 남으면 HMAC 헤더가 깨져 전건 400 (SOLAPI 사고 교훈)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes('cpibyzivkhvzusqmznsf')) {
  console.error('⚠️ ysa-website 운영 DB 가 아닙니다 — 중단');
  process.exit(1);
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ───── 경품별 수령 안내 (업체 협의 후 채울 것) ─────
const CLAIM = {
  STAND_MEAL: '【수령 방법 — 예: 방문 시 성함 말씀하시면 확인됩니다 / 유효기간】',
  APEX_POOL: '【수령 방법 — 예: 사전 예약 필요 여부·연락처 / 이용 가능 기간】',
  APEX_MEAL: '【수령 방법 — 예: 방문 시 성함 말씀하시면 확인됩니다 / 유효기간】',
};
/** 경품별 장소 안내 */
const PLACE = {
  STAND_MEAL: '더 스탠드 (하조대해변)',
  APEX_POOL: '양양 에이펙스호텔 (동산해변)',
  APEX_MEAL: '양양 에이펙스호텔 (동산해변)',
};
// ────────────────────────────────────────────────

function buildText({ name, sponsor, prize_title, prize_code }) {
  const place = PLACE[prize_code] ?? sponsor;
  const claim = CLAIM[prize_code] ?? '【수령 방법 미정】';
  return `[대한서핑협회장배 코리아 오픈] 경품 당첨 안내

${name}님, 코리아 오픈 롱보드 유튜브 생중계 경품에 당첨되셨습니다. 축하드립니다.

▶ 경품 : ${prize_title}
▶ 제공 : ${sponsor}
▶ 장소 : ${place}

${claim}

경품을 제공해 주신 ${sponsor}에 감사드립니다.

[양양군 서핑협회 알림 대행사 : 로마드 협동조합]`;
}

const digits = (p) => (p || '').replace(/[^0-9]/g, '');
const mask = (p) => digits(p).replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-****-$3');

function authHeader() {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const sig = createHmac('sha256', env.SOLAPI_API_SECRET).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${sig}`;
}

async function sendMany(messages) {
  const res = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({ messages }),
  });
  const json = await res.json().catch(() => ({}));
  const g = json?.groupInfo ?? {};
  const c = g.count ?? {};
  console.log(
    `🔵 발송 HTTP ${res.status} · group=${g.groupId ?? '-'} ` +
      `등록성공=${c.registeredSuccess ?? '-'} 실패=${c.registeredFailed ?? '-'}`,
  );
  const failed = new Set();
  if (Array.isArray(json?.failedMessageList)) {
    for (const f of json.failedMessageList) {
      console.log(`   ✘ ${mask(f.to)} ${f.statusCode} ${f.statusMessage ?? ''}`);
      failed.add(digits(f.to));
    }
  }
  return { ok: res.ok, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const isSend = args.includes('--send');
  const si = args.indexOf('--sample');
  const samplePhone = si >= 0 ? digits(args[si + 1]) : null;

  const from = digits(env.SOLAPI_SENDER);
  if (!from) {
    console.error('❌ SOLAPI_SENDER 비어 있음 — .env.local 복구 후 재실행');
    process.exit(1);
  }

  const { data, error } = await supabase.rpc('livedraw_pending_notify');
  if (error) throw new Error(`대상 조회 실패: ${error.message}`);
  const targets = (data ?? []).filter((t) => digits(t.phone));

  console.log(`\n=== 경품 당첨 안내 문자 ===`);
  console.log(`미발송 당첨자: ${targets.length}명`);
  if (targets.length === 0) {
    // 추첨 전에도 문안을 검수할 수 있게 예시로 미리보기만 출력하고 발송은 하지 않는다.
    console.log('보낼 대상이 없습니다. (추첨 전이거나 이미 전부 발송됨) — 아래는 문안 예시입니다.');
  }
  const byPrize = {};
  for (const t of targets) byPrize[t.prize_title] = (byPrize[t.prize_title] ?? 0) + 1;
  if (targets.length) console.log('경품별:', JSON.stringify(byPrize));

  const sampleSrc = targets[0] ?? {
    name: '홍길동',
    sponsor: '더 스탠드',
    prize_title: '식사권 3만원',
    prize_code: 'STAND_MEAL',
  };
  const sample = buildText(sampleSrc);
  console.log(`\n--- 문안 미리보기 ---\n${sample}`);
  console.log(`\n글자수 ${sample.length} · UTF-8 ${Buffer.byteLength(sample, 'utf8')} bytes (LMS)`);

  const unconfirmed = targets.some((t) => buildText(t).includes('【')) || sample.includes('【');
  if (unconfirmed) console.log('\n🚫 수령 안내(CLAIM)가 미확정입니다 — 실발송 불가');

  if (samplePhone) {
    console.log(`\n🟠 샘플 1건 → ${mask(samplePhone)}`);
    await sendMany([{ to: samplePhone, from, text: sample }]);
    return;
  }

  if (!isSend) {
    console.log('\n🟡 DRY-RUN — 실행: --sample <번호> / --send');
    return;
  }
  if (unconfirmed) process.exit(1);

  console.log(`\n🔴 발송 ${targets.length}건`);
  const messages = targets.map((t) => ({ to: digits(t.phone), from, text: buildText(t) }));
  const { failed } = await sendMany(messages);

  // 실패한 번호를 뺀 나머지만 발송 완료로 표시 → 실패 건은 다음 실행에서 재시도된다
  const okIds = targets.filter((t) => !failed.has(digits(t.phone))).map((t) => t.entry_id);
  if (okIds.length) {
    const { data: mk, error: mkErr } = await supabase.rpc('livedraw_mark_notified', {
      p_entry_ids: okIds,
    });
    if (mkErr) {
      console.error(`⚠️ 발송 표시 실패: ${mkErr.message}`);
      console.error('   → 재실행하면 중복 발송됩니다. entry_id 목록:', okIds.join(','));
    } else {
      console.log(`✅ 발송 완료 표시 ${mk?.updated ?? 0}건`);
    }
  }
  if (failed.size) console.log(`⚠️ 실패 ${failed.size}건은 표시하지 않았습니다 — 원인 확인 후 재실행`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
