'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import AddressSearch from '@/components/apply/AddressSearch';
import CapacityBadge from '@/components/apply/surf-camp/CapacityBadge';
import OpenCountdown from '@/components/apply/surf-camp/OpenCountdown';
import ParticipantEditor, {
  emptyParticipant,
  serializeParticipants,
  type ClosedProgramReasons,
  type ParticipantRow,
} from '@/components/apply/surf-camp/ParticipantEditor';
import {
  submitSurfCamp,
  type SurfCampFormState,
} from '@/app/apply/surf-camp/actions';
import {
  EVENT,
  INQUIRY_TEL,
  KILL_SWITCH,
  LESSON_MIN_AGE,
  LESSON_MIN_HEIGHT,
  LESSON_TIMES,
  REGIONS,
  RESIDENT_TYPES,
  SMS_SENDER_ORG,
  formatKst,
  lessonTimeLabel,
  programLabel,
  regionLabel,
} from '@/lib/surfcamp-config';
import type {
  ProgramAvailability,
  ProgramOutcome,
  SurfcampAvailability,
} from '@/lib/surfcamp-db';

const initialState: SurfCampFormState = { status: 'idle' };

/**
 * 프로그램별 신규접수 차단 사유.
 *
 * 전체 오픈/마감(availability.open)과는 별개의 축이다. 접수가 열려 있어도
 * 프로그램 단위로는 막혀 있을 수 있다.
 *   closed : 관리자가 그 프로그램의 신규접수를 껐다
 *   full   : 확정+대기 합계가 상한에 도달했다
 * ★ 여기서 막혀도 이미 접수된 대기자의 자동 승급은 그대로 동작한다.
 */
function gateReason(p: ProgramAvailability): 'closed' | 'full' | null {
  if (p.open === false) return 'closed';
  if (p.total_cap != null && (p.total_taken ?? 0) >= p.total_cap) return 'full';
  return null;
}

/** 체크박스 아래에 붙는 사유 문구 (프로그램 이름은 이미 옆에 있으므로 반복하지 않는다) */
function gateText(p: ProgramAvailability, reason: 'closed' | 'full'): string {
  return reason === 'full' && p.total_cap != null
    ? `접수 상한 ${p.total_cap}명에 도달해 신규 접수가 마감되었습니다.`
    : '정원과 대기 인원이 모두 차 신규 접수가 마감되었습니다.';
}

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple';

const MY_PAGE = '/apply/surf-camp/my';

