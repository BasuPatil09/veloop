import { GiveawayHero } from '../../components/giveaway/GiveawayHero/GiveawayHero';
import { GiveawayStats } from '../../components/giveaway/GiveawayStats/GiveawayStats';
import { WinnerSlider } from '../../components/winners/WinnerSlider/WinnerSlider';
import { FeaturedGiveaways } from '../../components/giveaway/FeaturedGiveaways/FeaturedGiveaways';
import { HowToParticipate } from '../../components/giveaway/HowToParticipate/HowToParticipate';
import { WinnersTabs } from '../../components/winners/WinnersTabs/WinnersTabs';
import { TrustSection } from '../../components/giveaway/TrustSection/TrustSection';
import { GiveawayRules } from '../../components/giveaway/GiveawayRules/GiveawayRules';
import { FAQAccordion } from '../../components/giveaway/FAQAccordion/FAQAccordion';

export default function Home() {
  return (
    <>
      <GiveawayHero />
      <GiveawayStats />
      <WinnerSlider />
      <FeaturedGiveaways />
      <HowToParticipate />
      <WinnersTabs />
      <TrustSection />
      <GiveawayRules />
      <FAQAccordion />
    </>
  );
}
