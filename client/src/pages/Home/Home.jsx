import { GiveawayHero } from '../../components/giveaway/GiveawayHero/GiveawayHero';
import { GiveawayStats } from '../../components/giveaway/GiveawayStats/GiveawayStats';
import { WinnerSlider } from '../../components/winners/WinnerSlider/WinnerSlider';
import { FeaturedGiveaways } from '../../components/giveaway/FeaturedGiveaways/FeaturedGiveaways';
import { WinnersTabs } from '../../components/winners/WinnersTabs/WinnersTabs';

export default function Home() {
  return (
    <>
      <GiveawayHero />
      <GiveawayStats />
      <WinnerSlider />
      <FeaturedGiveaways />
      <WinnersTabs />
    </>
  );
}
