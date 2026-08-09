'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import AddressSearch from '@/components/apply/AddressSearch';
import CapacityBadge from '@/components/apply/surf-camp/CapacityBadge';
import ParticipantEditor, {
  emptyParticipant,
  serializeParticipants,
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
  lessonTimeLabel,
  programLabel,
  regionLabel,
} from '@/lib/surfcamp-config';
import type { ProgramOutcome, SurfcampAvailability } from '@/lib/surfcamp-db';

const initialState: SurfCampFormState = { status: 'idle' };

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

  // ── 접수 마감 / 준비 중 ────────────────────────────────────────────────────
  if (closed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-navy">
          {KILL_SWITCH ? '접수가 일시 중단되었습니다' : '접수 준비 중입니다'}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          {EVENT.name} 온라인 접수는 아직 열리지 않았거나 마감되었습니다.
          <br />
          접수 일정은 협회 홈페이지 공지로 안내드립니다.
        </p>
        <p className="mt-4 text-sm text-navy/60">문의: {INQUIRY_TEL}</p>
        <Link
          href="/apply"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-gray-50"
        >
          온라인 접수 목록으로
        </Link>
      </div>
    );
  }

  // ── 접수 완료 화면 ─────────────────────────────────────────────────────────
  if (state.status === 'success' && state.result) {
    const { lesson, special } = state.result.programs;
    const anyWaitlist = lesson?.status === 'waitlist' || special?.status === 'waitlist';
    const accent = anyWaitlist ? 'sunset' : 'teal';

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

  // ── 접수 폼 ────────────────────────────────────────────────────────────────
  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="participants_json" value={serializeParticipants(participants)} />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="address_detail" value={addressDetail} />

      {/* 행사 안내 */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--color-ocean) 8%, transparent), transparent)',
          }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-ocean)' }}
            >
              Surf Camp 2026
            </p>
            <CapacityBadge availability={availability} />
          </div>
          <h2 className="text-xl font-bold text-navy">{EVENT.name}</h2>
          <p className="mt-1.5 text-sm text-navy/60">
            주최 {EVENT.host} · 주관 {EVENT.organizer}
          </p>
        </div>

        <div className="space-y-4 border-t border-gray-100 px-6 py-5 text-sm leading-relaxed">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCard
              title={`${programLabel('lesson')} · 200명`}
              lines={[
                `${EVENT.lessonDateLabel} 13:00 / 15:00 (2회차)`,
                `만 ${LESSON_MIN_AGE}세 이상, 신장 ${LESSON_MIN_HEIGHT}cm 이상`,
              ]}
            />
            <InfoCard
              title={`${programLabel('special')} · 300명`}
              lines={[EVENT.specialDateLabel, EVENT.specialTitle]}
            />
          </div>
          <ul className="space-y-1.5 text-xs text-navy/70 sm:text-sm">
            <li>· 신청 대상: 양양군민 및 양양 생활인구</li>
            <li>
              · 최종 서핑스쿨은 신청 현황과 안전 운영을 고려해 운영본부가 배정하며,
              장소·시간은 참가 확정 후 개별 안내드립니다.
            </li>
            <li>· 기상·해상 상황에 따라 일정이 변경되거나 중단될 수 있습니다.</li>
            <li>
              · <strong className="text-navy">신청 완료가 곧 참가 확정은 아닙니다.</strong>{' '}
              정원 내 접수 시 확정, 정원 초과 시 대기로 접수됩니다.
            </li>
          </ul>
        </div>

        <div
          className="border-t border-gray-100 px-6 py-4 text-xs leading-relaxed text-navy/70 sm:text-sm"
          style={{ background: 'color-mix(in srgb, var(--color-sunset) 6%, transparent)' }}
        >
          <p className="mb-1 font-semibold text-navy">대기 접수 안내</p>
          정원을 초과하면 자동으로 대기 접수되며, 취소가 발생하면 대기 순번대로 자동
          확정되고 문자로 안내드립니다. 신청은 프로그램별로 가족 전원이 함께 확정되므로,{' '}
          <strong className="text-navy">
            남은 자리보다 인원이 많은 가족은 건너뛰고 다음 순번이 먼저 확정될 수 있습니다.
          </strong>
        </div>
      </section>

      {/* 대표 신청자 */}
      <Section title="대표 신청자" required>
        <p className="text-sm text-navy/60">
          접수 안내 문자와 신청 조회는 아래 휴대폰 번호를 기준으로 진행됩니다. 한 번호당
          한 건만 신청할 수 있습니다.
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
        <p className="text-sm text-navy/60">
          함께 참가하는 분을 모두 등록해 주세요. 참가자별로 신청 프로그램을 1개 이상
          선택해야 합니다. 신장·몸무게는 수트와 보드 준비를 위해 사용됩니다.
        </p>
        <ParticipantEditor value={participants} onChange={setParticipants} />
      </Section>

      {/* 동의 */}
      <Section title="확인 및 동의" required>
        <div className="space-y-3">
          <Consent
            name="consent_privacy"
            required
            label="[필수] 개인정보 수집·이용 동의"
            desc="수집 항목: 대표 신청자 성명·휴대폰 번호·주소, 참가자 성명·성별·나이·신장·몸무게·서핑 경험. 이용 목적: 접수 확인, 참가 안내, 강습 배정 및 안전관리, 장비 준비. 보유 기간: 행사 종료 후 1년 이내 파기. 동의하지 않으시면 접수가 제한됩니다."
          />
          <Consent
            name="consent_eligibility"
            required
            label="[필수] 참가자격 확인"
            desc={`본인은 서핑강습 참가일 기준 만 ${LESSON_MIN_AGE}세 이상이며 신장 ${LESSON_MIN_HEIGHT}cm 이상임을 확인합니다. 기준에 해당하지 않을 경우 안전상의 이유로 강습 참여가 제한될 수 있음에 동의합니다. 기재한 나이·신장·몸무게가 사실과 다를 경우에도 현장에서 참가가 제한될 수 있습니다.`}
          />
          <Consent
            name="consent_alcohol"
            required
            label="[필수] 음주 관련 확인"
            desc="강습 전 음주한 경우 안전상의 이유로 강습 참여가 불가하며, 본인의 음주로 참여가 제한되는 경우 별도의 보상 또는 대체 참여가 제공되지 않음을 확인합니다."
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
          <Consent
            name="consent_media"
            label="[선택] 초상권 및 홍보 활용 동의"
            desc="행사 중 촬영된 사진·영상을 결과보고 및 홍보 목적으로 활용하는 데 동의합니다. 동의하지 않아도 참가할 수 있습니다."
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

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
      <p className="text-sm font-bold text-navy">{title}</p>
      {lines.map((l, i) => (
        <p key={i} className="mt-0.5 text-xs text-navy/60">
          {l}
        </p>
      ))}
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
  desc: string;
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
