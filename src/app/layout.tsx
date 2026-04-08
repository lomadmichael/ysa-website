import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL('https://ysa-website.vercel.app'),
  title: {
    default: `${SITE.name} | ${SITE.slogan}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ['양양', '서핑', '서핑협회', '양양군서핑협회', 'YSA', '서핑교육', '서핑대회', '강사교육', '심판교육'],
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    locale: 'ko_KR',
    type: 'website',
    siteName: SITE.name,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://ysa-website.vercel.app',
  },
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
