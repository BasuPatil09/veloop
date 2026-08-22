import { GiveawayHero } from '../../components/giveaway/GiveawayHero/GiveawayHero';
import { GiveawayStats } from '../../components/giveaway/GiveawayStats/GiveawayStats';
import { FeaturedGiveaways } from '../../components/giveaway/FeaturedGiveaways/FeaturedGiveaways';

export default function Home() {
  return (
    <>
      <GiveawayHero />
      <GiveawayStats />
      <FeaturedGiveaways />
    </>
  );
}
