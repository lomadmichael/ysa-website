import type { ReactNode } from 'react';
import type { EduApplication } from '@/lib/edu-db';
import {
  EDU_COMMON,
  certLabel,
  eduDetail,
  formatCancelDeadline,
  formatKstDateTime,
  formatRange,
  formatSchedule,
} from '@/lib/edu-format';
import CancelButton from './CancelButton';

/**
 * 심판·강사교육 신청 카드 (서버 컴포넌트, 취소 버튼만 클라이언트).
 * 사실 값(장소·시간·준비물·참가비)은 lib/edu-format 의 상수에서만 가져온다.
 */

type Tone = 'confirmed' | 'waitlisted' | 'cancelled';

const TONE: Record<Tone, { accent: string; badge: string }> = {
  confirmed: { accent: 'teal', badge: '확정' },
  waitlisted: { accent: 'sunset', badge: '대기' },
  cancelled: { accent: 'gray', badge: '취소됨' },
};

function StatusBadge({ app }: { app: EduApplication }) {
  const tone: Tone = TONE[app.status] ? app.status : 'cancelled';
  const text =
    tone === 'waitlisted' && app.waitlist_order != null
      ? `대기 ${app.waitlist_order}번`
      : TONE[tone].badge;
  if (tone === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
        {text}
      </span>
    );
  }
  const c = `var(--color-${TONE[tone].accent})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} aria-hidden="true" />
      {text}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-3 py-2.5 sm:grid-cols-[5.5rem_1fr]">
      <dt className="text-navy/50">{label}</dt>
      <dd className="font-medium text-navy">{children}</dd>
    </div>
  );
}

/** 상태별 안내 띠 */
function Notice({ app }: { app: EduApplication }) {
  if (app.status === 'cancelled') {
    return (
      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
        취소된 신청입니다. 다시 참여하시려면 접수 페이지에서 새로 신청해 주세요.
      </div>
    );
  }

  const blocked = !app.cancellable;
  const deadline = formatCancelDeadline(app.start_date);

  return (
    <div className="space-y-2">
      {app.status === 'waitlisted' && (
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed text-navy/80"
          style={{ background: 'color-mix(in srgb, var(--color-sunset) 8%, transparent)' }}
        >
          <strong className="font-semibold" style={{ color: 'var(--color-sunset)' }}>
            {app.waitlist_order != null ? `대기 ${app.waitlist_order}번입니다.` : '대기 접수 상태입니다.'}
          </strong>{' '}
          자리가 생기면 자동으로 확정되고 알림톡으로 안내드립니다.
        </div>
      )}

      {blocked ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-navy/70">
          {app.cancel_block_reason ?? '온라인 취소가 불가합니다.'}
          <span className="mt-1 block text-navy/60">
            문의{' '}
            <a
              href={`tel:${EDU_COMMON.inquiryTel}`}
              className="font-semibold text-navy underline underline-offset-2"
            >
              {EDU_COMMON.inquiryTel}
            </a>
          </span>
        </div>
      ) : (
        app.status === 'confirmed' &&
        deadline && (
          <div
            className="rounded-xl px-4 py-3 text-sm leading-relaxed text-navy/80"
            style={{ background: 'color-mix(in srgb, var(--color-teal) 8%, transparent)' }}
          >
            <strong className="font-semibold text-navy">{deadline}</strong>까지 취소할 수
            있습니다.
          </div>
        )
      )}
    </div>
  );
}

export default function EduApplicationCard({
  app,
  highlight = false,
}: {
  app: EduApplication;
  /** 방금 취소한 카드 강조 */
  highlight?: boolean;
}) {
  const detail = eduDetail(app.cert_type);
  const label = certLabel(app.cert_type);
  const title = `${label} ${app.round}차`;
  const cancelled = app.status === 'cancelled';
  const applied = formatKstDateTime(app.created_at);
  const name = app.applicant_name?.trim() || null;
  const chipColor = app.cert_type === 'INS' ? 'var(--color-ocean)' : 'var(--color-purple)';

  return (
    <article
      aria-label={`${title} (${cancelled ? '취소됨' : app.status === 'waitlisted' ? '대기' : '확정'})`}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        highlight ? 'border-gray-300 ring-2 ring-gray-200' : 'border-gray-200'
      }`}
    >
      {/* 헤더 */}
      <div className={`px-5 pt-5 sm:px-7 sm:pt-6 ${cancelled ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold"
            style={
              cancelled
                ? { background: '#f3f4f6', color: '#6b7280' }
                : {
                    background: `color-mix(in srgb, ${chipColor} 10%, transparent)`,
                    color: chipColor,
                  }
            }
          >
            {label}
          </span>
          <StatusBadge app={app} />
        </div>
        <h2
          className={`mt-3 text-xl font-bold tracking-tight ${
            cancelled ? 'text-navy/70 line-through decoration-navy/30' : 'text-navy'
          }`}
        >
          {title}
        </h2>
        {detail && <p className="mt-1 text-sm text-navy/55">{detail.subtitle}</p>}
      </div>

      {/* 상세 */}
      <dl
        className={`mx-5 mt-4 divide-y divide-gray-100 border-y border-dashed border-gray-200 text-sm sm:mx-7 ${
          cancelled ? 'opacity-60' : ''
        }`}
      >
        <Row label="일정">{formatSchedule(app.start_date, app.end_date)}</Row>
        <Row label="교육 시간">{EDU_COMMON.hours}</Row>
        <Row label="장소">
          {EDU_COMMON.venue}
          <span className="mt-0.5 block text-xs font-normal text-navy/50">
            {EDU_COMMON.address}
          </span>
        </Row>
        {name && <Row label="신청자">{name}</Row>}
        {applied && <Row label="신청일">{applied}</Row>}
        {detail && <Row label="준비물">{detail.supplies}</Row>}
        <Row label="참가비">{EDU_COMMON.fee}</Row>
      </dl>

      {/* 안내 + 액션 */}
      <div className="space-y-3 px-5 py-5 sm:px-7 sm:py-6">
        <Notice app={app} />
        {!cancelled && app.cancellable && (
          <div className="flex justify-end">
            <CancelButton
              applicationId={app.id}
              title={title}
              schedule={formatRange(app.start_date, app.end_date)}
              applicantName={name}
              confirmed={app.status === 'confirmed'}
            />
          </div>
        )}
      </div>
    </article>
  );
}
