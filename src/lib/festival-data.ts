/**
 * 양양 서핑 페스티벌 10년의 역사 데이터
 *
 * 우승자(Champion) 데이터는 샘플이며, 협회에서 자료 제공 후 실제 데이터로 교체 예정.
 */

export interface FestivalYear {
  year: number;
  /** 제N회 */
  edition: number;
  /** 개최 기간 (예: "10.11 ~ 10.12") */
  period: string;
  /** 공식 대회명 */
  title: string;
  /** 한줄 슬로건 (있을 경우) */
  slogan?: string;
  /** 포스터 이미지 경로 (/public 기준) */
  posterImage?: string;
  /** 현장 사진 경로 목록 */
  photos?: string[];
  /** 대표 사진 (카드 썸네일용) */
  thumbnail?: string;
  /** 한글 요약 */
  descriptionKo: string;
  /** 영문 요약 */
  descriptionEn: string;
  /** 이 해의 하이라이트 키워드 */
  highlights?: string[];
}

/**
 * 연혁 데이터 (최신이 위)
 *
 * 이미지 파일은 아직 크롭 전이므로 경로만 정의.
 * 실제 이미지가 들어오면 파일명만 교체하면 됨.
 */
export const FESTIVAL_HISTORY: FestivalYear[] = [
  {
    year: 2025,
    edition: 10,
    period: '2025 진행',
    title: '2025 Yangyang Surfing Festival · 10주년',
    slogan: 'SAVE OUR SEAS',
    posterImage: '/images/history/2025-poster_01.jpg',
    thumbnail: '/images/history/2025-photo.jpg',
    descriptionKo:
      '2014년 첫 파도를 시작으로, 양양 서핑 페스티벌은 10년 동안 수많은 순간을 지나왔습니다. 파도는 거센 물결 속에서도 서퍼들과 함께 성장하며 대한민국 서핑문화의 역사를 써왔습니다. 이 기록은 단순한 대회의 면면이 아니라, 양양의 바다와 사람, 그리고 문화가 함께 만들어온 시간의 흔적입니다.',
    descriptionEn:
      'Since the first wave in 2014, the Yangyang Surfing Festival has journeyed through a decade of unforgettable moments. Through calm seas and rough tides, it has grown alongside surfers, shaping the story of Korea\'s surfing culture.',
    highlights: ['10주년 기념', 'Save Our Seas'],
  },
  {
    year: 2024,
    edition: 9,
    period: '09.01 ~ 11.30',
    title: '제9회 양양군수배 국제서핑대회',
    thumbnail: '/images/history/2024-photo.jpg',
    descriptionKo:
      '양양 전역이 파도를 타는 축제의 장으로 자리매김하며 비치요가, 서핑 체험 등 다양한 해변 프로그램을 선보이며 양양만의 해양문화 활성화를 이끌었습니다.',
    descriptionEn:
      "It became a festival that showcased the beauty of Yangyang, featuring programs like beach yoga and surfing experiences, and played a key role in spreading Yangyang's unique coastal culture.",
    highlights: ['축제 복원', '지역 문화 확산'],
  },
  {
    year: 2023,
    edition: 8,
    period: '07.01 ~ 09.30',
    title: '제8회 해양수산부장관배 서핑대회',
    slogan: '파도 있는 날',
    thumbnail: '/images/history/2023-photo.jpg',
    descriptionKo:
      '서핑 페스티벌과 서핑 대회를 분리 개최함으로써 축제 거리와 전문성을 모두 확보하고자 했습니다. 양양이 서핑의 메카로 굳혀가는 한 해로 기록되었습니다.',
    descriptionEn:
      'By separating the festival and competition, the organizers balanced fun and professionalism, helping Yangyang grow as Korea\'s surfing mecca.',
    highlights: ['축제+대회 분리 운영', '전문성 강화'],
  },
  {
    year: 2022,
    edition: 7,
    period: '08.01 ~ 09.30',
    title: '제7회 해양수산부장관배 서핑대회',
    slogan: '파도 있는 날',
    thumbnail: '/images/history/2022-photo.jpg',
    descriptionKo:
      '코로나19로 인한 3년 만에 다시 열린 서핑대회는 "파도있는 날" 기준으로 대회 일정을 수립하여, 대한민국 서핑문화를 한 단계 끌어올리는 전환점이 되었습니다.',
    descriptionEn:
      "After a three-year break due to COVID-19, the festival introduced a new rule — scheduling based on actual wave conditions — raising the standard of Korean surfing events.",
    highlights: ['3년만의 재개', '「파도있는 날」 룰 도입'],
  },
  {
    year: 2019,
    edition: 6,
    period: '10.11 ~ 10.13',
    title: '제6회 양양서핑페스티벌',
    thumbnail: '/images/history/2019-photo.jpg',
    descriptionKo:
      '서핑의 세대교체와 진보적인 실력 향상을 보여준 경기로 평가받으며, 수준 높은 경기력이 펼쳐진 대회로 기록되었습니다.',
    descriptionEn:
      'The event showcased a new generation of surfers and higher performance levels, earning strong praise.',
    highlights: ['차세대 선수 등장', '경기력 성장'],
  },
  {
    year: 2018,
    edition: 5,
    period: '10.13 ~ 10.14',
    title: '제5회 까뛰베 양양서핑페스티벌',
    thumbnail: '/images/history/2018-photo.jpg',
    descriptionKo:
      '양양의 서핑대회 문화가 자리 잡기 시작한 해로, 대회의 전문성을 강화하기 위해 총 12개 부문으로 나누어 대회를 운영했습니다.',
    descriptionEn:
      "As Yangyang's surfing scene grew, the competition expanded into 12 categories, enhancing its professionalism.",
    highlights: ['12개 부문 확대', '전문성 강화'],
  },
  {
    year: 2017,
    edition: 4,
    period: '10.13 ~ 10.15',
    title: '제4회 블루코스트배 양양서핑페스티벌',
    thumbnail: '/images/history/2017-photo.jpg',
    descriptionKo:
      '해양환경 보존을 위해 일회용 플라스틱 사용을 자제하고 쓰레기 100% 수거를 위해 NGO인 체인지 "오션"과 협력하여 환경친화적인 대회로 진행하였습니다.',
    descriptionEn:
      'To protect the marine environment, single-use plastics were minimized, and a partnership with the NGO OCEAN promoted environmental awareness.',
    highlights: ['NGO 협력', '친환경 대회'],
  },
  {
    year: 2016,
    edition: 3,
    period: '10.1 ~ 10.2',
    title: '제3회 양양서핑페스티벌',
    slogan: 'Save Our Seas',
    thumbnail: '/images/history/2016-photo.jpg',
    descriptionKo:
      '제3회 양양서핑페스티벌은 "Save Our Seas"라는 슬로건의 미션수행을 위해 쓰레기 100% 수거를 목표로 진행되었습니다.',
    descriptionEn:
      'The 3rd Yangyang Surfing Festival carried the slogan "Save Our Seas", aiming for 100% waste collection.',
    highlights: ['Save Our Seas 슬로건', '쓰레기 100% 수거'],
  },
  {
    year: 2015,
    edition: 2,
    period: '10.9 ~ 10.10',
    title: '제2회 양양서핑페스티벌',
    thumbnail: '/images/history/2015-photo.jpg',
    descriptionKo:
      '양양의 서핑문화를 확산하기 위해 일반 관광객이 직접 참여할 수 있는 다양한 프로그램을 운영하며, 페스티벌로서의 새로운 도전이 시작되었습니다.',
    descriptionEn:
      "To promote surfing in Yangyang, various programs encouraged public participation, marking the beginning of its journey as a true festival.",
    highlights: ['시민 참여형', '프로그램 확대'],
  },
  {
    year: 2014,
    edition: 1,
    period: '10.11 ~ 10.12',
    title: '제1회 양양군수배 국제 서핑페스티벌',
    thumbnail: '/images/history/2014-photo.jpg',
    descriptionKo:
      '국내에 서핑문화는 것이 아직 알려지지 이전 강원지역의 서핑숍들이 함께 하여 "강원 서핑연합"이 주최로 행사가 개최되었습니다.',
    descriptionEn:
      'Before surfing culture became widely known in Korea, the event was organized by the Gangwon Surfing Association, formed by surf shops along the Gangwon coast.',
    highlights: ['대한민국 서핑대회의 시작', '강원 서핑연합 주최'],
  },
];

