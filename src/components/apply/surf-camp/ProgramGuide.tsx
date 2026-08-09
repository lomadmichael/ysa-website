import Image from 'next/image';
import Link from 'next/link';
import {
  DEFAULT_CAPACITY,
  EVENT,
  INQUIRY_TEL,
  LESSON_MIN_AGE,
  LESSON_TIMES,
  LESSON_YOUTH_AGE,
  LESSON_YOUTH_HEIGHT,
  MAX_PARTICIPANTS,
  REGIONS,
  SMS_SENDER_ORG,
  programLabel,
} from '@/lib/surfcamp-config';
import type { SurfcampAvailability } from '@/lib/surfcamp-db';
import campImage from '../../../../public/images/surf-camp/camp.jpg';

/**
 * 폼 위에 놓이는 프로그램·접수 안내 섹션.
 *
 * 접수가 닫혀 있어도 보여야 하므로 폼(SurfCampForm)과 분리된 서버 컴포넌트다.
 * 문구의 원본 값은 모두 surfcamp-config 에서 가져온다.
 */

const MY_PAGE = '/apply/surf-camp/my';

/** '13:00 / 15:00' — 시간무관(any)은 안내 문구에서 제외 */
const LESSON_TIME_LABELS = LESSON_TIMES.filter((t) => t.key !== 'any')
  .map((t) => t.label)
  .join(' / ');

const REGION_LABELS = REGIONS.map((r) => r.label).join(' · ');

interface GuideRow {
  label: string;
  value: string;
}

/** 정원은 DB(surfcamp.config) 값이 진실이다. 관리자가 정원을 바꾸면 안내문도 함께 따라간다. */
const lessonRows = (capacity: number): GuideRow[] => [
  {
    label: '일정',
    value: `${EVENT.lessonDateLabel} ${LESSON_TIME_LABELS} 중 1개 시간대를 선택합니다.`,
  },
  {
    label: '대상',
    value: `만 ${LESSON_MIN_AGE}세 이상 신청하실 수 있습니다. 만 ${LESSON_YOUTH_AGE}세 미만이거나 신장 ${LESSON_YOUTH_HEIGHT}cm 미만이신 분도 신청하실 수 있으며, 저연령 강습이 가능한 서핑스쿨로 배정해 드립니다.`,
  },
  { label: '정원', value: `${capacity}명 (선착순)` },
  {
    label: '진행',
    value: '5~7명 소그룹 강습으로 진행하며, 강습 전 안전교육을 실시합니다.',
  },
  {
    label: '장비',
    value: '보드와 웨트수트를 제공합니다. 신청 시 적어주신 신장·몸무게로 준비합니다.',
  },
  {
    label: '배정',
    value: `희망 권역(${REGION_LABELS})과 시간을 선택해 신청하시면, 신청 현황과 안전 운영을 고려해 운영본부가 최종 서핑스쿨을 배정합니다.`,
  },
];

const specialRows = (capacity: number): GuideRow[] => [
  { label: '일정', value: `${EVENT.specialDateLabel}` },
  { label: '내용', value: EVENT.specialTitle },
  { label: '대상', value: '나이·신장 제한이 없어 누구나 참여할 수 있습니다.' },
  { label: '정원', value: `${capacity}명 (선착순)` },
  {
    label: '신청',
    value:
      '서핑강습과 별개로 신청하는 선택형 프로그램입니다. 서핑강습을 신청하지 않아도 참여할 수 있으며, 서핑강습 신청자에게 우선 안내드립니다.',
  },
  {
    label: '회차',
    value: '세부 회차와 장소는 확정 후 개별 안내드립니다.',
  },
];

