'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PROGRAM_CATEGORY_LABEL, STATUS_LABEL } from '@/lib/database.types';
import type { ProgramCategory, StatusType } from '@/lib/database.types';
import TiptapEditor from '@/components/admin/TiptapEditor';

export default function NewProgram() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProgramCategory>('instructor');
  const [status, setStatus] = useState<StatusType>('recruiting');
  const [schedule, setSchedule] = useState('');
  const [applyLink, setApplyLink] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('programs').insert({
      name,
      category,
      status,
      schedule: schedule || null,
      apply_link: applyLink || null,
      description,
      image_url: imageUrl || null,
    });

    if (error) {
      alert('저장 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/admin/programs');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">새 프로그램 등록</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-navy">프로그램명</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-navy">카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProgramCategory)}
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {(Object.entries(PROGRAM_CATEGORY_LABEL) as [ProgramCategory, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy">상태</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusType)}
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {(Object.entries(STATUS_LABEL) as [StatusType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-navy">일정</span>
          <input
            type="text"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="예: 2026년 5월 10일 ~ 5월 12일"
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-navy">신청 링크</span>
          <input
            type="url"
            value={applyLink}
            onChange={(e) => setApplyLink(e.target.value)}
            placeholder="https://"
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-navy">이미지 URL</span>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://"
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-navy block mb-1">설명</span>
          <TiptapEditor content={description} onChange={setDescription} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ocean text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/programs')}
            className="bg-foam text-navy px-6 py-2 rounded-lg font-medium hover:bg-foam/70 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
