import Image from "next/image";
import Link from "next/link";
import applyTitle2026 from "../../../public/images/festival/apply_title_2026.jpg";

/**
 * 대회 접수 페이지 상단 안내 — 포스터 + 종목별 일정·장소 + 접수 안내.
 * 신청자가 폼을 채우기 전에 "무슨 대회를, 언제, 어디서" 를 먼저 확인할 수 있게 한다.
 * (형님 요청 2026-08-02 — 작년 walla 폼 상단 구성 참고)
 */

interface BriefGroup {
  title: string;
  venue: string;
  schedule: string;
  scheduleNote?: string;
  divisions: string;
}

const GROUPS: BriefGroup[] = [
  {
    title: "비기너 서핑대회",
    venue: "죽도해변",
    schedule: "8월 29일(토) ~ 30일(일)",
    scheduleNote: "기상 상황에 따라 9월 첫째주로 변경 가능",
    divisions: "남자부 · 여자부",
  },
  {
    title: "코리아 오픈 — SUP 레이싱",
    venue: "죽도해변",
    schedule: "8월 29일(토) ~ 30일(일)",
    scheduleNote: "기상 상황에 따라 9월 첫째주로 변경 가능",
    divisions: "스프린터 · 테크니컬 · 롱 디스턴스 (각 남 / 여)",
  },
  {
    title: "코리아 오픈 — 숏보드 · 롱보드 · SUP 서핑",
    venue: "숏보드 기사문해변 · 롱보드 설악해변 · SUP 서핑 물치해변",
    schedule: "8월 29일 ~ 11월 중 파도가 좋은 날 순차 진행",
    scheduleNote: "파도 상황에 따라 장소 및 일정이 유동적으로 조정될 수 있습니다",
    divisions: "숏보드 · 롱보드 · SUP 서핑 (각 남 / 여)",
  },
];

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

      {/* 종목별 일정·장소 */}
      <div className="rounded-2xl border border-foam bg-white p-5 sm:p-6">
        <h2 className="mb-1 text-lg font-bold text-navy">대회 안내</h2>
        <p className="mb-5 text-sm text-navy/60">
          2026 양양서핑페스티벌과 함께 열리는 대한서핑협회장배 서핑대회입니다.
        </p>

        <div className="divide-y divide-foam">
          {GROUPS.map((g) => (
            <div key={g.title} className="py-4 first:pt-0 last:pb-0">
              <h3 className="mb-2 text-sm font-bold text-navy sm:text-base">{g.title}</h3>
              <dl className="space-y-1.5 text-sm">
                <BriefRow label="📍 장소" value={g.venue} />
                <BriefRow label="🗓 일정" value={g.schedule} note={g.scheduleNote} />
                <BriefRow label="🏆 종목" value={g.divisions} />
              </dl>
            </div>
          ))}
        </div>
      </div>

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

function BriefRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-navy/50 sm:w-16">{label}</dt>
      <dd className="text-navy/80">
        {value}
        {note && <span className="mt-0.5 block text-xs text-navy/45">※ {note}</span>}
      </dd>
    </div>
  );
}
