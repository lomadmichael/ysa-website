'use client';

import { useActionState, useState } from 'react';
import { cancelEduMy, type CancelState } from './actions';

const initial: CancelState = { status: 'idle' };

/**
 * [신청 취소] → 확인 단계 → 서버 액션.
 * 번호는 보내지 않는다(서버가 세션 쿠키에서 꺼낸다). 신청 id 만 넘긴다.
 */
export default function CancelButton({
  applicationId,
  label,
}: {
  applicationId: string;
  /** 예: "7차 심판교육" */
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelEduMy, initial);

  if (state.status === 'success') {
    return (
      <p role="status" className="text-sm font-medium text-teal">
        {state.message}
      </p>
    );
  }

  if (!confirming) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          신청 취소
        </button>
        {state.status === 'error' && (
          <p role="alert" className="text-sm text-sunset">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <p className="text-sm leading-relaxed text-red-900">
        {label} 신청을 취소할까요? 취소 후 되돌릴 수 없으며, 자리는 대기자에게 넘어갑니다.
      </p>
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-sunset">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? '취소 중…' : '취소하기'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-gray-50 disabled:opacity-50"
        >
          돌아가기
        </button>
      </div>
    </form>
  );
}
