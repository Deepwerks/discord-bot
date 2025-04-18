import { useAssetsClient } from "../..";
import { getCachedHero, ICachedHero, setCachedHero } from "../cache/heroCache";

export async function getDeadlockHero(heroId: number): Promise<ICachedHero> {
  const cached = getCachedHero(heroId);
  if (cached) return cached;

  const deadlockHero = await useAssetsClient.HeroService.GetHero(heroId);
  const cachedHero: ICachedHero = {
    name: deadlockHero.name,
    imageUrl: deadlockHero.images.top_bar_image,
  };

  setCachedHero(heroId, cachedHero);
  return cachedHero;
}
