import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "*/5 * * * *",
  markdown: "pick_rotating_content tool వాడి, ప్రస్తుత సమయపు 6-గంటల స్లాట్‌కు తగిన కంటెంట్ ఎంచుకుని నిల్వ చేయి.",
})