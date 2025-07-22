// lib/poems.ts
// This file runs ONLY on the server or during build time.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from 'remark';
import html from 'remark-html';

const poemsDir = path.join(process.cwd(), "poems");

export interface Poem {
  // We'll still include slug, useful for React list keys and a simple title if needed
  slug: string;
  contentHtml: string; // The full HTML content of the poem
}

// Helper to get slug from filename
function getSlugFromFileName(fileName: string): string {
  return fileName.replace(/\.md$/, '');
}

export async function getAllPoems(): Promise<Poem[]> { // Make this async now
  if (!fs.existsSync(poemsDir)) {
    console.warn(`Poems directory not found at: ${poemsDir}. Returning empty array.`);
    return [];
  }

  const files = fs.readdirSync(poemsDir);
  console.log(`Found ${files.length} Markdown files in ${poemsDir}`);

  const allPoemsData: Poem[] = [];

  for (const fileName of files) {
    const filePath = path.join(poemsDir, fileName);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContents);

    const slug = data.slug || getSlugFromFileName(fileName);
    if (!slug) {
        console.warn(`Could not determine slug for file: ${fileName}. Skipping.`);
        continue; // Skip this file if no slug can be determined
    }

    // Convert markdown content to HTML for direct display
    const processedContent = await remark().use(html).process(content);
    const contentHtml = processedContent.toString();

    allPoemsData.push({
      slug: slug,
      contentHtml: contentHtml,
      // If you re-introduce 'title' in front matter, you could add: title: data.title || 'Untitled Poem',
    });
  }

  return allPoemsData;
}

// You no longer need getPoemBySlug if you're displaying all on one page
// export async function getPoemBySlug(slug: string): Promise<Poem | null> { ... }