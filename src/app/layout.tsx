import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SITE } from "@/lib/constants";

const SITE_URL = 'https://ysakorea.com';
const OG_IMAGE = '/images/hero_03.png'; // 1200x630 이상 권장 (SEO 점검 시 전용 OG 제작 고려)

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} | ${SITE.slogan}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    '양양', '서핑', '서핑협회', '양양군서핑협회', 'YSA', 'ysakorea',
    '서핑교육', '서핑대회', '강사교육', '심판교육', '양양서핑페스티벌',
    '죽도해변', '강원도 서핑', '양양 서핑',
  ],
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.slogan}`,
    description: SITE.description,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.slogan}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} | ${SITE.slogan}`,
    description: SITE.description,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    // 홈 canonical만 root에서 설정. 하위 페이지에 canonical을 상속하지 않도록
    // 각 페이지는 자체 canonical을 설정하거나, 없으면 검색엔진이 요청 URL로 추론.
    canonical: '/',
  },
  verification: {
    other: {
      'naver-site-verification': 'f44f9a865855ca603cb06b96eb62c3874ae70cf7',
    },
  },
  category: '스포츠',
};

/** 구조화 데이터 (SportsOrganization). 구글·네이버 모두 인식. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: SITE.name,
  alternateName: [SITE.nameEn, 'YSA', 'ysakorea'],
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}${OG_IMAGE}`,
  description: SITE.description,
  slogan: SITE.slogan,
  sport: 'Surfing',
  foundingDate: '2014',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '현남면 두리 10-11 해양종합레포츠센터',
    addressLocality: '양양군',
    addressRegion: '강원도',
    addressCountry: 'KR',
  },
  telephone: SITE.phone,
  email: SITE.email,
  areaServed: {
    '@type': 'AdministrativeArea',
    name: '양양군',
  },
  sameAs: [
    SITE.instagram,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased scroll-smooth">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-to-content">본문 바로가기</a>
        <Header />
        <main id="main" className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
