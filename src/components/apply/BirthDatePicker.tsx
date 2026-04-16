"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export default function BirthDatePicker({ value, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split("-");
      setYear(y);
      setMonth(String(parseInt(m)));
      setDay(String(parseInt(d)));
    }
  }, [value]);

  const daysInMonth =
    year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function handleChange(newYear: string, newMonth: string, newDay: string) {
    setYear(newYear);
    setMonth(newMonth);
    setDay(newDay);
    if (newYear && newMonth && newDay) {
      const m = newMonth.padStart(2, "0");
      const d = newDay.padStart(2, "0");
      onChange(`${newYear}-${m}-${d}`);
    }
  }

  const selectCls =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple";

  return (
    <div className="flex gap-2">
      <select
        className={`${selectCls} flex-1`}
        value={year}
        aria-label="출생 연도"
        onChange={(e) => handleChange(e.target.value, month, day)}
      >
        <option value="">년</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}년
          </option>
        ))}
      </select>
      <select
        className={`${selectCls} w-[90px]`}
        value={month}
        aria-label="출생 월"
        onChange={(e) => handleChange(year, e.target.value, day)}
      >
        <option value="">월</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>
      <select
        className={`${selectCls} w-[90px]`}
        value={day}
        aria-label="출생 일"
        onChange={(e) => handleChange(year, month, e.target.value)}
      >
        <option value="">일</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
      </select>
    </div>
  );
}
