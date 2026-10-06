import type { Metadata } from "next";
import PdfQA from "@/app/components/Pdfqa";

export const metadata: Metadata = {
  title: "PDF ప్రశ్నోత్తరి | రత్నాలబాల – జ్ఞానమాల",
  description: "మీ తెలుగు PDF అప్‌లోడ్ చేసి, దాని గురించి ప్రశ్నలు అడగండి. జవాబు మీ PDF నుండే, పేజీ సంఖ్యలతో.",
};

export default function PdfPrashnottariPage() {
  return <PdfQA />;
}