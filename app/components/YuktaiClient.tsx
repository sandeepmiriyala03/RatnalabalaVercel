"use client";
import type { ReactNode } from "react";
import { YuktAIWrapper } from "@yuktishaalaa/yuktai";

export default function YuktaiClient({ children }: { children: ReactNode }) {
  return (
    <YuktAIWrapper position="left" launcher showAccessibility showRag showAgent showVibeCoder engine="rust">
      {children}
    </YuktAIWrapper>
  );
}