import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "교육 접수",
  description:
    "양양군서핑협회 심판/강사 인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다.",
  alternates: { canonical: "https://ysakorea.com/apply" },
};

export const revalidate = 60;

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ??
  "https://cert-manager-taupe.vercel.app";

interface Schedule {
  id: string;
  cert_type: "REF" | "INS";
  round: number;
  start_date: string;
  end_date: string;
  capacity: number;
  current_count: number;
  waitlist_count: number;
  status: string;
}

async function fetchSchedules(): Promise<Schedule[]> {
  try {
    const res = await fetch(`${CERT_API}/api/public/schedules`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { schedules?: Schedule[] };
    return data.schedules ?? [];
  } catch {
    return [];
  }
}

export default async function ApplyPage() {
  const schedules = await fetchSchedules();
  const refCount = schedules.filter((s) => s.cert_type === "REF").length;

  return (
    <>
      <PageHeader
        title="교육 접수"
        description="양양군서핑협회 심판/강사 인증 교육 온라인 접수. 회원가입 없이 신청 가능합니다."
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "교육 접수" },
        ]}
      />
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProgramCard
            href="/apply/referee"
            accent="teal"
            eyebrow="REFEREE"
            title="심판교육 접수"
            description="2026년 5월~6월 총 7회차 진행"
            statusLabel={`${refCount > 0 ? `${refCount}개 회차 접수 중` : "접수 준비 중"}`}
            active={refCount > 0}
            cta="접수하기"
            icon={
              <svg
                className="h-9 w-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 2v4M16 2v4" />
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            }
          />
          <ProgramCard
            href="/apply/instructor"
            accent="sunset"
            eyebrow="INSTRUCTOR"
            title="강사교육 접수"
            description="2026년 10월 진행 예정"
            statusLabel="9월 접수 오픈 예정"
            active={false}
            cta="자세히 보기"
            icon={
              <svg
                className="h-9 w-9 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
          />
        </div>

        <p className="mt-8 text-center text-xs text-navy/50">
          교육 안내 상세는{" "}
          <Link
            href="/programs/referee"
            className="underline underline-offset-2 hover:text-navy"
          >
            심판교육
          </Link>
          {" · "}
          <Link
            href="/programs/instructor"
            className="underline underline-offset-2 hover:text-navy"
          >
            강사교육
          </Link>{" "}
          페이지를 참고하세요.
        </p>
      </section>
    </>
  );
}

function ProgramCard({
  href,
  accent,
  eyebrow,
  title,
  description,
  statusLabel,
  active,
  cta,
  icon,
}: {
  href: string;
  accent: "teal" | "sunset";
  eyebrow: string;
  title: string;
  description: string;
  statusLabel: string;
  active: boolean;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="px-6 pt-8 pb-7"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${accent}) 10%, transparent), transparent)`,
        }}
      >
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-md"
          style={{
            background: `var(--color-${accent})`,
            boxShadow: `0 8px 20px -8px color-mix(in srgb, var(--color-${accent}) 55%, transparent)`,
          }}
        >
          {icon}
        </div>
        <p
          className="mb-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: `var(--color-${accent})` }}
        >
          {eyebrow}
        </p>
        <h3 className="text-xl font-bold text-navy">{title}</h3>
        <p className="mt-1.5 text-sm text-navy/60">{description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-6 py-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: active
              ? `color-mix(in srgb, var(--color-${accent}) 12%, transparent)`
              : "color-mix(in srgb, #64748b 10%, transparent)",
            color: active ? `var(--color-${accent})` : "#475569",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: active ? `var(--color-${accent})` : "#64748b",
            }}
          />
          {statusLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy group-hover:gap-1.5 transition-all">
          {cta}
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
