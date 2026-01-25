export interface KathamalaStory {
  story_id: string;
  age_group: "all" | "1-4" | "5-7" | "8-10" | "11-15";
  title: string;
  story_text: string[];
  moral: string;
}
