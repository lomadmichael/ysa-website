'use client';

import { useState } from 'react';
import { firstRound, type LineupAthlete, type LineupDivision } from '@/lib/lineup-api';

/** 빕(래시가드) 색 — 라인업 콘솔·현장 빕과 동일한 색 */
const JERSEY_COLORS: Record<string, string> = {
  red: '#d9483b',
  yellow: '#e8c04a',
  white: '#d1d5db',
  blue: '#3a72c4',
  green: '#3f9d62',
  black: '#2b2b2b',
};

function jerseyColor(jersey: string | null): string {
  if (!jersey) return '#d1d5db';
  return JERSEY_COLORS[jersey.toLowerCase()] ?? '#d1d5db';
}

/**
 * 비기너 대회 1라운드 히트 편성(라인업 스타일).
 *
 * 남자부 / 여자부 토글만 클라이언트 상태로 두고, 데이터는 서버에서 받아 props 로 넘어온다.
 * 2라운드 이후는 여기서 그리지 않는다 — 진행 결과는 라이브 페이지가 진실 원본이다.
 */
export default function BracketLineup({
  divisions,
  liveUrl,
}: {
  divisions: LineupDivision[];
  liveUrl: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  // 사진 URL 은 단기 서명 링크라 만료될 수 있다 — 깨진 이미지 대신 이니셜로 대체
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([]);

  const division = divisions[activeIndex] ?? divisions[0];
  const round = division ? firstRound(division) : null;
  const heats = round?.heats ?? [];

  return (
    <div>
      {/* 부문 토글 */}
      <div className="flex flex-wrap gap-2">
        {divisions.map((div, index) => {
          const isActive = index === activeIndex;
          const count =
            firstRound(div)?.heats.reduce((sum, heat) => sum + heat.athletes.length, 0) ?? 0;
          return (
            <button
              key={div.id ?? div.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={isActive}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-navy text-white'
                  : 'border border-foam bg-white text-navy/60 hover:border-ocean/30 hover:text-navy'
              }`}
            >
              {div.name}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/60' : 'text-navy/40'}`}>
                {count}명
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-navy/60 md:text-sm">
        본인의 히트와 이름을 확인해주세요 · 히트별 과반수 2라운드 진출
      </p>

      {/* 1라운드 히트 카드 */}
      {heats.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heats.map((heat) => (
            <article
              key={heat.id ?? heat.heat_number}
              className="rounded-2xl border border-foam bg-white p-4"
            >
              <div className="mb-3 flex items-baseline justify-between border-b border-foam pb-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-teal">
                  HEAT {heat.heat_number}
                </span>
                <span className="text-xs text-navy/40">{heat.athletes.length}명</span>
              </div>

              <ul className="space-y-2.5">
                {heat.athletes.map((athlete) => (
                  <AthleteRow
                    key={athlete.id ?? `${heat.heat_number}-${athlete.name}`}
                    athlete={athlete}
                    photoBroken={
                      !athlete.photo_url || brokenPhotos.includes(athlete.photo_url)
                    }
                    onPhotoError={() =>
                      setBrokenPhotos((prev) =>
                        athlete.photo_url && !prev.includes(athlete.photo_url)
                          ? [...prev, athlete.photo_url]
                          : prev
                      )
                    }
                  />
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-foam bg-white px-5 py-6 text-sm text-navy/60">
          아직 히트 편성이 공개되지 않았습니다.
        </p>
      )}

      {/* 진행 결과·상위 라운드는 라이브 페이지가 원본 */}
      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
      >
        실시간 대진표·경기 결과 보기
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
      </a>
    </div>
  );
}

function AthleteRow({
  athlete,
  photoBroken,
  onPhotoError,
}: {
  athlete: LineupAthlete;
  photoBroken: boolean;
  onPhotoError: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5">
      {/* 빕 색 세로바 */}
      <span
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: jerseyColor(athlete.jersey) }}
        aria-hidden="true"
      />

      {photoBroken ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foam text-sm font-bold text-navy/40">
          {athlete.name?.trim().charAt(0) ?? '?'}
        </span>
      ) : (
        // 서명 URL(단기 만료)이라 next/image 최적화 대상에서 제외한다 —
        // remotePatterns 에 등록하지 않고 브라우저가 그대로 받게 둔다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={athlete.photo_url ?? ''}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          onError={onPhotoError}
          className="h-10 w-10 shrink-0 rounded-full bg-foam object-cover"
        />
      )}

      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-navy">{athlete.name}</span>
        {athlete.affiliation && (
          <span className="block truncate text-xs text-navy/45">{athlete.affiliation}</span>
        )}
      </span>
    </li>
  );
}
