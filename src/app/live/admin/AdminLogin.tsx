'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function AdminLogin() {
  const [error, action, pending] = useActionState(login, '');
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4">
      <form action={action} className="w-full max-w-sm rounded-2xl border border-navy/15 bg-white p-8">
        <h1 className="text-xl font-extrabold text-ocean">라이브 경품 관리자</h1>
        <input
          type="password"
          name="password"
          autoFocus
          className="mt-6 w-full rounded-xl border border-navy/20 px-4 py-3 outline-none focus:border-teal"
          placeholder="비밀번호"
        />
        {error && <p className="mt-3 text-sm font-semibold text-sunset">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-xl bg-ocean py-3 font-bold text-white disabled:opacity-60"
        >
          {pending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </main>
  );
}
