'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

// 어드민 접근 허용 이메일 화이트리스트
// 추가 시: 이 배열에 이메일 추가 + scripts/create-admin.mjs로 auth.users 생성
const ALLOWED_ADMINS = [
  'michaellee.lomad@gmail.com',
  'ysa_korea@naver.com',
] as const;

function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_ADMINS.includes(email.toLowerCase() as (typeof ALLOWED_ADMINS)[number]);
}

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '□' },
  { href: '/admin/notices', label: '공지사항', icon: '□' },
  { href: '/admin/press', label: '보도자료', icon: '□' },
  { href: '/admin/programs', label: '프로그램', icon: '□' },
  { href: '/admin/competitions', label: '대회', icon: '□' },
  { href: '/admin/gallery', label: '갤러리', icon: '□' },
  { href: '/admin/docs', label: '규정·서식', icon: '□' },
  { href: '/admin/faq', label: 'FAQ', icon: '□' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const applySession = async (nextSession: Session | null) => {
      if (nextSession && !isAllowedAdmin(nextSession.user.email)) {
        // 로그인은 됐지만 화이트리스트 밖 → 강제 로그아웃
        await supabase.auth.signOut();
        setSession(null);
        setLoginError('이 계정에는 관리자 권한이 없습니다. 관리자에게 문의하세요.');
        return;
      }
      setSession(nextSession);
    };

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await applySession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
      return;
    }
    // 로그인 성공해도 화이트리스트 밖이면 차단
    if (!isAllowedAdmin(data.user?.email)) {
      await supabase.auth.signOut();
      setSession(null);
      setLoginError('이 계정에는 관리자 권한이 없습니다. 관리자에게 문의하세요.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <p className="text-navy">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm"
        >
          <h1 className="text-2xl font-bold text-ocean mb-6 text-center">
            YSA 관리자 로그인
          </h1>
          {loginError && (
            <p className="text-red-500 text-sm mb-4 text-center">{loginError}</p>
          )}
          <label className="block mb-4">
            <span className="text-sm font-medium text-navy">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          <label className="block mb-6">
            <span className="text-sm font-medium text-navy">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-ocean text-white py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors"
          >
            로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-sand">
      {/* Sidebar */}
      <aside className="w-56 bg-ocean text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-ocean-light">
          <h2 className="text-lg font-bold">YSA Admin</h2>
          <p className="text-xs text-foam truncate mt-1">{session.user.email}</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-ocean-light font-semibold'
                    : 'hover:bg-ocean-light/50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-ocean-light">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-foam hover:text-white transition-colors text-left"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}
