import type { Story } from "../types";

/**
 * Phase 0's single hardcoded story — no DB yet. The prose is filler, but the *shapes* are
 * deliberate: beat lengths are uneven (beat 2 is two words, beat 4 is very long) because those are
 * the cases that break scroll-offset-based readers, and beat 3 opens chapter two so the chapter
 * boundary is exercised. Phase 1 seeds this same content into Postgres.
 */
export const demoStory: Story = {
  id: "demo",
  title: "The Lantern and the Long Way Home",
  subtitle: "A demo story, five beats long",
  coverUrl: "/stories/demo/beat-1.svg",
  stylePrompt: null,
  chapters: [
    { id: "demo-ch-1", storyId: "demo", index: 0, title: "The Leaving" },
    { id: "demo-ch-2", storyId: "demo", index: 1, title: "The Long Way" },
  ],
  beats: [
    {
      id: "demo-beat-1",
      storyId: "demo",
      chapterId: "demo-ch-1",
      index: 0,
      text:
        "The evening came down over the valley the way it always did, slowly and without asking. " +
        "She stood at the edge of the garden with the lantern unlit in her hand, and thought about " +
        "how far the road went before it turned.",
      imageUrl: "/stories/demo/beat-1.svg",
      imageAlt: "Dusk settling over a valley in deep violet",
      blurDataUrl: null,
      focalPoint: "50% 40%",
      transitionMs: 700,
    },
    {
      // Two words. The shortest beat a reader can meaningfully hold.
      id: "demo-beat-2",
      storyId: "demo",
      chapterId: "demo-ch-1",
      index: 1,
      text: "Then, morning.",
      imageUrl: "/stories/demo/beat-2.svg",
      imageAlt: "Pale amber morning light flooding a bright sky",
      blurDataUrl: null,
      focalPoint: "50% 50%",
      transitionMs: 1100,
    },
    {
      // Opens chapter two.
      id: "demo-beat-3",
      storyId: "demo",
      chapterId: "demo-ch-2",
      index: 2,
      text:
        "The water was colder than she expected, and deeper, and it held the light in a way that " +
        "made the whole crossing feel like something that had already happened once before.",
      imageUrl: "/stories/demo/beat-3.svg",
      imageAlt: "Dark teal water holding a single point of light",
      blurDataUrl: null,
      focalPoint: "50% 60%",
      transitionMs: 900,
    },
    {
      // Deliberately very long — several screens of text on one beat.
      id: "demo-beat-4",
      storyId: "demo",
      chapterId: "demo-ch-2",
      index: 3,
      text:
        "On the far bank there was a town, and in the town there was a street, and on the street " +
        "there was a door that had been painted so many times that none of the colours underneath " +
        "could be named any more. She knocked once and waited. Nothing. She knocked again and " +
        "counted to twenty, which is a long time to stand on a stranger's step with a lantern that " +
        "has burned down to almost nothing. Somewhere behind the door a chair moved. Then a voice " +
        "said a name — not hers, but close enough that she answered to it anyway, because it had " +
        "been a long road and she was tired and it is a strange comfort to be mistaken for someone " +
        "who is expected. The door opened the width of a hand. Warm air came out, and the smell of " +
        "bread, and the particular quiet of a room where someone has been sitting alone for a very " +
        "long while, waiting for a knock exactly like this one.",
      imageUrl: "/stories/demo/beat-4.svg",
      imageAlt: "A rose and warm grey doorway in low light",
      blurDataUrl: null,
      focalPoint: "60% 50%",
      transitionMs: 700,
    },
    {
      id: "demo-beat-5",
      storyId: "demo",
      chapterId: "demo-ch-2",
      index: 4,
      text:
        "And that, more or less, is how the long way home turned out to be the only way there had " +
        "ever been.",
      imageUrl: "/stories/demo/beat-5.svg",
      imageAlt: "Near-white light filling the whole frame",
      blurDataUrl: null,
      focalPoint: "50% 45%",
      transitionMs: 1400,
    },
  ],
};
