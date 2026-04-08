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
