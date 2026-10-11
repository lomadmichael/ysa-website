import Link from "next/link";

/**
 * 심판·강사교육 접수 페이지 상단 — "이미 신청하셨나요?" 안내.
 * 신청서 아래 작은 링크로는 눈에 띄지 않아(2026-10-11 형님 지적) 폼 위에 둔다.
 */
export default function EducationMyBanner() {
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-xl border border-ocean/20 bg-ocean/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-navy">이미 신청하셨나요?</p>
        <p className="mt-0.5 text-sm text-navy/70">
          회원가입 없이 휴대폰 인증만으로 신청 내역을 확인하고 취소할 수 있습니다.
        </p>
      </div>
      <Link
        href="/apply/education/my"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy/90"
      >
        신청 확인·취소 →
      </Link>
    </div>
  );
}
