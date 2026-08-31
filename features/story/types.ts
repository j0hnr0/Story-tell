/**
 * Hand-written mirrors of the Prisma models in docs/PLAN.md. Phase 1 replaces these with the
 * generated Prisma types — field names are kept identical so that swap is a drop-in.
 */

export type Beat = {
  id: string;
  storyId: string;
  chapterId: string | null;
  /** 0-based order within the whole story. */
  index: number;
  text: string;
  imageUrl: string;
  imageAlt: string | null;
  /** Tiny base64 placeholder so the first paint has no flash. */
  blurDataUrl: string | null;
  /** CSS object-position — keeps the subject framed on tall phones. */
  focalPoint: string;
  transitionMs: number;
};

export type Chapter = {
  id: string;
  storyId: string;
  /** 0-based order. */
  index: number;
  title: string;
};

export type Story = {
  id: string;
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  /** Shared AI-art style suffix — keeps illustrations visually consistent across beats. */
  stylePrompt: string | null;
  chapters: Chapter[];
  /** Flat and ordered by `index`; each beat points at its chapter. */
  beats: Beat[];
};
