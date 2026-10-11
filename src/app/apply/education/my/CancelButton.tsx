'use client';

import { useActionState, useEffect, useRef } from 'react';
import { cancelEduMy, type CancelState } from './actions';

const initial: CancelState = { status: 'idle' };

/**
 * [신청 취소] → 확인 모달(<dialog>) → 서버 액션.
 *
 * - 번호는 보내지 않는다(서버가 세션 쿠키에서 꺼낸다). 신청 id 만 넘긴다.
 * - 성공하면 서버 액션이 `?cancelled=<id>` 로 redirect → 페이지가 카드를 '취소됨'으로,
 *   상단에 성공 알림을 계속 띄운다(새로고침해도 유지).
 * - 접근성: showModal() 이 포커스를 모달 안으로 가두고 ESC 로 닫힌다.
 *   열리면 [돌아가기]에 포커스(실수로 Enter 를 눌러도 취소되지 않게), 닫히면 원래 버튼으로 복귀.
 */
export default function CancelButton({
  applicationId,
  title,
  schedule,
  applicantName,
  confirmed,
}: {
  applicationId: string;
  /** 예: "심판교육 7차" */
  title: string;
  /** 예: "10월 24일(토) ~ 25일(일)" */
  schedule: string;
  applicantName?: string | null;
  /** 확정 건이면 "자리는 대기자에게 넘어갑니다" 안내를 넣는다 */
  confirmed: boolean;
}) {
  const [state, action, pending] = useActionState(cancelEduMy, initial);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const titleId = `cancel-title-${applicationId}`;
  const descId = `cancel-desc-${applicationId}`;

  const open = () => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.showModal();
    backRef.current?.focus();
  };
  const close = () => {
    if (pending) return;
    dialogRef.current?.close();
  };

  // 처리 중에는 ESC 로 닫히지 않게 막는다.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      if (pending) e.preventDefault();
    };
    const onClose = () => openerRef.current?.focus();
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onClose);
    return () => {
      d.removeEventListener('cancel', onCancel);
      d.removeEventListener('close', onClose);
    };
  }, [pending]);

  const notices = [
    '취소 후에는 되돌릴 수 없습니다.',
    ...(confirmed ? ['취소한 자리는 대기자에게 자동으로 넘어갑니다.'] : []),
    '다시 참여하시려면 새로 신청해야 하며, 정원이 찼으면 대기로 접수됩니다.',
  ];

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        신청 취소
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => {
          // 바깥(backdrop) 클릭 시 닫기
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-navy shadow-2xl backdrop:bg-navy/50 backdrop:backdrop-blur-[2px]"
      >
        <form action={action}>
          <input type="hidden" name="applicationId" value={applicationId} />

          <div className="px-6 pt-6 sm:px-7 sm:pt-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            </div>
            <h2 id={titleId} className="mt-4 text-lg font-bold text-navy">
              신청을 취소할까요?
            </h2>

            <div className="mt-4 rounded-xl bg-foam/70 px-4 py-3 text-sm">
              <p className="font-semibold text-navy">{title}</p>
              <p className="mt-0.5 text-navy/70">
                {schedule}
                {applicantName ? ` · 신청자 ${applicantName}` : ''}
              </p>
            </div>

            <ul id={descId} className="mt-4 space-y-2 text-sm leading-relaxed text-navy/75">
              {notices.map((n) => (
                <li key={n} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"
                  />
                  <span>{n}</span>
                </li>
              ))}
            </ul>

            {state.status === 'error' && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {state.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 bg-sand/60 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              ref={backRef}
              type="button"
              onClick={close}
              disabled={pending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-gray-50 disabled:opacity-50"
            >
              돌아가기
            </button>
            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {pending ? '취소 처리 중…' : '신청 취소하기'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
