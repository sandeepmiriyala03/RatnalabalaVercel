"use client";

/* మిరా పద్యాలు — శతకాలమాల లాగే అదే PoemBrowser (poet_id 2) */

import PoemBrowser from "@/app/components/PoemBrowser";

export default function PoemList() {
  return (
    <PoemBrowser
      poetId={2}
      poetryName="మిరా పద్యాలు"
      authors="డాక్టర్ మిరియాల రామకృష్ణ"
      toolName="mira_poems"
      heading="మిరా పద్యాలు"
    />
  );
}