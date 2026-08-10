'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import AddressSearch from '@/components/apply/AddressSearch';
import ParticipantEditor, {
  serializeParticipants,
  type ParticipantRow,
} from '@/components/apply/surf-camp/ParticipantEditor';
import {
  cancelMyRegistration,
  updateMyRegistration,
  type MyFormState,
} from './actions';
import {
  EVENT,
  INQUIRY_TEL,
  LESSON_MIN_AGE,
  LESSON_MIN_HEIGHT,
  LESSON_TIMES,
  REGIONS,
  RESIDENT_TYPES,
  lessonTimeLabel,
  programLabel,
  regionLabel,
  residentTypeLabel,
} from '@/lib/surfcamp-config';
import type { SurfcampRegistration, SurfcampSignup } from '@/lib/surfcamp-db';

/**
 * 본인 인증을 통과한 신청서의 수정 · 취소 화면.
 *
 * ★ 기존 참가자는 반드시 id 를 실어 보낸다(ParticipantRow.id).
 *   id 가 빠지면 서버가 "삭제 후 신규 추가"로 판단해 이미 확정된 좌석을 반납하고
 *   다시 정원 판정을 받게 된다 — 확정이 대기로 밀릴 수 있다.
 *
 * ★ 휴대폰 번호는 신청 중복 방지 키라 수정 대상이 아니다. 읽기 전용으로만 보여준다.
 */

const initialState: MyFormState = { status: 'idle' };

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple';

/** 숫자만 저장된 번호를 보기 좋게. 형식이 다르면 원본을 그대로 둔다. */
function formatPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw ?? '';
}

/** DB 참가자 → 에디터 행. 숫자는 문자열로, id 는 그대로 유지한다. */
function toRows(reg: SurfcampRegistration): ParticipantRow[] {
  return reg.participants.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    age: String(p.age),
    height_cm: String(p.height_cm),
    weight_kg: String(p.weight_kg),
    surf_exp: p.surf_exp,
    programs: p.signups
      .filter((s) => s.status !== 'cancelled')
      .map((s) => s.program),
  }));
}

