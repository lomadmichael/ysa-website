'use client';

import { useActionState } from 'react';
import { adminLogin, type AdminLoginState } from './actions';

const INITIAL: AdminLoginState = {};

export default function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, INITIAL);

  return (
    <div className="mx-auto max-w-[380px] px-4 py-20">
      <h1 className="mb-1 text-xl font-bold text-navy">
        2026 페스티벌 현장 프로그램 접수 관리
      </h1>
      <p className="mb-6 text-sm text-navy/60">
        운영 담당자 전용 화면입니다. 비밀번호를 입력해 주세요.
      </p>
      <form action={action} className="space-y-3">
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="관리자 비밀번호"
          required
          aria-label="관리자 비밀번호"
          className="h-12 w-full rounded-md border border-foam bg-white px-3 text-[15px] outline-none focus:border-teal"
        />
        {state.error && (
          <p role="alert" className="text-[13px] text-sunset">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-md bg-ocean text-[15px] font-bold text-white transition-colors hover:bg-ocean-light disabled:opacity-50"
        >
          {pending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
