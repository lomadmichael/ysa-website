"use client";

import { useId, useState } from "react";
import { joinEnglishName, splitEnglishName } from "@/lib/english-name";

const inputCls =
  "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple";

/**
 * 영문명 2칸 입력 (이름 / 성). 입력값은 즉시 대문자로 바뀐다.
 * 부모에는 기존 단일 문자열 "GILDONG HONG" 형태로 onChange 한다.
 * 외부 value 가 바뀌면(프리필 등) 그때만 다시 나눠 표시한다.
 */
export default function EnglishNameInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  const [parts, setParts] = useState(() => splitEnglishName(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // 외부 값이 바뀌었을 때만 재분할 (자기가 보낸 값이면 타이핑 중이므로 그대로 둔다)
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== joinEnglishName(parts.given, parts.family)) {
      setParts(splitEnglishName(value));
    }
  }

  function update(field: "given" | "family", raw: string) {
    const next = { ...parts, [field]: raw.toUpperCase() };
    setParts(next);
    onChange(joinEnglishName(next.given, next.family));
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor={`${id}-given`} className="block text-xs text-navy/60">
            영문 이름 (Given name)
          </label>
          <input
            id={`${id}-given`}
            type="text"
            required={required}
            autoComplete="given-name"
            autoCapitalize="characters"
            spellCheck={false}
            value={parts.given}
            onChange={(e) => update("given", e.target.value)}
            placeholder="GILDONG"
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-family`} className="block text-xs text-navy/60">
            영문 성 (Surname)
          </label>
          <input
            id={`${id}-family`}
            type="text"
            required={required}
            autoComplete="family-name"
            autoCapitalize="characters"
            spellCheck={false}
            value={parts.family}
            onChange={(e) => update("family", e.target.value)}
            placeholder="HONG"
            className={inputCls}
          />
        </div>
      </div>
      <p className="text-xs text-navy/50">
        여권과 같은 철자로 적어 주세요. 자격증 카드에는 「GILDONG HONG」처럼
        이름-성 순서로 인쇄됩니다.
      </p>
    </div>
  );
}