/** COVID-19로 공백이 있었던 연도 */
export const HIATUS_YEARS = [2020, 2021];

/** 숫자로 보는 10년 */
export const FESTIVAL_STATS = [
  { value: '10', label: 'YEARS', sub: '10년의 여정' },
  { value: '10회', label: 'FESTIVALS', sub: '역대 페스티벌' },
  { value: '5,000+', label: 'PARTICIPANTS', sub: '누적 참가자' },
  { value: '12', label: 'CATEGORIES', sub: '경기 부문' },
];

/* ───────────────────────────────────────────── */
/* 역대 우승자 (샘플 데이터 — 협회 자료 전달 후 교체) */
/* ───────────────────────────────────────────── */

export type ChampionCategory = 'shortboard' | 'longboard' | 'sup' | 'junior';
export type ChampionGender = 'men' | 'women' | 'open';

export interface ChampionRanking {
  rank: 1 | 2 | 3;
  name: string;
  team?: string;
}

export interface ChampionRecord {
  year: number;
  edition: number;
  category: ChampionCategory;
  gender: ChampionGender;
  rankings: ChampionRanking[];
}

export const CHAMPION_CATEGORY_LABEL: Record<ChampionCategory, string> = {
  shortboard: '숏보드',
  longboard: '롱보드',
  sup: 'SUP',
  junior: '주니어',
};

