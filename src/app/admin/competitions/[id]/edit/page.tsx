'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { STATUS_LABEL } from '@/lib/database.types';
import type { StatusType } from '@/lib/database.types';
import TiptapEditor from '@/components/admin/TiptapEditor';

export default function EditCompetition({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<StatusType>('recruiting');
  const [schedule, setSchedule] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', Number(id))
        .single();
      if (data) {
        setName(data.name);
        setStatus(data.status);
        setSchedule(data.schedule ?? '');
        setYear(data.year);
        setDescription(data.description);
        setImageUrl(data.image_url ?? '');
        setResult(data.result ?? '');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('competitions')
      .update({
        name,
        status,
        schedule: schedule || null,
        year,
        description,
        image_url: imageUrl || null,
        result: result || null,
      })
      .eq('id', Number(id));

    if (error) {
      alert('수정 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/admin/competitions');
  };

  if (loading) return <p className="text-navy/60">로딩 중...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">대회 수정</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-navy">대회명</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
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

          <label className="block">
            <span className="text-sm font-medium text-navy">연도</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              required
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy">일정</span>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-navy">이미지 URL</span>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-navy block mb-1">설명</span>
          <TiptapEditor content={description} onChange={setDescription} />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-navy">결과</span>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ocean text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '수정'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/competitions')}
            className="bg-foam text-navy px-6 py-2 rounded-lg font-medium hover:bg-foam/70 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
