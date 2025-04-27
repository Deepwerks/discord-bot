import Fuse from "fuse.js";
import { deadlockAssetsHeroCache } from "../cache";

export function findHeroByName(input: string) {
  const heroAliasList = [
    { alias: "talon", heroName: "Gray Talon" },
    { alias: "gray", heroName: "Gray Talon" },
    { alias: "mcginnis", heroName: "McGinnis" },
  ];

  const searchableHeroes = deadlockAssetsHeroCache.getAll().map((hero) => ({
    name: hero.name,
    searchableName: hero.name.toLowerCase(),
  }));

  const searchableAliases = heroAliasList.map((alias) => ({
    name: alias.heroName,
    searchableName: alias.alias.toLowerCase(),
  }));

  const fuse = new Fuse([...searchableHeroes, ...searchableAliases], {
    keys: ["searchableName"],
    threshold: 0.3,
  });

  const normalizedInput = input.trim().toLowerCase();
  const heroList = deadlockAssetsHeroCache.getAll();

  let hero = heroList.find((h) => h.name.toLowerCase() === normalizedInput);

  if (!hero) {
    hero = heroList.find((h) => h.name.toLowerCase().includes(normalizedInput));
  }

  if (!hero) {
    const aliasEntry = heroAliasList.find(
      (entry) => entry.alias.toLowerCase() === normalizedInput
    );
    if (aliasEntry) {
      hero = heroList.find(
        (h) => h.name.toLowerCase() === aliasEntry.heroName.toLowerCase()
      );
    }
  }

  if (!hero) {
    const fuseResult = fuse.search(normalizedInput);
    const bestMatch = fuseResult[0]?.item.name;
    if (bestMatch) {
      hero = heroList.find(
        (h) => h.name.toLowerCase() === bestMatch.toLowerCase()
      );
    }
  }

  return hero;
}
