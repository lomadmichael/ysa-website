import Link from 'next/link';

const programs = [
  {
    title: '강사 교육',
    description: '서핑 서비스 품질과 안전성을 높이기 위한 전문인력 양성 프로그램. ISA 자격 강사진이 지도합니다.',
    schedule: '5일 과정, 총 30시간',
    href: '/programs/instructor',
    imageAlt: '강사 교육 현장',
  },
  {
    title: '심판 교육',
    description: '공정하고 전문적인 경기 운영을 위한 교육 과정. 채점 환경 이해부터 자격 검증까지.',
    schedule: '5일 과정, 총 30시간',
    href: '/programs/referee',
    imageAlt: '심판 교육 현장',
  },
  {
    title: '서핑특화 교육',
    description: '서프레스큐, 랜드서핑, 서핑요가, 선수교육 등 파도 위 기술 너머의 확장형 교육.',
    schedule: '시즌별 운영',
    href: '/programs/specialized',
    imageAlt: '서핑특화 교육 현장',
  },
];

export default function ProgramsPreview() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-4">
        <p className="text-sm font-semibold text-teal tracking-widest uppercase mb-4">PROGRAMS</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-navy">
            프로그램 안내
          </h2>
          <Link
            href="/programs"
            className="mt-4 md:mt-0 text-sm text-ocean font-semibold hover:underline"
          >
            전체 프로그램 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Link
              key={program.title}
              href={program.href}
              className="group block bg-white rounded-lg overflow-hidden border border-foam hover:border-teal/30 transition-colors"
            >
              {/* 이미지 */}
              <div className="aspect-[16/9] bg-foam relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-navy/20 text-sm">
                  {program.imageAlt}
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <span className="text-xs font-medium text-teal bg-teal/10 px-2 py-1 rounded-sm">
                  {program.schedule}
                </span>
                <h3 className="text-lg font-bold text-navy mt-3 mb-2 group-hover:text-ocean transition-colors">
                  {program.title}
                </h3>
                <p className="text-sm text-navy/60 leading-relaxed">
                  {program.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
