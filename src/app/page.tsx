// 갤러리·공지 등 admin 변경이 메인에 60초 내 반영되도록 ISR
export const revalidate = 60;

import HeroSection from '@/components/home/HeroSection';
import QuickAccess from '@/components/home/QuickAccess';
import AboutSummary from '@/components/home/AboutSummary';
import ValuesSection from '@/components/home/ValuesSection';
import ProgramsPreview from '@/components/home/ProgramsPreview';
import LatestNotices from '@/components/home/LatestNotices';
import GalleryPreview from '@/components/home/GalleryPreview';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickAccess />
      <AboutSummary />
      <ValuesSection />
      <ProgramsPreview />
      <LatestNotices />
      <GalleryPreview />
    </>
  );
}
