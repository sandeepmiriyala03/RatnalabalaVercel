export const AGE_GROUPS = [
  { key: "all", label: "అన్నీ" },
  { key: "1-4", label: "1 – 4 సంవత్సరాలు" },
  { key: "5-7", label: "5 – 7 సంవత్సరాలు" },
  { key: "8-10", label: "8 – 10 సంవత్సరాలు" },
  { key: "11-15", label: "11 – 15 సంవత్సరాలు" },
] as const;

export type AgeKey = typeof AGE_GROUPS[number]["key"];

export const DEFAULT_AGE_KEY: AgeKey = "all";
export interface KathamalaStory {
  story_id: string;
  title: string;
  story_text: string[];
  age_group: AgeKey;
  author?: string;
  illustrator?: string;
}