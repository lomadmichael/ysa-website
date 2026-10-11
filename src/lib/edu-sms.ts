import 'server-only';
import { sendAlimtalk } from '@/lib/solapi';

/**
 * 심판·강사교육 본인조회 인증번호 문자.
 *
 * templateId 는 "TMPL_" 플레이스홀더 → solapi.ts 가 감지해 fallbackText 를 일반 SMS 로 보낸다.
 * 형식은 서핑캠프 OTP 문자(surfcamp-sms.ts)와 같다.
 */
const HEAD = '[양양군서핑협회] 심판·강사교육';

export async function sendEduOtpSms(phone: string, code: string) {
  return sendAlimtalk({
    to: phone,
    templateId: 'TMPL_EDU_OTP',
    variables: {},
    fallbackText: `${HEAD}\n본인조회 인증번호 ${code} (5분 내 입력)\n타인에게 알려주지 마세요.`,
  });
}
