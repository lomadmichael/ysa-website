"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const INITIAL: LoginState = {};

export default function AdminLogin() {
  const [state, action, pending] = useActionState(loginAction, INITIAL);

  return (
    <form
      action={action}
      className="mx-auto max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-lg font-bold text-navy">랜드서핑 성과공유회 관리자</h1>
      <input
        type="password"
        name="password"
        required
        autoFocus
        placeholder="비밀번호"
        className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal px-4 py-3 font-bold text-white transition hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
