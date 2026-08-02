import {
  DEPOSIT_ACCOUNT,
  ENTRY_FEE_PER_DIVISION,
  formatKrw,
} from "@/lib/festival-2026";
import CopyButton from "./CopyButton";

const NOTES = [
  "입금자명은 반드시 선수 이름과 동일해야 합니다.",
  "입금 확인은 실시간이 아닌 매일 정오(12시)와 오후 6시에 확인되며, 확정 시 알림톡이 발송됩니다.",
  "선수 등록 최종 확정 이후 개인사정으로 인한 환불은 불가합니다.",
  "대회 관련 알림톡은 알림 운영대행사인 로마드협동조합을 통해 발송됩니다.",
];

/**
 * 참가비 입금 안내 (문구 확정 — 임의 변형 금지)
 *
 * `selectedCount` / `total`을 넘기면 선택 종목 수와 합계 금액을 함께 노출한다.
 * 상호작용은 계좌번호 복사 버튼(CopyButton)만 클라이언트로 분리되어 있다.
 */
export default function DepositNotice({
  selectedCount,
  total,
  className = "",
}: {
  selectedCount?: number;
  total?: number;
  className?: string;
}) {
  const showTotal = typeof total === "number" && total > 0;

  return (
    <section
      className={`rounded-2xl border border-sunset/25 bg-sunset/5 p-5 sm:p-6 ${className}`}
    >
      <h2 className="flex items-center gap-2 text-base font-bold text-navy sm:text-lg">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sunset/15 text-sm"
          aria-hidden="true"
        >
          💳
        </span>
        참가비 입금 안내
      </h2>

      <div className="mt-4 rounded-xl border border-sunset/20 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/40">
              입금 계좌
            </p>
            <p className="mt-1 select-all font-mono text-lg font-bold tracking-tight text-navy sm:text-xl">
              {DEPOSIT_ACCOUNT.number}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-navy/70">
              {DEPOSIT_ACCOUNT.bank} · {DEPOSIT_ACCOUNT.holder}
            </p>
          </div>
          <CopyButton
            value={`${DEPOSIT_ACCOUNT.bank} ${DEPOSIT_ACCOUNT.number} ${DEPOSIT_ACCOUNT.holder}`}
            label="계좌 복사"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed border-gray-200 pt-3">
          <span className="text-sm font-semibold text-navy">
            종목당 {formatKrw(ENTRY_FEE_PER_DIVISION)}원
          </span>
          {showTotal && (
            <span className="text-sm text-navy/70">
              {typeof selectedCount === "number" && selectedCount > 0 && (
                <>선택 {selectedCount}종목 · </>
              )}
              합계{" "}
              <strong className="text-base font-bold text-sunset">
                {formatKrw(total)}원
              </strong>
            </span>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-xs leading-relaxed text-navy/75 sm:text-sm">
        {NOTES.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true">✔️</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