export const CHAMPION_GENDER_LABEL: Record<ChampionGender, string> = {
  men: '남자부',
  women: '여자부',
  open: '오픈',
};

/** ⚠️ 샘플 데이터 — 실제 우승자 정보 아님. 협회에서 자료 전달 받은 후 교체 필요. */
export const CHAMPIONS_SAMPLE: ChampionRecord[] = [
  // 2024
  {
    year: 2024,
    edition: 9,
    category: 'shortboard',
    gender: 'men',
    rankings: [
      { rank: 1, name: '선수 A' },
      { rank: 2, name: '선수 B' },
      { rank: 3, name: '선수 C' },
    ],
  },
  {
    year: 2024,
    edition: 9,
    category: 'shortboard',
    gender: 'women',
    rankings: [
      { rank: 1, name: '선수 D' },
      { rank: 2, name: '선수 E' },
      { rank: 3, name: '선수 F' },
    ],
  },
  {
    year: 2024,
    edition: 9,
    category: 'longboard',
    gender: 'men',
    rankings: [
      { rank: 1, name: '선수 G' },
      { rank: 2, name: '선수 H' },
      { rank: 3, name: '선수 I' },
    ],
  },
  {
    year: 2024,
    edition: 9,
    category: 'longboard',
    gender: 'women',
    rankings: [
      { rank: 1, name: '선수 J' },
      { rank: 2, name: '선수 K' },
      { rank: 3, name: '선수 L' },
    ],
  },
  {
    year: 2024,
    edition: 9,
    category: 'sup',
    gender: 'open',
    rankings: [
      { rank: 1, name: '선수 M' },
      { rank: 2, name: '선수 N' },
      { rank: 3, name: '선수 O' },
    ],
  },
  // 2023
  {
    year: 2023,
    edition: 8,
    category: 'shortboard',
    gender: 'men',
    rankings: [
      { rank: 1, name: '선수 P' },
      { rank: 2, name: '선수 Q' },
      { rank: 3, name: '선수 R' },
    ],
  },
  {
    year: 2023,
    edition: 8,
    category: 'longboard',
    gender: 'open',
    rankings: [
      { rank: 1, name: '선수 S' },
      { rank: 2, name: '선수 T' },
      { rank: 3, name: '선수 U' },
    ],
  },
  // 2022
  {
    year: 2022,
    edition: 7,
    category: 'shortboard',
    gender: 'men',
    rankings: [
      { rank: 1, name: '선수 V' },
      { rank: 2, name: '선수 W' },
      { rank: 3, name: '선수 X' },
    ],
  },
];
