/**
 * SOLAPI 알림톡 발송 래퍼.
 * lomad-homepage / cert-manager 의 동일 모듈을 양양군서핑협회 용도로 포팅.
 *
 * 보내는 주체는 SOLAPI_KAKAO_CHANNEL_ID(발신프로필).
 * 같은 SOLAPI 키를 쓰더라도 이 값에 따라 이용자에게 보이는 발신자 이름이 바뀐다.
 */

// 주의: env 값 끝에 줄바꿈/공백이 섞여 들어오면 HMAC 인증이 깨져(SOLAPI 400)
// 발송이 전부 실패한다. 반드시 .trim() 으로 정제한다. (현남 35건 미발송 사고)
const SOLAPI_API_KEY = (process.env.SOLAPI_API_KEY || '').trim();
const SOLAPI_API_SECRET = (process.env.SOLAPI_API_SECRET || '').trim();
const SOLAPI_SENDER = (process.env.SOLAPI_SENDER || '').trim();
const KAKAO_CHANNEL_ID = (process.env.SOLAPI_KAKAO_CHANNEL_ID || '').trim();
const SOLAPI_TEST_MODE = (process.env.SOLAPI_TEST_MODE || '').trim() === 'true';

interface SendAlimtalkParams {
  to: string;
  templateId: string;
  variables: Record<string, string>;
  /** 알림톡 템플릿 미승인 시 대체 발송할 SMS 본문 */
  fallbackText?: string;
}

export interface SendResult {
  success: boolean;
  channel: 'alimtalk' | 'sms' | 'skipped';
  reason?: string;
  data?: unknown;
  error?: unknown;
}

/**
 * SOLAPI 로 카카오 알림톡을 발송한다.
 * fallbackText 가 있고 카카오 채널 ID 가 없거나 templateId 가 플레이스홀더("TMPL_" 시작)면
 * 일반 SMS 로 자동 폴백한다.
 *
 * SOLAPI_TEST_MODE=true 이면 실제 호출 없이 로그만 남긴다(드라이런).
 */
export async function sendAlimtalk({
  to,
  templateId,
  variables,
  fallbackText,
}: SendAlimtalkParams): Promise<SendResult> {
  const cleanedTo = to.replace(/[-\s]/g, '');
  const cleanedFrom = SOLAPI_SENDER.replace(/[-\s]/g, '');

  const isPlaceholderTemplate = templateId.startsWith('TMPL_');
  const hasKakaoChannel = !!KAKAO_CHANNEL_ID;
  const shouldFallbackToSms = (!hasKakaoChannel || isPlaceholderTemplate) && !!fallbackText;

  // 테스트 모드를 가장 먼저 확인한다 — SOLAPI 키가 없는 로컬에서도 경로를 태워볼 수 있게.
  if (SOLAPI_TEST_MODE) {
    const mode = shouldFallbackToSms ? 'SMS (fallback)' : 'ALIMTALK';
    console.log(`[SOLAPI-TEST] ${mode} — would send:`, {
      to: cleanedTo,
      templateId,
      variables,
      fallbackText: shouldFallbackToSms ? fallbackText : undefined,
    });
    return {
      success: true,
      channel: shouldFallbackToSms ? 'sms' : 'alimtalk',
      reason: 'test mode',
      data: { test: true, to: cleanedTo, templateId, variables },
    };
  }

  if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET) {
    console.log('[SOLAPI] API keys not configured — skipping:', {
      to: cleanedTo,
      templateId,
      variables,
    });
    return {
      success: false,
      channel: 'skipped',
      reason: 'API keys not configured',
    };
  }

  if (!cleanedFrom) {
    console.error('[SOLAPI] SOLAPI_SENDER env var missing or empty');
    return {
      success: false,
      channel: 'skipped',
      reason: 'SOLAPI_SENDER env var not configured',
    };
  }

  try {
    const timestamp = new Date().toISOString();
    const salt = generateSalt();
    const signature = await generateSignature(timestamp, salt);

    const message: Record<string, unknown> = {
      to: cleanedTo,
      from: cleanedFrom,
    };

    if (shouldFallbackToSms) {
      message.text = interpolate(fallbackText!, variables);
    } else {
      message.kakaoOptions = {
        pfId: KAKAO_CHANNEL_ID,
        templateId,
        variables,
      };
    }

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${timestamp}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[SOLAPI] HTTP error:', response.status, data);
      return {
        success: false,
        channel: shouldFallbackToSms ? 'sms' : 'alimtalk',
        reason: `HTTP ${response.status}`,
        error: data,
      };
    }

    return {
      success: true,
      channel: shouldFallbackToSms ? 'sms' : 'alimtalk',
      data,
    };
  } catch (error) {
    console.error('[SOLAPI] Failed to send:', error);
    return {
      success: false,
      channel: shouldFallbackToSms ? 'sms' : 'alimtalk',
      error,
    };
  }
}

function interpolate(template: string, variables: Record<string, string>): string {
  let out = template;
  for (const [key, val] of Object.entries(variables)) {
    out = out.split(key).join(val);
  }
  return out;
}

function generateSalt(): string {
  return (
    Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14)
  );
}

async function generateSignature(timestamp: string, salt: string): Promise<string> {
  const { createHmac } = await import('crypto');
  const hmac = createHmac('sha256', SOLAPI_API_SECRET);
  hmac.update(timestamp + salt);
  return hmac.digest('hex');
}
