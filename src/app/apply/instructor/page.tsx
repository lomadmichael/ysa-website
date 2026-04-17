import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "강사교육 접수",
  description:
    "양양군서핑협회 강사인증 교육 접수. 10월 교육 일정으로 9월 접수 예정입니다.",
  alternates: { canonical: "https://ysakorea.com/apply/instructor" },
};

export default function ApplyInstructorPage() {
  return (
    <>
      <PageHeader
        title="강사교육 접수"
        description="양양군서핑협회 강사인증 교육 접수 안내"
        breadcrumbs={[
          { label: "홈", href: "/" },
          { label: "교육 접수", href: "/apply" },
          { label: "강사교육" },
        ]}
      />
      <section className="max-w-2xl mx-auto px-4 py-16 md:py-20">
        <div
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          style={{ animation: "ysaFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <div
            className="px-6 sm:px-10 pt-10 pb-8 text-center"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in srgb, var(--color-sunset) 10%, transparent), transparent)",
            }}
          >
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
              style={{
                background: "var(--color-sunset)",
                boxShadow:
                  "0 10px 30px -10px color-mix(in srgb, var(--color-sunset) 60%, transparent)",
                animation:
                  "ysaScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards",
              }}
            >
              <svg
                className="h-10 w-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              9월 접수 오픈 예정
            </h2>
            <p className="mt-3 text-sm sm:text-base text-navy/60">
              강사인증 교육은 10월 진행 예정으로, 9월에 접수를 시작합니다.
            </p>
          </div>

          <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
              교육 일정 (예정)
            </p>
            <dl className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-navy/50">1차</dt>
                <dd className="text-right font-medium text-navy">
                  2026년 10월 15일(목) ~ 16일(금)
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-navy/50">2차</dt>
                <dd className="text-right font-medium text-navy">
                  2026년 10월 22일(목) ~ 23일(금)
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-navy/50">3차</dt>
                <dd className="text-right font-medium text-navy">
                  2026년 10월 29일(목) ~ 30일(금)
                </dd>
              </div>
            </dl>
          </div>

          <div
            className="border-t border-gray-100 px-6 sm:px-10 py-4 text-xs sm:text-sm leading-relaxed text-navy/70"
            style={{
              background:
                "color-mix(in srgb, var(--color-sunset) 6%, transparent)",
            }}
          >
            접수 오픈 시 홈페이지 · 인스타그램(@ysa_korea)을 통해 공지합니다.
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/50 px-6 sm:px-10 py-5">
            <Link
              href="/programs/instructor"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50 transition"
            >
              강사교육 안내 보기
            </Link>
            <Link
              href="/apply/referee"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple/90 transition"
            >
              심판교육 접수 바로가기
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
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
