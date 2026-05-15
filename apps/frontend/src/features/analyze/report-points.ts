import type { AnalyzeResponse } from "@synastry/contracts";

export function getArgumentGroups(compatibility: AnalyzeResponse["compatibility"]) {
  if (compatibility.argumentsFor?.length || compatibility.argumentsAgainst?.length) {
    return {
      for: compatibility.argumentsFor ?? [],
      against: compatibility.argumentsAgainst ?? [],
    };
  }

  const legacy = compatibility.arguments ?? [];

  if (legacy.length === 0) {
    return { for: [], against: [] };
  }

  const splitAt = Math.ceil(legacy.length / 2);

  return {
    for: legacy.slice(0, splitAt),
    against: legacy.slice(splitAt),
  };
}
