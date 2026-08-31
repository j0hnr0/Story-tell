import { demoStory } from "../data/demo-story";
import type { Story } from "../types";

/**
 * Phase 0 reads from a hardcoded module. Phase 1 re-points this one function at Prisma; nothing
 * upstream of it needs to change.
 */
export async function getStoryById(id: string): Promise<Story | null> {
  return id === demoStory.id ? demoStory : null;
}
