'use client';

import { useActionState } from 'react';
import { adminLogin, type AdminLoginState } from './actions';

const INITIAL: AdminLoginState = {};

export default function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, INITIAL);

  return (
    <div className="max-w-[380px] mx-auto px-4 py-20">
      <h1 className="text-xl font-bold text-navy mb-1">2026 양양 서핑캠프 접수 관리</h1>
      <p className="text-sm text-navy/60 mb-6">
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
          className="w-full h-12 px-3 text-[15px] bg-white border border-foam rounded-md outline-none focus:border-teal"
        />
        {state.error && (
          <p role="alert" className="text-[13px] text-sunset">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-md bg-ocean text-white font-bold text-[15px] disabled:opacity-50 hover:bg-ocean-light transition-colors"
        >
          {pending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
