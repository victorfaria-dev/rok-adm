import { afterDailyClaim, barbarianChain, formatDuration, hoursToCap, mergeCites, packPrice, packsCost, type Cite } from "@rokadm/planner/tools";
import { NumberField } from "../kit/NumberField";
import { ResultRow, Results } from "../kit/Result";
import { ShareBar } from "../kit/ShareBar";
import { useToolInputs } from "../kit/useToolInputs";

export interface ApCalcProps {
  cap: number;
  dailyClaim: number;
  barbarian: { base: number; step: number; maxStreak: number };
  insightMax: number;
  pack: { ap: number; startGems: number; stepGems: number };
  cites: { cap: Cite; claim: Cite; barbarian: Cite; pack: Cite };
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** F-81: barbarian attacks per chain, AP after the daily claim, and the gem price of buying AP. */
export default function ApCalc({ cap, dailyClaim, barbarian, insightMax, pack, cites }: ApCalcProps) {
  const { values: v, set, shared, shareUrl, keepMine, useLink } = useToolInputs("ap", {
    currentAp: 1000, insight: 0, capBonus: 0, purchasesToday: 0, packsToBuy: 1, regenPerHour: 0,
  });
  const insight = Math.min(insightMax, v.insight);
  const fullCap = cap + v.capBonus;
  const chainNow = barbarianChain(v.currentAp, barbarian, insight);
  const claim = afterDailyClaim(v.currentAp, fullCap, dailyClaim);
  const chainAfter = barbarianChain(claim.ap, barbarian, insight);
  const gems = packsCost(v.purchasesToday, v.packsToBuy, pack);
  const withPacks = claim.ap + v.packsToBuy * pack.ap;
  const hours = hoursToCap(v.currentAp, fullCap, v.regenPerHour);
  const chainNote = `Reading: the first attack costs ${barbarian.base} AP, each next one without returning ${barbarian.step} less, down to ${barbarian.base - barbarian.maxStreak}${insight ? `, minus ${insight} for Insight` : ""}.`;
  const capPending = v.capBonus ? ["AP cap bonus"] : [];
  const both = mergeCites(cites.cap, cites.claim);

  return (
    <div class="t-page-body" data-tool="ap">
      <form class="t-form" onSubmit={(e) => e.preventDefault()} aria-label="Action Points inputs">
        <NumberField id="ap-now" label="Your Action Points now" value={v.currentAp} max={100000} onChange={(x) => set({ currentAp: x })} />
        <NumberField id="ap-insight" label="Insight talent reduction" suffix="AP" value={v.insight} max={insightMax} onChange={(x) => set({ insight: x })}
          help={`0 without the talent; up to ${insightMax} AP off each attack.`} />
        <NumberField id="ap-cap-bonus" label="Extra AP cap from VIP" suffix="AP" value={v.capBonus} max={10000} pending onChange={(x) => set({ capBonus: x })}
          help="Your VIP level may raise the cap (A09-0001 gives VIP 15 only). 0 if unsure." />
        <NumberField id="ap-bought" label="AP packs bought with gems today" value={v.purchasesToday} max={1000} onChange={(x) => set({ purchasesToday: x })}
          help="Resets at the daily server reset." />
        <NumberField id="ap-more" label="Packs you want to buy now" value={v.packsToBuy} max={1000} onChange={(x) => set({ packsToBuy: x })}
          help={`Each pack is ${fmt(pack.ap)} AP. The game sells them only when you have no AP items left.`} />
        <NumberField id="ap-regen" label="AP you regain per hour" value={v.regenPerHour} integer={false} max={10000} pending onChange={(x) => set({ regenPerHour: x })}
          help="Unknown in our data: note your AP at two times, with no buffs, and divide." />
      </form>
      <Results>
        <ResultRow testId="ap-chain-now" label="Barbarian attacks in one chain with your AP now" value={`${fmt(chainNow.attacks)} attacks (${fmt(chainNow.spent)} AP, ${fmt(chainNow.left)} left)`}
          cite={cites.barbarian} notes={[chainNote]} />
        <ResultRow testId="ap-claim" label="AP after the daily claim" cite={both} pending={capPending}
          value={claim.claimed ? `${fmt(claim.ap)} AP${claim.overCap ? ` (${fmt(claim.overCap)} over the ${fmt(fullCap)} cap)` : ""}` : `Cannot claim: you are at or above the ${fmt(fullCap)} cap`}
          notes={["The claim works while you are below the cap and can take you over it."]} />
        <ResultRow testId="ap-chain-after" label="Barbarian attacks in one chain after the claim" value={`${fmt(chainAfter.attacks)} attacks`}
          cite={mergeCites(cites.barbarian, cites.claim)} />
        <ResultRow testId="ap-gems" label={`Gems for ${fmt(v.packsToBuy)} more pack${v.packsToBuy === 1 ? "" : "s"} today`} value={`${fmt(gems)} gems`} cite={cites.pack}
          notes={[`The next pack costs ${fmt(packPrice(v.purchasesToday, pack))} gems; each one after costs ${fmt(pack.stepGems)} more until the daily reset.`]} />
        <ResultRow testId="ap-total" label="AP after the claim and those packs" value={`${fmt(withPacks)} AP`} cite={mergeCites(both, cites.pack)} />
        <ResultRow testId="ap-regen" label={`Time to refill to the ${fmt(fullCap)} cap`} cite={cites.cap} pending={["AP regained per hour"]}
          value={hours === null ? <span class="t-prompt">Enter the AP you regain per hour</span> : formatDuration(hours * 3600)} />
      </Results>
      <ShareBar shareUrl={shareUrl} shared={shared} keepMine={keepMine} useLink={useLink} />
    </div>
  );
}
