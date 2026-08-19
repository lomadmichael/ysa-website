import Link from 'next/link';

export interface RuleDoc {
  title: string;
  href: string;
}

/**
 * 대회 규정·서식 블록 — 자료실(/notice/docs)에 올라온 파일을 그대로 링크한다.
 *
 * URL 을 하드코딩하지 않는 이유: 형님이 관리자에서 새 버전 PDF 로 교체하면
 * 저장소 경로가 바뀌는데, 하드코딩해 두면 이 페이지 링크만 조용히 죽는다.
 * 문서 조회는 서버(page.tsx)에서 제목 키워드로 찾아 넘겨 준다.
 */
export default function CompetitionDocs({
  rulebook,
  objection,
}: {
  rulebook: RuleDoc | null;
  objection: RuleDoc | null;
}) {
  return (
    <div className="rounded-2xl border border-foam bg-white p-6 md:p-8">
      <h3 className="text-lg font-bold text-navy md:text-xl">대회 규정·서식</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy/60">
        경기 진행과 판정은 ISA 경기규칙을 따릅니다. 판정에 이의가 있는 경우 아래 신청서를 작성해
        대회 본부에 제출해 주세요.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <DocLink doc={rulebook} label="ISA 경기규칙 룰북" caption="영어 원문 · PDF" />
        <DocLink doc={objection} label="공식 이의제기 신청서" caption="양식 다운로드 · PDF" />
      </div>

      <Link
        href="/notice/docs"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline"
      >
        규정·서식 자료실 전체 보기
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}

/**
 * 규정 문서 버튼.
 * 자료실에 해당 문서가 아직 없으면 링크가 죽는 대신 자료실 목록으로 보낸다.
 */
function DocLink({
  doc,
  label,
  caption,
}: {
  doc: RuleDoc | null;
  label: string;
  caption: string;
}) {
  const cls =
    'group flex flex-1 items-center gap-3 rounded-xl border border-foam bg-sand/40 px-5 py-4 transition-colors hover:border-ocean/30 hover:bg-ocean/5';

  const icon = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    </span>
  );

  if (!doc) {
    return (
      <Link href="/notice/docs" className={cls}>
        {icon}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-navy">{label}</span>
          <span className="block text-xs text-navy/45">자료실에서 확인</span>
        </span>
      </Link>
    );
  }

  return (
    <a href={doc.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {icon}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-navy">{label}</span>
        <span className="block text-xs text-navy/45">{caption}</span>
      </span>
      <svg
        className="ml-auto h-4 w-4 shrink-0 text-navy/30 transition-colors group-hover:text-ocean"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  );
}
