'use client';

import { useEffect } from 'react';
import {
  GENDERS,
  LESSON_MIN_AGE,
  LESSON_MIN_HEIGHT,
  MAX_PARTICIPANTS,
  PROGRAMS,
  SURF_EXP,
} from '@/lib/surfcamp-config';
import { isLessonEligible } from '@/lib/surfcamp-validate';

/**
 * 참가자 입력 에디터.
 *
 * ★ 이 파일의 export 시그니처는 접수 폼(SurfCampForm)과 수정 화면(/apply/surf-camp/my)이
 *   공유하는 계약이다. 필드를 바꾸면 양쪽이 동시에 깨진다.
 *
 * 값은 전부 "입력 문자열 그대로" 들고 있다가 serializeParticipants 에서만 숫자로 바꾼다.
 * (입력 도중 '1' → 1 → '1' 왕복 변환으로 커서가 튀는 것을 막기 위함)
 */
export interface ParticipantRow {
  /** 기존 참가자면 uuid, 신규면 undefined */
  id?: string;
  name: string;
  gender: '' | 'M' | 'F';
  /** 입력 문자열 그대로 */
  age: string;
  height_cm: string;
  weight_kg: string;
  surf_exp: '' | 'none' | '1-3' | '4+';
  programs: ('lesson' | 'special')[];
}

export function emptyParticipant(): ParticipantRow {
  return {
    name: '',
    gender: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    surf_exp: '',
    programs: [],
  };
}

/** hidden input `participants_json` 에 실어 보낼 문자열. 숫자 필드는 number 로 변환한다. */
export function serializeParticipants(rows: ParticipantRow[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      name: r.name.trim(),
      gender: r.gender,
      age: Number(r.age),
      height_cm: Number(r.height_cm),
      weight_kg: Number(r.weight_kg),
      surf_exp: r.surf_exp,
      programs: r.programs,
    })),
  );
}

/** 하드 게이트(만 10세 이상 & 신장 130cm 이상) 안내. 둘 중 하나라도 미달이면 접수가 막힌다. */
const INELIGIBLE_REASON = `서핑강습은 만 ${LESSON_MIN_AGE}세 이상, 신장 ${LESSON_MIN_HEIGHT}cm 이상만 신청할 수 있습니다. 기준에 미치지 않는 분은 서핑 특화 체험에 참여해 주세요.`;

/**
 * 프로그램별 신규접수 마감 안내.
 * 프로그램 키 → 사유 문구. 여기 담긴 프로그램은 체크박스를 비활성화한다.
 * ★ 자격 미달(나이·신장)과는 다른 축이다. 자격은 사람마다 다르고, 이건 전원 공통이다.
 */
export type ClosedProgramReasons = Partial<Record<'lesson' | 'special', string>>;

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple';

/** 숫자만 남긴다. 빈 문자열은 그대로 유지(placeholder 를 보여주기 위해). */
function digits(v: string): string {
  return v.replace(/\D/g, '');
}

/** 서핑강습 접수 가능 여부. 나이·신장 하한을 모두 만족해야 한다. */
function rowEligible(r: ParticipantRow): boolean {
  return isLessonEligible(Number(r.age), Number(r.height_cm));
}

