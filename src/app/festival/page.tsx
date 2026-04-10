import type { Metadata } from 'next';
import FestivalHero from '@/components/festival/HeroSection';
import FestivalIntro from '@/components/festival/IntroSection';
import FestivalStats from '@/components/festival/StatsBand';
import FestivalTimeline from '@/components/festival/Timeline';
import PosterGallery from '@/components/festival/PosterGallery';
import Champions from '@/components/festival/Champions';
import FestivalCTA from '@/components/festival/CTA';

export const metadata: Metadata = {
  title: '양양 서핑 페스티벌 10년의 역사',
  description:
    '2014년 첫 파도를 시작으로, 양양 서핑 페스티벌은 10년 동안 수많은 순간을 지나왔습니다. 대한민국 서핑문화의 역사를 함께 돌아봅니다.',
};

export default function FestivalPage() {
  return (
    <div className="-mt-16">
      <FestivalHero />
      <FestivalIntro />
      <FestivalStats />
      <FestivalTimeline />
      <PosterGallery />
      <Champions />
      <FestivalCTA />
    </div>
  );
}
