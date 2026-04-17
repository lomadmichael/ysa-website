/**
 * JSON-LD 구조화 데이터 주입 컴포넌트.
 * <head> 가 아닌 <body> 내에서도 렌더 가능하고 Google이 정상 인식.
 */

const SITE_URL = 'https://ysakorea.com';

interface Crumb {
  /** 메뉴/페이지 라벨 (예: "협회소개", "연혁") */
  name: string;
  /** 절대 URL 또는 사이트 내 절대 경로(`/about/history`). 마지막 항목은 생략 가능. */
  url?: string;
}

interface BreadcrumbListProps {
  items: Crumb[];
}

/**
 * BreadcrumbList JSON-LD.
 * 구글 검색결과에 페이지 경로가 계층형으로 표시됨.
 * 마지막 항목은 현재 페이지이므로 url이 없어도 됨(자동으로 현재 URL로 채워짐).
 *
 * 사용:
 * <BreadcrumbJsonLd items={[
 *   { name: '홈', url: '/' },
 *   { name: '협회소개', url: '/about' },
 *   { name: '연혁' }, // 현재 페이지 — url 생략 가능
 * ]} />
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbListProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const element: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };
      if (item.url) {
        element.item = item.url.startsWith('http')
          ? item.url
          : `${SITE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`;
      }
      return element;
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