export default function SurfCampForm({
  availability,
}: {
  availability: SurfcampAvailability;
}) {
  const [state, formAction, pending] = useActionState(submitSurfCamp, initialState);

  const [participants, setParticipants] = useState<ParticipantRow[]>([
    emptyParticipant(),
  ]);
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [repName, setRepName] = useState('');
  const [residentType, setResidentType] = useState('');
  const [region, setRegion] = useState('');
  const [lessonTime, setLessonTime] = useState('');

  const closed = KILL_SWITCH || !availability.open;

  // 프로그램별 신규접수 게이트. 막힌 프로그램만 빼고 나머지는 계속 접수한다.
  const lessonGate = gateReason(availability.lesson);
  const specialGate = gateReason(availability.special);
  const closedPrograms: ClosedProgramReasons = {
    ...(lessonGate ? { lesson: gateText(availability.lesson, lessonGate) } : {}),
    ...(specialGate ? { special: gateText(availability.special, specialGate) } : {}),
  };
  const allProgramsClosed = lessonGate !== null && specialGate !== null;

  // ── 접수 전 / 마감 / 일시 중단 ─────────────────────────────────────────────
  if (closed) {
    const openAt = availability.open_at;
    const opensIn = availability.opens_in_seconds;

    // 1) 비상 정지 — 재배포가 필요한 스위치라 가장 먼저 판단한다.
    if (KILL_SWITCH) {
      return (
        <ClosedNotice title="접수가 일시 중단되었습니다">
          <p className="mt-3 text-sm leading-relaxed text-navy/60">
            {EVENT.name} 온라인 접수를 일시적으로 중단했습니다.
            <br />
            재개 일정은 협회 홈페이지 공지로 안내드립니다.
          </p>
        </ClosedNotice>
      );
    }

    // 2) 예약 오픈 대기 — 오픈 시각이 정해져 있고 아직 도달하지 않은 경우.
    if (openAt && typeof opensIn === 'number' && opensIn > 0) {
      return (
        <ClosedNotice title="접수 시작 전입니다">
          <p className="mt-4 text-sm text-navy/50">{EVENT.name} 온라인 접수는</p>
          <p
            className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: 'var(--color-ocean)' }}
          >
            {formatKst(openAt)}
          </p>
          <p className="mt-1 text-sm text-navy/50">에 시작됩니다.</p>

          <OpenCountdown openAtIso={openAt} initialSeconds={opensIn} />

          <div
            className="mt-8 rounded-xl border px-4 py-4 text-left text-sm leading-relaxed text-navy/75"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-sunset) 40%, transparent)',
              background: 'color-mix(in srgb, var(--color-sunset) 8%, transparent)',
            }}
          >
            <p className="font-bold text-navy">
              접수 시작과 동시에 선착순으로 마감될 수 있으니 미리 신청 정보를 준비해 주세요.
            </p>
            <ul className="mt-2 space-y-1 text-navy/70">
              <li>· 대표 신청자 성명 · 휴대폰 번호 · 주소</li>
              <li>· 참가자별 성명 · 성별 · 나이 · 신장 · 몸무게 · 서핑 경험</li>
              <li>
                · 참가자별 신청 프로그램 ({programLabel('lesson')} · {programLabel('special')})
              </li>
              <li>· 희망 강습권역 · 희망 강습시간</li>
            </ul>
            <p className="mt-2 text-xs text-navy/55">
              정원이 찬 뒤에는 대기 접수로 전환되며, 취소가 발생하면 대기 순번대로 자동
              확정됩니다.
            </p>
          </div>
        </ClosedNotice>
      );
    }

    // 3) 마감 — 수동 스위치가 닫혀 있고 예약도 없거나 이미 지난 경우.
    return (
      <ClosedNotice title="접수가 마감되었습니다">
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          {EVENT.name} 온라인 접수가 마감되었습니다.
          <br />
          추가 접수나 다음 일정은 협회 홈페이지 공지로 안내드립니다.
        </p>
      </ClosedNotice>
    );
  }

  // ── 접수 완료 화면 ─────────────────────────────────────────────────────────
  if (state.status === 'success' && state.result) {
    const { lesson, special } = state.result.programs;
    const anyWaitlist = lesson?.status === 'waitlist' || special?.status === 'waitlist';
    const accent = anyWaitlist ? 'sunset' : 'teal';
    // 마감된 프로그램은 접수에서 조용히 빠진다. 말해 주지 않으면 신청자는
    // 신청됐다고 오해한 채 현장에 온다.
    const blocked = state.result.blocked ?? {};
    const blockedLabels = (['lesson', 'special'] as const)
      .filter((k) => blocked[k])
      .map((k) => programLabel(k));

    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ animation: 'ysaFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div
          className="px-6 pt-10 pb-8 text-center sm:px-10"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${accent}) 10%, transparent), transparent)`,
          }}
        >
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
            style={{
              background: `var(--color-${accent})`,
              boxShadow: `0 10px 30px -10px color-mix(in srgb, var(--color-${accent}) 60%, transparent)`,
              animation: 'ysaScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards',
            }}
          >
            <svg
              className="h-11 w-11 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d="M5 12.5l4.5 4.5L19 7"
                style={{
                  strokeDasharray: 48,
                  animation: 'ysaCheckDraw 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s backwards',
                }}
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            신청이 접수되었습니다
          </h2>
          <p className="mt-3 text-sm text-navy/60 sm:text-base">
            입력하신 연락처로 접수 안내 문자를 보내드립니다.
          </p>
        </div>

        <div className="border-t border-dashed border-gray-200 px-6 py-6 sm:px-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
            신청 내역
          </p>
          <dl className="space-y-3 text-sm">
            <ReceiptRow label="대표 신청자" value={state.result.rep_name} />
            <ReceiptRow
              label="희망 강습권역 · 시간"
              value={`${regionLabel(region)} · ${lessonTimeLabel(lessonTime)}`}
            />
            <ProgramResultRow programKey="lesson" outcome={lesson} />
            <ProgramResultRow programKey="special" outcome={special} />
          </dl>
        </div>

        {blockedLabels.length > 0 && (
          <div
            className="border-t border-gray-100 px-6 py-4 text-xs leading-relaxed text-navy/70 sm:px-10 sm:text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-sunset) 10%, transparent)' }}
          >
            <strong className="text-navy">{blockedLabels.join(' · ')}</strong>은 신규 접수가
            마감되어 이번 신청에서 제외되었습니다. 위 「신청 내역」에 표시된 프로그램만
            접수되었습니다. 문의는 {INQUIRY_TEL}로 부탁드립니다.
          </div>
        )}

        {anyWaitlist && (
          <div
            className="border-t border-gray-100 px-6 py-4 text-xs leading-relaxed text-navy/70 sm:px-10 sm:text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-sunset) 6%, transparent)' }}
          >
            대기로 접수된 프로그램은 취소가 발생하면{' '}
            <strong className="text-navy">대기 순번대로 자동 확정</strong>되며, 확정 시
            문자로 안내드립니다. 별도의 재접수는 필요하지 않습니다.
          </div>
        )}

        <div className="border-t border-gray-100 px-6 py-4 text-xs leading-relaxed text-navy/60 sm:px-10 sm:text-sm">
          신청 내용 확인·수정·취소는{' '}
          <Link href={MY_PAGE} className="font-semibold text-navy underline underline-offset-2">
            신청 조회
          </Link>{' '}
          페이지에서 휴대폰 본인 인증 후 가능합니다. 문의: {INQUIRY_TEL}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-5 sm:flex-row sm:justify-end sm:gap-3 sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-gray-50"
          >
            홈으로
          </Link>
          <Link
            href={MY_PAGE}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90"
          >
            신청 조회하기
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // ── 두 프로그램 모두 신규 접수 마감 ────────────────────────────────────────
  // 전체 스위치가 열려 있어도 받을 수 있는 프로그램이 하나도 없으면 폼을 띄우지 않는다.
  // (이미 접수하신 분의 대기 순번과 자동 확정은 그대로 유지된다)
  if (allProgramsClosed) {
    return (
      <ClosedNotice title="접수가 마감되었습니다">
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          {EVENT.name}의 두 프로그램 모두 신규 접수가 마감되었습니다.
        </p>
        <ul className="mx-auto mt-4 max-w-md space-y-1.5 text-left text-sm text-navy/70">
          <li>
            · <strong className="text-navy">{programLabel('lesson')}</strong> —{' '}
            {gateText(availability.lesson, lessonGate)}
          </li>
          <li>
            · <strong className="text-navy">{programLabel('special')}</strong> —{' '}
            {gateText(availability.special, specialGate)}
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-navy/60">
          이미 접수하신 분의 확정·대기 순번은 그대로 유지되며, 취소가 발생하면 대기 순번대로
          자동 확정되어 문자로 안내드립니다.
        </p>
      </ClosedNotice>
    );
  }

  // ── 접수 폼 ────────────────────────────────────────────────────────────────
  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="participants_json" value={serializeParticipants(participants)} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="address_detail" value={addressDetail} />

      {/* 잔여 현황 — 상세 안내는 폼 위 ProgramGuide 에서 제공한다 */}
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-ocean)' }}
            >
              Surf Camp 2026
            </p>
            <h2 className="mt-1 text-lg font-bold text-navy">참가 신청</h2>
          </div>
          <CapacityBadge availability={availability} />
        </div>
      </section>

      {/* 대표 신청자 */}
      <Section title="대표 신청자" required>
        <p className="text-sm leading-relaxed text-navy/60">
          대표 신청자는 <strong className="text-navy">연락과 접수를 담당하는 분</strong>
          입니다. 접수 안내 문자와 신청 조회는 아래 휴대폰 번호를 기준으로 진행되며, 한
          번호당 한 건만 신청할 수 있습니다.{' '}
          <strong className="text-navy">
            대표 신청자는 참가자로 자동 등록되지 않습니다.
          </strong>{' '}
          본인도 함께 참가하신다면 아래 「참가자 정보」에 본인을 반드시 추가해 주세요.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="성명" required>
            <input
              type="text"
              name="rep_name"
              required
              maxLength={40}
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="휴대폰 번호" required>
            <input
              type="tel"
              name="phone"
              required
              inputMode="tel"
              placeholder="010-1234-5678"
              className={inputCls}
            />
            <p className="text-xs leading-relaxed text-navy/50">
              접수·확정·대기 안내 문자는 {EVENT.host} 알림 운영 대행사인{' '}
              <strong className="font-semibold text-navy/70">{SMS_SENDER_ORG}</strong>{' '}
              명의(발신번호 010-9542-3775)로 발송됩니다.
            </p>
          </Field>
          <div className="md:col-span-2">
            <Field label="주소" required>
              <AddressSearch
                value={address}
                detailValue={addressDetail}
                onChange={setAddress}
                onDetailChange={setAddressDetail}
              />
            </Field>
          </div>
        </div>

        <Field label="참가자 구분" required>
          <OptionGroup
            name="resident_type"
            options={RESIDENT_TYPES}
            value={residentType}
            onChange={setResidentType}
            columns="grid-cols-2"
          />
        </Field>
      </Section>

      {/* 희망 강습권역 / 시간 */}
      <Section title="희망 강습권역 · 시간" required>
        <p className="text-sm text-navy/60">
          권역과 시간은 <strong className="text-navy">신청 전체에 1개</strong>만 선택하며,
          가족 참가자 전원에게 동일하게 적용됩니다. 신청 현황에 따라 조정될 수 있습니다.
        </p>
        <Field label="희망 강습권역" required>
          <OptionGroup
            name="region"
            options={REGIONS}
            value={region}
            onChange={setRegion}
            columns="grid-cols-3 sm:grid-cols-5"
          />
        </Field>
        <Field label="희망 강습시간" required>
          <OptionGroup
            name="lesson_time"
            options={LESSON_TIMES}
            value={lessonTime}
            onChange={setLessonTime}
            columns="grid-cols-3"
          />
        </Field>
      </Section>

      {/* 참가자 */}
      <Section title="참가자 정보" required>
        <div
          className="rounded-xl border px-4 py-3.5 text-sm leading-relaxed text-navy/75"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-sunset) 40%, transparent)',
            background: 'color-mix(in srgb, var(--color-sunset) 8%, transparent)',
          }}
        >
          <p className="font-bold text-navy">
            대표 신청자 본인이 참가하시는 경우에도 아래에 본인 정보를 입력해 주세요.
          </p>
          <p className="mt-1">
            여기에 입력된 분만 참가자로 접수됩니다. 위 대표 신청자 정보는 연락·접수용이며,
            참가자 명단에 자동으로 포함되지 않습니다.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-navy/60">
          함께 참가하는 분을 모두 등록해 주세요. 참가자별로 신청 프로그램을 1개 이상
          선택해야 합니다. 신장·몸무게는 수트와 보드 준비를 위해 사용됩니다.{' '}
          <strong className="text-navy">
            {programLabel('lesson')}은 만 {LESSON_MIN_AGE}세 이상, 신장{' '}
            {LESSON_MIN_HEIGHT}cm 이상만 신청하실 수 있습니다.
          </strong>{' '}
          기준에 미치지 않는 분은 {programLabel('special')}만 신청하실 수 있습니다.
        </p>
        {/*
          프로그램마다 신청서를 따로 쓰는 분들이 실제로 있었다(번호를 바꿔 두 번 접수).
          체크박스 바로 위에서 한 번 더 짚어 준다.
        */}
        <p
          className="rounded-lg px-4 py-3 text-sm leading-relaxed text-navy/75"
          style={{ background: 'color-mix(in srgb, var(--color-teal) 9%, transparent)' }}
        >
          <strong className="text-navy">
            두 프로그램을 모두 참여하시려면 아래에서 둘 다 체크해 주세요.
          </strong>{' '}
          프로그램별로 신청서를 따로 작성하실 필요는 없습니다.
        </p>
        {/* 한쪽 프로그램만 마감된 경우 — 체크박스를 눌러 보기 전에 먼저 알려 준다. */}
        {(lessonGate || specialGate) && (
          <div
            className="rounded-xl border px-4 py-3.5 text-sm leading-relaxed text-navy/75"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-sunset) 55%, transparent)',
              background: 'color-mix(in srgb, var(--color-sunset) 12%, transparent)',
            }}
          >
            <p className="font-bold text-navy">신규 접수가 마감된 프로그램이 있습니다.</p>
            <ul className="mt-1.5 space-y-1">
              {lessonGate && (
                <li>
                  · <strong className="text-navy">{programLabel('lesson')}</strong> —{' '}
                  {gateText(availability.lesson, lessonGate)}
                </li>
              )}
              {specialGate && (
                <li>
                  · <strong className="text-navy">{programLabel('special')}</strong> —{' '}
                  {gateText(availability.special, specialGate)}
                </li>
              )}
            </ul>
            <p className="mt-1.5 text-xs text-navy/60">
              마감된 프로그램은 선택하실 수 없습니다. 남은 프로그램은 계속 신청하실 수
              있습니다. 이미 접수하신 분의 대기 순번과 자동 확정은 그대로 유지됩니다.
            </p>
          </div>
        )}
        <ParticipantEditor
          value={participants}
          onChange={setParticipants}
          closedPrograms={closedPrograms}
        />
      </Section>

      {/* 동의 */}
      <Section title="확인 및 동의" required>
        <div className="space-y-3">
          <Consent
            name="consent_privacy"
            required
            label="[필수] 개인정보 수집·이용 및 제3자 제공 · 초상권 활용 동의"
            desc={
              <>
                <ConsentItem title="수집 항목">
                  대표 신청자 성명·휴대폰 번호·주소, 참가자 성명·성별·나이·신장·몸무게·서핑
                  경험
                </ConsentItem>
                <ConsentItem title="이용 목적">
                  접수 확인, 참가 안내 문자 발송, 강습 배정 및 안전관리, 장비(보드·웨트수트)
                  준비
                </ConsentItem>
                <ConsentItem title="보유 기간">행사 종료 후 1년 이내 파기</ConsentItem>
                <ConsentItem title="제3자 제공">
                  <span className="mt-0.5 block">
                    · 배정된 서핑스쿨 — 강습 운영 및 현장 안전관리
                  </span>
                  <span className="block">· {EVENT.host} — 사업 결과보고</span>
                  <span className="block">
                    · {SMS_SENDER_ORG} — 접수·확정·대기 안내 문자 발송 대행
                  </span>
                  <span className="mt-0.5 block">
                    제공 항목은 성명·휴대폰 번호 등 운영에 필요한 최소한이며, 행사 종료 후
                    파기됩니다.
                  </span>
                </ConsentItem>
                <ConsentItem title="초상권 활용">
                  행사 중 촬영된 사진·영상을 사업 결과보고와 홍보(협회 홈페이지·SNS·보도자료
                  등) 목적으로 활용합니다.
                </ConsentItem>
                <span className="mt-1.5 block">
                  동의를 거부하실 수 있으나, 동의하지 않으시면 안전한 운영이 어려워 접수가
                  제한됩니다.
                </span>
              </>
            }
          />
          <Consent
            name="consent_weather"
            required
            label="[필수] 안전 및 기상상황 확인 / 안전수칙 준수"
            desc="서핑은 해양환경에서 진행되는 활동으로, 기상·파고·풍향·풍속 등 현장 상황에 따라 프로그램이 변경·중단 또는 취소될 수 있음을 확인합니다. 또한 강사의 안전교육과 현장 통제에 따르며, 안전수칙을 준수하지 않는 경우 강습 참여가 제한될 수 있음에 동의합니다."
          />
          <Consent
            name="consent_assignment"
            required
            label="[필수] 스쿨 배정 확인"
            desc="희망 강습권역과 시간을 기준으로 신청하되, 최종 서핑스쿨 및 시간은 신청현황과 현장 운영여건에 따라 조정·배정될 수 있음을 확인합니다."
          />
        </div>
      </Section>

      {state.status === 'error' && state.message && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Link
          href="/apply"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-navy transition hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-purple px-8 py-3 font-bold text-white transition hover:bg-purple/90 disabled:opacity-50"
        >
          {pending ? '접수 중…' : '접수하기'}
        </button>
      </div>
    </form>
  );
}

// ── 로컬 서브컴포넌트 ────────────────────────────────────────────────────────

/** 접수 전 / 마감 / 일시 중단 화면의 공통 껍데기 (문의처·목록 링크 포함). */
function ClosedNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      {children}
      <p className="mt-6 text-sm text-navy/60">문의: {INQUIRY_TEL}</p>
      <Link
        href="/apply"
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-gray-50"
      >
        온라인 접수 목록으로
      </Link>
    </div>
  );
}

function Section({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
        {title}
        {required && <span className="text-sm text-red-500">*</span>}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/** 라디오 pill 그룹. 실제 값은 숨은 radio 로 FormData 에 실린다. */
function OptionGroup({
  name,
  options,
  value,
  onChange,
  columns,
}: {
  name: string;
  options: readonly { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  columns: string;
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <label
            key={o.key}
            className={`relative cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition ${
              on
                ? 'border-purple bg-purple text-white'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            {/* hidden 이 아니라 sr-only 로 감춘다 — display:none 인 required 컨트롤은
                포커스가 불가능해 브라우저 기본 검증이 폼 제출을 조용히 막아버린다. */}
            <input
              type="radio"
              name={name}
              value={o.key}
              required
              checked={on}
              onChange={() => onChange(o.key)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

function Consent({
  name,
  label,
  desc,
  required,
}: {
  name: string;
  label: string;
  desc: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-white p-3.5 text-sm text-navy/70 transition hover:border-gray-300">
      <input type="checkbox" name={name} required={required} className="mt-1 shrink-0" />
      <span>
        <span className="font-semibold text-navy">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed">{desc}</span>
      </span>
    </label>
  );
}

/**
 * 긴 동의문을 소항목으로 끊어 읽기 쉽게 만든다.
 * label 안에 들어가므로 블록 요소 대신 span + block 으로만 구성한다.
 */
function ConsentItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <span className="mt-1.5 block first:mt-0">
      <span className="font-semibold text-navy/80">{title}</span>
      <span className="block">{children}</span>
    </span>
  );
}

function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-navy/50">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

/** 프로그램별 확정/대기를 분리해 보여준다. 신청하지 않은 프로그램은 표시하지 않는다. */
function ProgramResultRow({
  programKey,
  outcome,
}: {
  programKey: 'lesson' | 'special';
  outcome: ProgramOutcome | null;
}) {
  if (!outcome) return null;
  const waitlisted = outcome.status === 'waitlist';
  const accent = waitlisted ? 'var(--color-sunset)' : 'var(--color-teal)';

  return (
    <ReceiptRow
      label={programLabel(programKey)}
      value={
        <span className="inline-flex items-center gap-2">
          <span>{outcome.count}명</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              color: accent,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            {waitlisted ? '대기' : '확정'}
          </span>
        </span>
      }
    />
  );
}
