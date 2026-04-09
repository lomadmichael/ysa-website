import Link from 'next/link';
import { SITE, NAV_ITEMS } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="text-white mt-auto" style={{ backgroundColor: '#393d7d' }}>
      <div className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* 협회 정보 */}
          <div className="lg:col-span-1">
            <p className="text-xl font-bold mb-4">{SITE.nameEn}</p>
            <p className="text-sm text-white/70 leading-relaxed">
              양양군 서핑협회는 양양의 지속 가능한 서핑 생태계를 만들어갑니다.
            </p>
          </div>

          {/* 빠른 링크 */}
          <div>
            <p className="font-semibold mb-4 text-white/90">바로가기</p>
            <ul className="space-y-2">
              {NAV_ITEMS.slice(0, 3).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-4 text-white/90">정보</p>
            <ul className="space-y-2">
              {NAV_ITEMS.slice(3).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 연락처 */}
          <div>
            <p className="font-semibold mb-4 text-white/90">연락처</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>{SITE.address}</li>
              <li>전화: {SITE.phone}</li>
              <li>이메일: {SITE.email}</li>
              <li>{SITE.hours}</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="인스타그램"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">{SITE.copyright}</p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