export default function ParticipantEditor({
  value,
  onChange,
  max = MAX_PARTICIPANTS,
  closedPrograms = {},
}: {
  value: ParticipantRow[];
  onChange: (rows: ParticipantRow[]) => void;
  max?: number;
  /**
   * 신규 접수가 마감된 프로그램. 기본값은 "마감 없음"이라 수정 화면(/apply/surf-camp/my)은
   * 아무 영향을 받지 않는다.
   */
  closedPrograms?: ClosedProgramReasons;
}): React.ReactElement {
  // 나이나 신장을 기준 미만으로 낮춰 자격을 잃으면 '서핑강습' 선택을 자동으로 해제한다.
  // 부모가 넘겨준 초기값(수정 화면의 DB 데이터)에도 동일하게 적용되도록 effect 로 정규화.
  useEffect(() => {
    const needsFix = value.some((r) => r.programs.includes('lesson') && !rowEligible(r));
    if (!needsFix) return;
    onChange(
      value.map((r) =>
        r.programs.includes('lesson') && !rowEligible(r)
          ? { ...r, programs: r.programs.filter((p) => p !== 'lesson') }
          : r,
      ),
    );
  }, [value, onChange]);

  function patch(index: number, next: Partial<ParticipantRow>) {
    onChange(value.map((r, i) => (i === index ? { ...r, ...next } : r)));
  }

  function toggleProgram(index: number, program: 'lesson' | 'special', on: boolean) {
    const current = value[index].programs;
    const next = on
      ? Array.from(new Set([...current, program]))
      : current.filter((p) => p !== program);
    patch(index, { programs: next as ('lesson' | 'special')[] });
  }

  function addRow() {
    if (value.length >= max) return;
    onChange([...value, emptyParticipant()]);
  }

  function removeRow(index: number) {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.map((row, i) => {
        const eligible = rowEligible(row);
        return (
          <div
            key={row.id ?? i}
            className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-navy">참가자 {i + 1}</p>
              {value.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-navy/60 transition hover:border-red-300 hover:text-red-600"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  성명<span className="ml-0.5 text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  placeholder="참가자 성명"
                  maxLength={40}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  성별<span className="ml-0.5 text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => {
                    const on = row.gender === g.key;
                    return (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => patch(i, { gender: g.key })}
                        aria-pressed={on}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          on
                            ? 'border-purple bg-purple text-white'
                            : 'border-gray-300 bg-white text-navy hover:border-gray-400'
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    나이(만)<span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.age}
                    onChange={(e) => patch(i, { age: digits(e.target.value).slice(0, 3) })}
                    placeholder="세"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    신장<span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.height_cm}
                    onChange={(e) => patch(i, { height_cm: digits(e.target.value).slice(0, 3) })}
                    placeholder="cm"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    몸무게<span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.weight_kg}
                    onChange={(e) => patch(i, { weight_kg: digits(e.target.value).slice(0, 3) })}
                    placeholder="kg"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  서핑 경험<span className="ml-0.5 text-red-500">*</span>
                </label>
                <select
                  value={row.surf_exp}
                  onChange={(e) =>
                    patch(i, { surf_exp: e.target.value as ParticipantRow['surf_exp'] })
                  }
                  className={inputCls}
                >
                  <option value="">선택해 주세요</option>
                  {SURF_EXP.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  신청 프로그램<span className="ml-0.5 text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {PROGRAMS.map((p) => {
                    // 마감(전원 공통)과 자격 미달(참가자별)은 다른 축이지만,
                    // 체크박스 입장에서는 똑같이 "고를 수 없음"이다.
                    const closedReason = closedPrograms[p.key];
                    const disabled = (p.key === 'lesson' && !eligible) || closedReason != null;
                    const checked = row.programs.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                          disabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-navy/40'
                            : checked
                              ? 'cursor-pointer border-purple bg-purple/5'
                              : 'cursor-pointer border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(e) => toggleProgram(i, p.key, e.target.checked)}
                          className="mt-1 shrink-0"
                        />
                        <span>
                          <span className="font-medium">{p.label}</span>
                          {closedReason && (
                            <span className="ml-1.5 inline-block rounded bg-sunset/15 px-1.5 py-0.5 text-[11px] font-bold text-sunset align-middle">
                              접수 마감
                            </span>
                          )}
                          {p.hint && (
                            <span className="block text-xs text-navy/50">{p.hint}</span>
                          )}
                          {closedReason && (
                            <span className="mt-0.5 block text-xs font-medium text-sunset">
                              {closedReason}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!eligible && <p className="text-xs text-sunset">{INELIGIBLE_REASON}</p>}
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={value.length >= max}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple px-4 py-2.5 text-sm font-bold text-purple transition hover:bg-purple hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
        >
          + 참가자 추가
        </button>
        <p className="text-xs text-navy/50">
          한 번에 최대 {max}명까지 신청할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
