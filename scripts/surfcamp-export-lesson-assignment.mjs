/**
 * 2026 양양 서핑캠프 — 서핑강습 배정 작업용 데이터 추출.
 *
 * 관리자 CSV 는 "접수 명단"이라 접수 순서대로 나온다. 배정은 다른 축으로 봐야 한다:
 * 시간대 → 권역 → 팀(신청서) 순으로 묶고, 같은 팀은 반드시 붙여 놓는다.
 * 가족은 쪼갤 수 없으므로 배정의 최소 단위는 사람이 아니라 팀이다.
 *
 * 이 스크립트는 JSON 만 뱉는다. 엑셀 조립은 파이썬(openpyxl)이 맡는다.
 *
 * 사용법: node scripts/surfcamp-export-lesson-assignment.mjs > out.json
 */

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
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/surfcamp_admin_list`, {
  method: 'POST',
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_include_cancelled: false }),
});
if (!res.ok) throw new Error(`조회 실패: ${res.status} ${await res.text()}`);
const rows = (await res.json()) ?? [];

const REGION = {
  ganghyeon: '강현면', yangyang: '양양읍', sonyang: '손양면',
  hyeonbuk: '현북면', hyeonnam: '현남면',
};
const TIME = { '13:00': '13:00', '15:00': '15:00', any: '시간무관' };
const EXP = { none: '처음', '1-3': '1-3회', '4+': '4회 이상' };
const GENDER = { M: '남', F: '여' };

/**
 * 배정 시간은 signup.slot 을 쓴다.
 *
 * slot 은 신청 시 registration.lesson_time 의 사본으로 들어가지만, 운영진이
 * 참가자 단위로 바꿀 수 있다("3명 중 아이만 15시로" 같은 개별 요청).
 * 희망시간(lesson_time)으로 묶으면 그런 요청이 배정표에서 사라져 놓치게 된다.
 *
 * 그래서 한 신청서라도 slot 이 갈리면 팀을 쪼개 각 시간대 시트에 넣고,
 * 양쪽에 "가족 분리" 표시를 남겨 배정 담당자가 짝을 잃지 않게 한다.
 */
const teams = [];
for (const r of rows) {
  if (r.status !== 'active') continue;
  // 서핑강습 '확정'만. 대기는 배정 대상이 아니다(취소 발생 시 승급된 뒤 합류).
  const members = (r.participants ?? []).filter((p) => p.lesson === 'confirmed');
  if (members.length === 0) continue;

  const bySlot = new Map();
  for (const p of members) {
    const slot = p.lesson_slot ?? r.lesson_time;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(p);
  }
  const splitAcrossSlots = bySlot.size > 1;

  for (const [slot, group] of bySlot) {
    const moved = slot !== r.lesson_time;
    const others = members.length - group.length;
    const marks = [];
    if (moved) marks.push(`시간조정 ${TIME[r.lesson_time] ?? r.lesson_time} → ${TIME[slot] ?? slot}`);
    if (splitAcrossSlots) marks.push(`가족 분리 — 나머지 ${others}명은 다른 시간대`);

    teams.push({
      time: TIME[slot] ?? slot,
      timeKey: slot,
      wishTime: TIME[r.lesson_time] ?? r.lesson_time,
      moved,
      split: splitAcrossSlots,
      adjust: marks.join(' / '),
      region: REGION[r.region] ?? r.region,
      rep: r.rep_name,
      phone: r.phone,
      note: r.staff_note ?? '',
      size: group.length,
      members: group.map((p) => ({
        name: p.name,
        gender: GENDER[p.gender] ?? p.gender,
        age: p.age,
        height: p.height_cm,
        weight: p.weight_kg,
        exp: EXP[p.surf_exp] ?? p.surf_exp,
        // 만 10세는 저연령 강습이 가능한 스쿨로만 배정할 수 있다.
        youth: p.age < 11,
        special: p.special === 'confirmed',
      })),
    });
  }
}

// 시간 → 권역 → 팀 큰 순 → 대표자 순. 큰 팀을 먼저 놓아야 배정하기 쉽다.
const timeOrder = { '13:00': 0, '15:00': 1, any: 2 };
teams.sort(
  (a, b) =>
    (timeOrder[a.timeKey] ?? 9) - (timeOrder[b.timeKey] ?? 9) ||
    a.region.localeCompare(b.region, 'ko') ||
    b.size - a.size ||
    a.rep.localeCompare(b.rep, 'ko'),
);

process.stdout.write(JSON.stringify(teams));
