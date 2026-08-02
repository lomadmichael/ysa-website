import Image from "next/image";
import Link from "next/link";
import applyTitle2026 from "../../../public/images/festival/apply_title_2026.jpg";

/**
 * 대회 접수 페이지 상단 — 타이틀 배너 + 접수 전 안내.
 * 종목별 일정·장소는 폼의 부문 선택 목록과 /festival 안내 페이지에 이미 있어
 * 중복 노출을 뺐다 (형님 확정 2026-08-02).
 */

const NOTICES: { icon: string; text: React.ReactNode }[] = [
  {
    icon: "📌",
    text: (
      <>
        올해는 <strong className="text-navy">선착순 접수가 아니며, 접수 인원 제한이 없습니다.</strong>{" "}
        접수 기간 내에 신청해 주세요.
      </>
    ),
  },
  {
    icon: "📌",
    text: (
      <>
        여러 종목에 함께 신청할 수 있으며,{" "}
        <strong className="text-navy">참가비는 선택한 종목 수만큼 합산</strong>됩니다.
      </>
    ),
  },
  {
    icon: "📌",
    text: (
      <>
        비기너 부문은 <strong className="text-navy">2023년 1월 1일 이후 서핑 입문자</strong>만 참가할
        수 있습니다. (입상 후 그 이전 입문이 확인되면 입상 자격이 박탈됩니다)
      </>
    ),
  },
  {
    icon: "📌",
    text: (
      <>
        참가비 입금까지 확인되면 최종 확정됩니다. 자세한 입금 안내는{" "}
        <strong className="text-navy">이 페이지 맨 아래</strong>를 확인해 주세요.
      </>
    ),
  },
];

export default function CompetitionBrief() {
  return (
    <section className="mb-10 space-y-6">
      {/* 타이틀 배너 (주최·주관·후원 포함) */}
      <Image
        src={applyTitle2026}
        alt="2026 양양 서핑 페스티벌 & 대한서핑협회장배 서핑대회 — 주최 양양군, 주관 양양군서핑협회·대한서핑협회"
        placeholder="blur"
        sizes="(min-width: 768px) 768px, 100vw"
        className="w-full rounded-2xl"
        priority
      />

      {/* 접수 안내 */}
      <div className="rounded-2xl border border-ocean/15 bg-ocean/5 p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">접수 전 확인해 주세요</h2>
        <ul className="space-y-2.5">
          {NOTICES.map((n, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-navy/70">
              <span className="shrink-0" aria-hidden="true">
                {n.icon}
              </span>
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-ocean/10 pt-4 text-xs text-navy/50">
          대회 전체 안내는{" "}
          <Link
            href="/festival"
            className="font-medium text-ocean underline underline-offset-2 hover:text-ocean/80"
          >
            서핑페스티벌·대회 페이지
          </Link>
          에서 확인하실 수 있습니다.
        </p>
      </div>
    </section>
  );
}