export default function EditForm({ registration }: { registration: SurfcampRegistration }) {
  const [updateState, updateAction, updating] = useActionState(
    updateMyRegistration,
    initialState,
  );
  const [cancelState, cancelAction, cancelling] = useActionState(
    cancelMyRegistration,
    initialState,
  );

  const [participants, setParticipants] = useState<ParticipantRow[]>(() =>
    toRows(registration),
  );
  const [repName, setRepName] = useState(registration.rep_name);
  const [address, setAddress] = useState(registration.address);
  const [addressDetail, setAddressDetail] = useState(registration.address_detail ?? '');
  const [residentType, setResidentType] = useState<string>(registration.resident_type);
  const [region, setRegion] = useState<string>(registration.region);
  const [lessonTime, setLessonTime] = useState<string>(registration.lesson_time);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const savedCount = registration.participants.length;
  const grew = participants.length > savedCount;

  return (
    <div className="space-y-8">
      {/* ── 운영 사무국 안내 ───────────────────────────────────────────────────
          관리자가 이 신청 건에 남긴 안내(applicant_notice)만 표시한다.
          내부 운영 메모(staff_note)는 조회 RPC 가 아예 돌려주지 않으므로
          이 화면으로 흘러들 여지가 없다. 값이 없으면 아무것도 그리지 않는다. */}
      {registration.applicant_notice && (
        <section
          className="rounded-2xl border p-6 shadow-sm"
          style={{
            borderColor: 'var(--color-teal)',
            background: 'color-mix(in srgb, var(--color-teal) 8%, white)',
          }}
        >
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-ocean)' }}>
            운영 사무국 안내
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy">
            {registration.applicant_notice}
          </p>
          <p className="mt-3 text-xs text-navy/50">
            운영 사무국에서 이 신청 건에 남긴 안내입니다. 추가 문의는 {INQUIRY_TEL} 으로 연락해
            주세요.
          </p>
        </section>
      )}

      {/* ── 현재 신청 상태 ─────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          className="px-6 pt-6 pb-5"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--color-ocean) 8%, transparent), transparent)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-ocean)' }}
          >
            My Registration
          </p>
          <h2 className="mt-2 text-xl font-bold text-navy">{EVENT.name} 신청 내역</h2>
          <p className="mt-1.5 text-sm text-navy/60">
            {residentTypeLabel(registration.resident_type)} ·{' '}
            {regionLabel(registration.region)} · {lessonTimeLabel(registration.lesson_time)}
          </p>
        </div>

        <div className="border-t border-gray-100 px-6 py-5">
          <ul className="space-y-3">
            {registration.participants.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="text-sm font-bold text-navy">{p.name}</span>
                <span className="text-xs text-navy/50">
                  만 {p.age}세 · {p.height_cm}cm · {p.weight_kg}kg
                </span>
                {p.signups
                  .filter((s) => s.status !== 'cancelled')
                  .map((s) => (
                    <StatusChip key={`${p.id}-${s.program}`} signup={s} />
                  ))}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-navy/50">
            대기 중인 프로그램은 취소가 발생하면 대기 순번대로 자동 확정되고 문자로
            안내드립니다. 별도의 재접수는 필요하지 않습니다.
          </p>
        </div>
      </section>

      {/* ── 수정 ───────────────────────────────────────────────────────────── */}
      <form action={updateAction} className="space-y-8">
        <input type="hidden" name="registration_id" value={registration.id} />
        <input
          type="hidden"
          name="participants_json"
          value={serializeParticipants(participants)}
        />
        <input type="hidden" name="address" value={address} />
        <input type="hidden" name="address_detail" value={addressDetail} />
        {/* 비고는 이 화면에서 수정하지 않지만, 보내지 않으면 서버가 비워버린다. */}
        <input type="hidden" name="note" value={registration.note ?? ''} />
        {/* 초상권 동의는 접수 시 개인정보 동의문에 통합돼 별도 체크박스가 없다.
            서버는 이 필드의 존재 여부로 값을 판정하므로, 저장된 값을 그대로 실어
            수정할 때 동의 상태가 뒤집히지 않게 한다. */}
        {registration.consent_media && (
          <input type="hidden" name="consent_media" value="1" />
        )}

        <Section title="대표 신청자">
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
            <Field label="휴대폰 번호">
              <input
                type="text"
                value={formatPhone(registration.phone)}
                readOnly
                aria-readonly="true"
                className={`${inputCls} cursor-not-allowed bg-gray-50 text-navy/60`}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-navy/50">
                휴대폰 번호는 신청 중복 확인 기준이라 수정할 수 없습니다. 번호를 바꾸시려면
                아래에서 신청을 취소한 뒤 새 번호로 다시 접수해 주세요.
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

        <Section title="희망 강습권역 · 시간">
          <p className="text-sm text-navy/60">
            권역과 시간은 <strong className="text-navy">신청 전체에 1개</strong>만 선택하며,
            참가자 전원에게 동일하게 적용됩니다. 신청 현황에 따라 조정될 수 있습니다.
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

        <Section title="참가자 정보">
          <div
            className="rounded-lg px-4 py-3 text-xs leading-relaxed text-navy/70 sm:text-sm"
            style={{ background: 'color-mix(in srgb, var(--color-sunset) 8%, transparent)' }}
          >
            이미 <strong className="text-navy">확정</strong>된 참가자와 프로그램은 그대로
            유지됩니다. 다만 참가자를 새로 추가하거나 프로그램을 추가하면{' '}
            <strong className="text-navy">늘어난 인원만 별도로 정원 판정</strong>을 받아
            대기로 접수될 수 있습니다. 참가자를 삭제하거나 프로그램 선택을 해제하면 그
            자리는 즉시 반납되며 되돌릴 수 없습니다.
          </div>
          <p className="text-sm leading-relaxed text-navy/60">
            {programLabel('lesson')}은 만 {LESSON_MIN_AGE}세 이상, 신장{' '}
            {LESSON_MIN_HEIGHT}cm 이상만 신청하실 수 있습니다. 기준에 미치지 않는 분은{' '}
            {programLabel('special')}만 신청하실 수 있습니다.
          </p>
          <ParticipantEditor value={participants} onChange={setParticipants} />
          {grew && (
            <p className="text-xs text-sunset">
              참가자가 {savedCount}명에서 {participants.length}명으로 늘었습니다. 늘어난
              인원은 잔여 정원에 따라 대기로 접수될 수 있습니다.
            </p>
          )}
        </Section>


        {updateState.status === 'error' && updateState.message && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {updateState.message}
          </p>
        )}
        {updateState.status === 'success' && updateState.message && (
          <p
            role="status"
            className="rounded-lg border border-teal/40 bg-teal/10 p-4 text-sm text-ocean"
          >
            {updateState.message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/apply/surf-camp"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-navy transition hover:bg-gray-50"
          >
            접수 안내로
          </Link>
          <button
            type="submit"
            disabled={updating}
            className="inline-flex items-center justify-center rounded-lg bg-purple px-8 py-3 text-sm font-bold text-white transition hover:bg-purple/90 disabled:opacity-50"
          >
            {updating ? '저장 중…' : '수정 내용 저장'}
          </button>
        </div>
      </form>

      {/* ── 취소 ───────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-navy">신청 취소</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy/60">
          취소하면 이 신청의 모든 참가자·프로그램이 함께 취소되고, 확정 좌석은 즉시
          대기자에게 넘어갑니다. 접수 기간 중에는 같은 번호로 다시 신청할 수 있지만, 그때는
          잔여 정원에 따라 대기로 접수될 수 있습니다.
        </p>

        <form action={cancelAction} className="mt-4 space-y-3">
          <input type="hidden" name="registration_id" value={registration.id} />
          {/* 취소 사유는 받지 않는다. 취소를 망설이게 만드는 마찰만 늘고 운영에 쓰이지 않는다. */}
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-navy/70">
            <input
              type="checkbox"
              name="confirm"
              required
              checked={confirmCancel}
              onChange={(e) => setConfirmCancel(e.target.checked)}
              className="mt-1 shrink-0"
            />
            <span>
              위 내용을 확인했으며,{' '}
              <strong className="text-navy">신청을 취소하겠습니다.</strong>
            </span>
          </label>

          {cancelState.status === 'error' && cancelState.message && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {cancelState.message}
            </p>
          )}
          {cancelState.status === 'success' && cancelState.message && (
            <p
              role="status"
              className="rounded-lg border border-teal/40 bg-teal/10 p-4 text-sm text-ocean"
            >
              {cancelState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={cancelling || !confirmCancel}
            className="inline-flex items-center justify-center rounded-lg border border-sunset px-6 py-2.5 text-sm font-bold text-sunset transition hover:bg-sunset hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-sunset"
          >
            {cancelling ? '취소 처리 중…' : '신청 취소하기'}
          </button>
        </form>
      </section>

      <p className="text-center text-xs text-navy/50">
        문의 {INQUIRY_TEL} (운영 사무국)
      </p>
    </div>
  );
}

// ── 로컬 서브컴포넌트 ────────────────────────────────────────────────────────

/** 프로그램별 확정 / 대기(앞에 N명). Tailwind v4 라 동적 클래스명은 쓰지 않는다. */
function StatusChip({ signup }: { signup: SurfcampSignup }) {
  const waiting = signup.status === 'waitlist';
  const accent = waiting ? 'var(--color-sunset)' : 'var(--color-teal)';
  const ahead = signup.wait_ahead;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
        color: accent,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {programLabel(signup.program)} {waiting ? '대기' : '확정'}
      {waiting && typeof ahead === 'number' && ` · 앞에 ${ahead}명`}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
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

/** 라디오 pill 그룹. 실제 값은 sr-only radio 로 FormData 에 실린다. */
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
            {/* display:none 인 required 컨트롤은 포커스가 불가능해 브라우저 기본 검증이
                폼 제출을 조용히 막는다. hidden 이 아니라 sr-only 로 감춘다. */}
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
