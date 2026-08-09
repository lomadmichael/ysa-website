import 'server-only';
import { sendAlimtalk } from '@/lib/solapi';
import { getAvailability, type ProgramOutcome } from '@/lib/surfcamp-db';
import {
  ADMIN_ALERT_PHONE,
  lessonTimeLabel,
  regionLabel,
  residentTypeLabel,
} from '@/lib/surfcamp-config';

/**
 * 신규 접수 발생 시 운영 담당자에게 요약 문자.
 *
 * 접수가 이미 성공(커밋)한 뒤에 호출되므로, 여기서 실패해도 접수엔 영향이 없다.
 * (호출부에서 try/catch 로 감싼다)
 *
 * ★ 레퍼런스(ecology-admin-notify.ts)의 Resend 이메일 발송은 제거했다.
 *   이 저장소에는 resend 의존성이 없다. 이메일이 필요해지면 그때 의도적으로 추가할 것.
 */
export async function notifyAdmin(p: {
  repName: string;
  phone: string;
  region: string;
  lessonTime: string;
  residentType: string;
  /** 이 신청서의 총 참가자 수 */
  participantCount: number;
  lesson: ProgramOutcome | null;
  special: ProgramOutcome | null;
  note?: string | null;
}) {
  // 접수 반영 후 기준 잔여석. 실패해도 알림 자체는 보낸다.
  let remainText = '';
  try {
    const av = await getAvailability();
    const restLesson = Math.max(0, av.lesson.capacity - av.lesson.confirmed);
    const restSpecial = Math.max(0, av.special.capacity - av.special.confirmed);
    remainText = `잔여 강습 ${restLesson}석 / 특화 ${restSpecial}석`;
  } catch {
    /* 잔여석 조회 실패는 무시 */
  }

  const mark = (o: ProgramOutcome | null) => {
    if (!o) return '미신청';
    return `${o.count}명 ${o.status === 'confirmed' ? '확정' : '대기'}`;
  };

  const body = [
    '[서핑캠프 신규접수]',
    `${p.repName}님 외 총 ${p.participantCount}명 (${residentTypeLabel(p.residentType)})`,
    `권역 ${regionLabel(p.region)} · 강습시간 ${lessonTimeLabel(p.lessonTime)}`,
    `강습 ${mark(p.lesson)} / 특화 ${mark(p.special)}`,
    `연락처 ${p.phone}`,
    p.note?.trim() ? `비고 ${p.note.trim()}` : '',
    remainText,
  ]
    .filter(Boolean)
    .join('\n');

  return sendAlimtalk({
    to: ADMIN_ALERT_PHONE,
    templateId: 'TMPL_SURFCAMP_ADMIN',
    variables: {},
    fallbackText: body,
  });
}
