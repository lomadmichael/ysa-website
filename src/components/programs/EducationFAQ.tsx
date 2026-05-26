/**
 * 심판/강사 교육 공통 FAQ 섹션
 * - 차수 변경 / 취소 / 대기 자동 전환 / 당일 결석 안내
 * - HTML <details>로 collapsible 구현 (JS 불필요, SEO·접근성 친화)
 */

const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: '신청한 차수를 다른 회차로 옮기고 싶어요',
    a: (
      <>
        <a
          href="https://golineup.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ocean underline underline-offset-2 hover:text-ocean/80"
        >
          golineup.kr
        </a>{' '}
        에 신청 시 입력하신 이메일로 회원가입하시면 마이페이지에서 직접 차수 변경이 가능합니다.
        문제가 있을 경우 협회 대표번호로 연락주세요.
      </>
    ),
  },
  {
    q: '신청을 취소하고 싶어요',
    a: (
      <>
        <a
          href="https://golineup.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ocean underline underline-offset-2 hover:text-ocean/80"
        >
          golineup.kr
        </a>{' '}
        회원가입 후 마이페이지에서 직접 취소할 수 있습니다. 본 교육은 <strong>무료 교육</strong>이라
        별도 환불 절차는 없습니다. 다른 신청자가 자리를 이용할 수 있도록 가급적 빨리 취소해주세요.
      </>
    ),
  },
  {
    q: '대기 접수했는데 언제 확정되나요?',
    a: (
      <>
        확정자가 취소하면 대기 순번에 따라 <strong>자동으로 참가자로 전환</strong>되며,
        입력하신 연락처로 <strong>알림톡</strong>이 발송됩니다.
        별도 재접수는 필요하지 않습니다.
      </>
    ),
  },
  {
    q: '교육 당일 갑자기 못 가게 됐어요',
    a: (
      <>
        가능한 빨리 협회 대표번호{' '}
        <a
          href="tel:033-671-6155"
          className="text-ocean underline underline-offset-2 hover:text-ocean/80"
        >
          033-671-6155
        </a>{' '}
        로 연락주세요. 무단 결석 시 다음 교육 신청에 제한이 있을 수 있습니다.
      </>
    ),
  },
];

export default function EducationFAQ() {
  return (
    <section id="faq" className="mt-16 scroll-mt-24">
      <h2 className="text-2xl font-bold text-navy mb-2">자주 묻는 질문</h2>
      <p className="text-sm text-navy/60 mb-6">
        차수 변경·취소·대기 자동 전환 등 자주 묻는 사항을 정리했습니다.
      </p>
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group rounded-xl border border-foam bg-white open:border-ocean/30 open:shadow-sm transition-colors"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none [&::-webkit-details-marker]:hidden">
              <span className="text-sm md:text-base font-medium text-navy flex items-start gap-3">
                <span className="text-ocean shrink-0">Q.</span>
                {item.q}
              </span>
              <svg
                className="w-4 h-4 text-navy/40 shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="px-5 pb-5 pt-1 text-sm text-navy/70 leading-relaxed flex gap-3">
              <span className="text-teal font-semibold shrink-0">A.</span>
              <div className="flex-1">{item.a}</div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