export default function ProgramGuide({
  availability,
}: {
  availability?: SurfcampAvailability;
}) {
  const capLesson = availability?.lesson.capacity ?? DEFAULT_CAPACITY.lesson;
  const capSpecial = availability?.special.capacity ?? DEFAULT_CAPACITY.special;

  return (
    <section className="mx-auto max-w-3xl px-4 pt-10 md:pt-14">
      {/* 섹션 헤더 */}
      <div className="grid gap-5 sm:grid-cols-[1fr_11rem] sm:items-center">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-ocean)' }}
          >
            Program
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-navy md:text-2xl">
            프로그램 안내
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            {EVENT.name}는 두 가지 프로그램으로 운영합니다. 아래 내용을 확인하신 뒤
            신청해 주세요.
          </p>
        </div>
        <Image
          src={campImage}
          alt="서핑캠프 저녁 캠프파이어 일러스트"
          sizes="(min-width: 640px) 176px, 100vw"
          className="h-32 w-full rounded-2xl object-cover sm:h-28"
        />
      </div>

      {/* 프로그램 2종 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProgramCard
          accent="var(--color-ocean)"
          title={programLabel('lesson')}
          capacity={`정원 ${capLesson}명`}
          rows={lessonRows(capLesson)}
        />
        <ProgramCard
          accent="var(--color-teal)"
          title="특화 체험프로그램"
          capacity={`정원 ${capSpecial}명`}
          rows={specialRows(capSpecial)}
        />
      </div>

      {/* 가장 헷갈리는 지점 — 두 프로그램의 관계 */}
      <div
        className="mt-4 rounded-2xl border px-5 py-4 text-sm leading-relaxed text-navy/75"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-sunset) 35%, transparent)',
          background: 'color-mix(in srgb, var(--color-sunset) 7%, transparent)',
        }}
      >
        <p className="mb-1 font-bold text-navy">
          두 프로그램은 별개입니다 — 함께 신청해도 되고, 하나만 신청해도 됩니다
        </p>
        서핑강습만 신청하셔도 되고, 특화 체험프로그램만 신청하셔도 됩니다. 두 가지를
        모두 신청하실 수도 있습니다. 신청서에서{' '}
        <strong className="text-navy">참가자 한 분마다 프로그램을 선택</strong>하므로,
        같은 가족 안에서도 참가자별로 다르게 신청할 수 있습니다.
      </div>

      {/* 접수 안내 */}
      <div className="mt-10">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-ocean)' }}
        >
          How to apply
        </p>
        <h2 className="mt-1.5 text-xl font-bold text-navy md:text-2xl">접수 안내</h2>

        <ol className="mt-5 space-y-4">
          <GuideStep step={1} title="접수 방법">
            온라인 선착순 접수입니다. 대표 신청자 한 분이 가족·동반 참가자까지 한 번에
            신청하며(최대 {MAX_PARTICIPANTS}명), 참가자별로 신청할 프로그램을
            선택합니다. 대표 신청자는 연락·접수를 담당하는 분으로{' '}
            <strong className="text-navy">참가자로 자동 등록되지 않으니</strong>, 본인도
            참가하신다면 참가자 정보에 본인을 반드시 추가해 주세요.
          </GuideStep>

          <GuideStep step={2} title="신청 대상">
            양양군민 및 양양 생활인구
          </GuideStep>

          <GuideStep step={3} title="중복 신청 방지">
            휴대폰 번호 한 개당 한 건만 신청할 수 있습니다. 같은 번호로는 다시 접수할
            수 없으니, 함께 참가하실 분을 한 번에 등록해 주세요.
          </GuideStep>

          <GuideStep step={4} title="확정 · 대기">
            정원 안에 들면 즉시 확정되고, 정원을 초과하면 대기로 접수됩니다. 취소가
            발생하면 대기 순번대로 자동 확정되며 문자로 안내드립니다. 신청은 프로그램별로
            가족 전원이 함께 확정되므로,{' '}
            <strong className="text-navy">
              남은 자리보다 인원이 많은 가족은 건너뛰고 다음 순번이 먼저 확정될 수
              있습니다.
            </strong>
          </GuideStep>

          <GuideStep step={5} title="배정 안내">
            최종 서핑스쿨과 장소, 집결 시간, 준비물은 참가가 확정된 뒤 개별
            안내드립니다.
          </GuideStep>

          <GuideStep step={6} title="안내 문자">
            접수·확정·대기 안내 문자는 {EVENT.host} 알림 운영 대행사인{' '}
            <strong className="text-navy">{SMS_SENDER_ORG}</strong> 명의(발신번호
            010-9542-3775)로 발송됩니다. 모르는 번호로 오해하지 마시고 확인해 주세요.
          </GuideStep>

          <GuideStep step={7} title="수정 · 취소">
            <Link
              href={MY_PAGE}
              className="font-semibold text-navy underline underline-offset-2"
            >
              신청 조회
            </Link>{' '}
            페이지에서 휴대폰 인증번호로 본인 확인 후 수정·취소할 수 있습니다.{' '}
            <strong className="text-navy">
              참여가 어려워지셨다면 다른 분을 위해 반드시 사전에 취소해 주세요.
            </strong>
          </GuideStep>

          <GuideStep step={8} title="개인정보 · 초상권 동의">
            접수 시 개인정보 수집·이용과 제3자 제공(배정 서핑스쿨 · {EVENT.host} ·{' '}
            {SMS_SENDER_ORG}), 행사 중 촬영된 사진·영상의 결과보고·홍보 활용에 대한{' '}
            <strong className="text-navy">필수 동의</strong>가 포함됩니다. 자세한 내용은
            신청서의 동의 항목에서 확인하실 수 있습니다.
          </GuideStep>

          <GuideStep step={9} title="유의 사항">
            신청 완료가 곧 참가 확정은 아닙니다. 기상·해상 상황에 따라 일정이 변경되거나
            중단될 수 있으며, 음주하신 경우 안전상 참여하실 수 없습니다.
          </GuideStep>

          <GuideStep step={10} title="문의">
            {INQUIRY_TEL} ({EVENT.organizer})
          </GuideStep>
        </ol>
      </div>
    </section>
  );
}

// ── 로컬 서브컴포넌트 ────────────────────────────────────────────────────────

function ProgramCard({
  accent,
  title,
  capacity,
  rows,
}: {
  accent: string;
  title: string;
  capacity: string;
  rows: GuideRow[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-4"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, ${accent} 10%, transparent), transparent)`,
        }}
      >
        <h3 className="text-base font-bold text-navy">{title}</h3>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            color: accent,
          }}
        >
          {capacity}
        </span>
      </div>
      <dl className="space-y-2.5 border-t border-gray-100 px-5 py-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-semibold text-navy/45">{row.label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-navy/75">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function GuideStep({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{
          background: 'color-mix(in srgb, var(--color-ocean) 10%, transparent)',
          color: 'var(--color-ocean)',
        }}
        aria-hidden="true"
      >
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-navy/70">{children}</p>
      </div>
    </li>
  );
}
