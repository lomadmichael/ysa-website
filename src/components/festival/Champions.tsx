'use client';

import { useMemo, useState } from 'react';
import {
  CHAMPIONS,
  CHAMPION_CATEGORY_LABEL,
  CHAMPION_GENDER_LABEL,
  type ChampionCategory,
  type ChampionRecord,
} from '@/lib/festival-data';

const CATEGORIES: { value: ChampionCategory; label: string }[] = [
  { value: 'shortboard', label: '숏보드' },
  { value: 'longboard', label: '롱보드' },
  { value: 'sup', label: 'SUP' },
];

const RANK_STYLE: Record<number, { bg: string; text: string; medal: string }> = {
  1: { bg: 'bg-sunset', text: 'text-white', medal: '🥇' },
  2: { bg: 'bg-navy/10', text: 'text-navy', medal: '🥈' },
  3: { bg: 'bg-ocean/10', text: 'text-ocean', medal: '🥉' },
};

export default function Champions() {
  const [category, setCategory] = useState<ChampionCategory>('shortboard');

  // 카테고리별 필터 + 연도 내림차순 정렬
  const filtered = useMemo(() => {
    return CHAMPIONS.filter((r) => r.category === category).sort(
      (a, b) => b.year - a.year,
    );
  }, [category]);

  // 연도별 그룹화
  const byYear = useMemo(() => {
    const map = new Map<number, ChampionRecord[]>();
    for (const record of filtered) {
      if (!map.has(record.year)) map.set(record.year, []);
      map.get(record.year)!.push(record);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  return (
    <section id="champions" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-mono tracking-[0.4em] uppercase text-sunset mb-4">
            CHAMPIONS
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-navy leading-tight mb-4">
            역대 입상자
          </h2>
          <p className="text-sm text-navy/50">
            2014년부터 이어진 양양 서핑 페스티벌의 역대 입상자 기록입니다.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {CATEGORIES.map((cat) => {
            const count = CHAMPIONS.filter((r) => r.category === cat.value).length;
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-5 py-2.5 text-sm font-medium rounded-full border transition-colors ${
                  isActive
                    ? 'border-ocean bg-ocean text-white'
                    : 'border-foam bg-white text-navy/70 hover:border-ocean/30 hover:text-ocean'
                }`}
              >
                {cat.label}
                <span
                  className={`ml-1.5 text-[11px] font-normal ${
                    isActive ? 'text-white/70' : 'text-navy/30'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 연도별 우승자 */}
        {byYear.length > 0 ? (
          <div className="space-y-12">
            {byYear.map(([year, records]) => (
              <div key={year}>
                <div className="flex items-baseline gap-4 mb-6 pb-3 border-b border-foam">
                  <h3 className="text-2xl md:text-3xl font-bold text-navy font-mono">
                    {year}
                  </h3>
                  <p className="text-sm text-navy/50">
                    제{records[0]!.edition}회 · {CHAMPION_CATEGORY_LABEL[category]}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {records.map((record) => (
                    <div
                      key={`${record.year}-${record.category}-${record.gender}`}
                      className="bg-sand rounded-2xl p-6 border border-foam"
                    >
                      <p className="text-xs font-mono font-semibold text-ocean uppercase tracking-wider mb-4">
                        {CHAMPION_GENDER_LABEL[record.gender]}
                      </p>
                      <div className="space-y-3">
                        {record.rankings.map((ranking) => {
                          const style = RANK_STYLE[ranking.rank]!;
                          return (
                            <div
                              key={ranking.rank}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg"
                            >
                              <span
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${style.bg} ${style.text}`}
                              >
                                {ranking.rank}
                              </span>
                              <span className="flex-1 font-medium text-navy">
                                {ranking.name}
                              </span>
                              {ranking.team && (
                                <span className="text-xs text-navy/40">
                                  {ranking.team}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-navy/40">
            <p className="text-sm">
              {CHAMPION_CATEGORY_LABEL[category]} 부문 우승자 정보가 아직 등록되지 않았습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
