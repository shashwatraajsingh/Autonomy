import { HeroSection } from '@/components/HeroSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { WhyItMattersSection } from '@/components/WhyItMattersSection';
import { TechStackSection } from '@/components/TechStackSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <WhyItMattersSection />
      <TechStackSection />
    </>
  );
}
