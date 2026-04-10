export const SITE = {
  name: '양양군서핑협회',
  nameEn: 'YSA KOREA',
  slogan: '파도를 넘어, 사람과 문화를 잇다',
  description: '양양군서핑협회는 서핑의 보급과 발전, 교육과 대회 운영, 건강한 해변문화 조성을 통해 양양의 지속 가능한 서핑 생태계를 만들어가는 공식 협회입니다.',
  phone: '033-671-6155',
  email: 'ysa_korea@naver.com',
  address: '강원도 양양군 현남면 두리 10-11 해양종합레포츠센터',
  hours: '평일 09:00 ~ 18:00',
  instagram: 'https://www.instagram.com/ysa_korea/',
  copyright: `© ${new Date().getFullYear()} 양양군 서핑협회 All rights reserved.`,
} as const;

export const NAV_ITEMS = [
  {
    label: '협회소개',
    href: '/about',
    children: [
      { label: '회장 인사말', href: '/about' },
      { label: '설립목적', href: '/about/purpose' },
      { label: '연혁', href: '/about/history' },
      { label: '조직도', href: '/about/organization' },
      { label: '오시는 길', href: '/about/location' },
    ],
  },
  {
    label: '협회사업',
    href: '/business',
    children: [
      { label: '대회 운영', href: '/business/competition' },
      { label: '교육 운영', href: '/business/education' },
      { label: '선수·청소년 육성', href: '/business/youth' },
      { label: '안전문화 조성', href: '/business/safety' },
    ],
  },
  {
    label: '프로그램 안내',
    href: '/programs',
    children: [
      { label: '강사 교육', href: '/programs/instructor' },
      { label: '심판 교육', href: '/programs/referee' },
      { label: '서핑특화 교육', href: '/programs/specialized' },
    ],
  },
  {
    label: '일정안내',
    href: '/schedule',
    children: [
      { label: '연간 일정', href: '/schedule' },
      { label: '모집중 일정', href: '/schedule/open' },
      { label: '종료된 일정', href: '/schedule/closed' },
      { label: '결과·기록', href: '/schedule/results' },
    ],
  },
  {
    label: '공지·자료실',
    href: '/notice',
    children: [
      { label: '공지사항', href: '/notice' },
      { label: '보도자료', href: '/notice/press' },
      { label: '사진·영상', href: '/notice/gallery' },
      { label: '규정·서식', href: '/notice/docs' },
      { label: 'FAQ', href: '/notice/faq' },
    ],
  },
  {
    label: '문의',
    href: '/contact',
    children: [
      { label: '문의안내', href: '/contact' },
      { label: '회원안내', href: '/contact/membership' },
      { label: '제휴·협업문의', href: '/contact/partnership' },
    ],
  },
] as const;
