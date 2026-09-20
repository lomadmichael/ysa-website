'use client';

import { useActionState } from 'react';
import { submitLiveEntry, type EntryState } from '@/app/live/actions';

const INITIAL: EntryState = { status: 'idle', message: '' };

export default function LiveEntryForm({ isOpen }: { isOpen: boolean }) {
  const [state, action, pending] = useActionState(submitLiveEntry, INITIAL);

  if (state.status === 'ok') {
    return (
      <div className="rounded-2xl border-2 border-teal bg-teal/5 p-6 text-center md:p-8">
        <p className="text-2xl font-bold text-ocean">응모 완료</p>
        <p className="mt-3 leading-relaxed text-navy/75">{state.message}</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-navy/15 bg-foam p-6 text-center md:p-8">
        <p className="text-xl font-bold text-navy">응모가 마감되었습니다</p>
        <p className="mt-2 text-navy/65">당첨자에게는 문자로 안내드립니다.</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-navy/15 bg-white p-6 md:p-8">
      <label className="block">
        <span className="text-sm font-bold text-navy">이름</span>
        <input
          name="name"
          required
          maxLength={20}
          autoComplete="name"
          placeholder="홍길동"
          className="mt-2 w-full rounded-xl border border-navy/20 px-4 py-3 text-lg outline-none focus:border-teal"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-navy">휴대폰 번호</span>
        <input
          name="phone"
          required
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01012345678"
          className="mt-2 w-full rounded-xl border border-navy/20 px-4 py-3 text-lg outline-none focus:border-teal"
        />
        <span className="mt-2 block text-xs text-navy/55">
          당첨 안내 문자를 보내드립니다. 한 번호로 한 번만 응모할 수 있습니다.
        </span>
      </label>

      {state.status === 'error' && (
        <p className="mt-4 rounded-xl bg-sunset/10 px-4 py-3 text-sm font-semibold text-sunset">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-xl bg-sunset py-4 text-lg font-extrabold text-white transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? '응모 중…' : '응모하기'}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-navy/50">
        입력하신 정보는 경품 추첨과 당첨 안내에만 사용하고, 행사 종료 후 파기합니다.
      </p>
    </form>
  );
}
