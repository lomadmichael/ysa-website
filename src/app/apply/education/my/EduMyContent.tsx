import Link from 'next/link';
import type { EduApplication } from '@/lib/edu-db';
import { EDU_COMMON, certLabel, maskPhone } from '@/lib/edu-format';
import EduApplicationCard from './EduApplicationCard';
import { logoutEduMy } from './actions';

/**
 * 본인 인증 후 화면 본문 (인증 바 · 취소 완료 알림 · 신청 카드 목록 · 빈 상태).
 * page.tsx 에서 조회 결과를 넘겨받아 그리기만 한다.
 */
export default function EduMyContent({
  phone,
  applications,
  loadError,
  cancelledId,
}: {
  phone: string;
  applications: EduApplication[];
  loadError?: string;
  /** `?cancelled=<id>` — 본인 목록에 있고 실제로 취소 상태인 건만 알림을 띄운다 */
  cancelledId?: string;
}) {
  const justCancelled = cancelledId
    ? applications.find((a) => a.id === cancelledId && a.status === 'cancelled')
    : undefined;

  return (
    <div className="space-y-6">
      {/* 인증 바 */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <p className="flex min-w-0 items-center gap-2 text-sm text-navy/70">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--color-teal) 14%, transparent)',
              color: 'var(--color-teal)',
            }}
            aria-hidden="true"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          <span className="truncate">
            본인 인증됨 · <span className="font-semibold tabular-nums text-navy">{maskPhone(phone)}</span>
          </span>
        </p>
        <form action={logoutEduMy}>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-navy/70 transition hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>

      {/* 취소 완료 알림 (쿼리스트링으로 유지 → 새로고침해도 남는다) */}
      {justCancelled && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-teal) 35%, transparent)',
            background: 'color-mix(in srgb, var(--color-teal) 8%, white)',
          }}
        >
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: 'var(--color-teal)' }}
            aria-hidden="true"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy">
              {justCancelled.round}차 {certLabel(justCancelled.cert_type)} 신청이 취소되었습니다.
            </p>
            <p className="mt-0.5 text-navy/60">
              다시 참여하시려면 접수 페이지에서 새로 신청해 주세요.
            </p>
          </div>
          <Link
            href="/apply/education/my"
            className="shrink-0 rounded-md px-1.5 text-lg leading-none text-navy/40 transition hover:text-navy/70"
            aria-label="알림 닫기"
          >
            ×
          </Link>
        </div>
      )}

      {loadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {loadError}
        </p>
      )}

      {!loadError && applications.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-navy">
            이 번호로 접수된 심판·강사교육 신청이 없습니다
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-navy/60">
            아직 신청하지 않으셨거나 이미 종료된 교육일 수 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/apply/referee"
              className="inline-flex items-center justify-center rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90"
            >
              심판교육 접수
            </Link>
            <Link
              href="/apply/instructor"
              className="inline-flex items-center justify-center rounded-lg border border-purple px-5 py-2.5 text-sm font-bold text-purple transition hover:bg-purple/5"
            >
              강사교육 접수
            </Link>
          </div>
        </div>
      )}

      {applications.length > 0 && (
        <ul className="space-y-5">
          {applications.map((app) => (
            <li key={app.id}>
              <EduApplicationCard app={app} highlight={app.id === justCancelled?.id} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-navy/50">
        문의 양양군서핑협회{' '}
        <a href={`tel:${EDU_COMMON.inquiryTel}`} className="font-semibold text-navy/70">
          {EDU_COMMON.inquiryTel}
        </a>
      </p>
    </div>
  );
}
