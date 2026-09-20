'use server';

import { submitEntry, type SubmitCode } from '@/lib/livedraw-db';

export interface EntryState {
  status: 'idle' | 'ok' | 'error';
  message: string;
}

const MESSAGES: Record<SubmitCode, string> = {
  ok: '응모가 완료되었습니다. 추첨 결과는 생중계 화면에서 발표하고, 당첨되시면 문자로 안내드립니다.',
  invalid_name: '이름을 두 글자 이상 입력해 주세요.',
  invalid_phone: '휴대폰 번호를 정확히 입력해 주세요.',
  duplicate_phone: '이미 응모하셨습니다. 한 번호로 한 번만 응모할 수 있습니다.',
  closed: '응모가 마감되었습니다.',
  error: '잠시 후 다시 시도해 주세요.',
};

export async function submitLiveEntry(
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const name = String(formData.get('name') ?? '');
  const phone = String(formData.get('phone') ?? '');
  const code = await submitEntry(name, phone);
  return {
    status: code === 'ok' ? 'ok' : 'error',
    message: MESSAGES[code] ?? MESSAGES.error,
  };
}
