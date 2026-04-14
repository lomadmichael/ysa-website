'use client';

import Link from 'next/link';

const STATS = [
  { label: '공지사항', href: '/admin/notices', color: 'bg-ocean' },
  { label: '보도자료', href: '/admin/press', color: 'bg-teal' },
  { label: '프로그램', href: '/admin/programs', color: 'bg-sunset' },
  { label: '대회', href: '/admin/competitions', color: 'bg-navy' },
  { label: '갤러리', href: '/admin/gallery', color: 'bg-ocean' },
  { label: '규정·서식', href: '/admin/docs', color: 'bg-teal' },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">대시보드</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} mb-3`} />
            <p className="text-sm text-navy/60">{stat.label}</p>
            <p className="text-3xl font-bold text-navy mt-1">&mdash;</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
