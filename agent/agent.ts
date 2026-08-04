import { groq } from "@ai-sdk/groq";
import { defineAgent } from "eve";

export default defineAgent({
  model: groq("llama-3.1-8b-instant"),
});
