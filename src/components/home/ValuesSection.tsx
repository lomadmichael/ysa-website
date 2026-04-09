import Image from 'next/image';

const values = [
  {
    quote: '서핑은 경쟁이 아니라 자연과의 교감이다. 파도를 기다리는 시간도 우리에게는 서핑의 시간입니다.',
    title: '자연과의 조화',
    description: '양양의 파도와 함께 자연을 존중하는 태도를 전합니다.',
    imageAlt: '양양 바다에서 서핑을 즐기는 모습',
    imageSrc: '/images/value-1.png',
  },
  {
    quote: '좋은 문화는 좋은 사람을 통해 이어집니다. 교육은 기술 전수가 아니라 안전과 존중을 가르치는 일입니다.',
    title: '사람을 키우는 교육',
    description: '강사, 심판, 선수 양성을 통해 서핑문화의 기반을 만듭니다.',
    imageAlt: '서핑 교육 현장',
    imageSrc: '/images/value-2.png',
  },
  {
    quote: '해변의 자유가 지속되려면, 여행객과 원주민과 이주민이 서로를 존중하는 문화가 먼저입니다.',
    title: '존중의 해변문화',
    description: '모두가 함께 즐기는 건강한 해변환경을 조성합니다.',
    imageAlt: '서퍼들이 해변에서 하이파이브하는 모습',
    imageSrc: '/images/value-3.png',
  },
  {
    quote: '서핑은 양양이라는 지역의 정체성이 되었습니다. 함께 성장하는 것이 협회의 존재 이유입니다.',
    title: '지역과 함께하는 성장',
    description: '양양의 지속 가능한 서핑 생태계를 만들어갑니다.',
    imageAlt: '양양군서핑협회 단체 사진',
    imageSrc: '/images/value-4-2.jpg',
  },
];

export default function ValuesSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <p className="text-sm font-semibold text-purple tracking-widest uppercase mb-4 text-center">OUR VALUES</p>
        <h2 className="text-2xl md:text-3xl font-bold text-navy mb-16 text-center">
          서핑은 자연을 존중하는 태도이자<br className="hidden md:block" />
          사람과 지역을 연결하는 문화입니다
        </h2>

        <div className="space-y-20 md:space-y-32">
          {values.map((value, i) => (
            <div
              key={value.title}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                i % 2 === 1 ? 'lg:direction-rtl' : ''
              }`}
              style={i % 2 === 1 ? { direction: 'rtl' } : undefined}
            >
              {/* 사진 */}
              <div
                className="relative aspect-[16/10] bg-foam rounded-lg overflow-hidden"
                style={{ direction: 'ltr' }}
              >
                <Image src={value.imageSrc} alt={value.imageAlt} fill className="object-cover" />
              </div>

              {/* 텍스트 */}
              <div style={{ direction: 'ltr' }}>
                <blockquote className="text-navy/60 italic text-sm leading-relaxed mb-6 border-l-2 border-purple pl-4">
                  &ldquo;{value.quote}&rdquo;
                </blockquote>
                <h3 className="text-xl font-bold text-navy mb-2">{value.title}</h3>
                <p className="text-navy/70 leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
