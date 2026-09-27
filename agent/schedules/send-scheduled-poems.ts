import { kv } from "@vercel/kv";
import { defineSchedule } from "eve/schedules";

type Subscription = {
  phone: string;
  time: string;
  frequency: "daily" | "six-hours";
  timezone: string;
  lastSentSlot?: string;
};

const SUBSCRIBER_INDEX = "ratnalabala:poem-subscription-tokens";
const SUBSCRIPTION_PREFIX = "ratnalabala:poem-subscription:";
const CONTENT_URL = process.env.POEM_CONTENT_BASE_URL ?? "https://ratnalabala.vercel.app";

function getLocalTime(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minute: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

function dueSlot(subscription: Subscription, now: Date) {
  const { date, minute } = getLocalTime(now, subscription.timezone);
  const [hour, minutes] = subscription.time.split(":").map(Number);
  const startMinute = hour * 60 + minutes;
  const elapsed = (minute - startMinute + 1440) % 1440;

  if (subscription.frequency === "daily") {
    return elapsed < 5 ? `${date}:daily` : null;
  }
  if (elapsed % 360 >= 5) return null;
  return `${date}:six-hours:${Math.floor(elapsed / 360)}`;
}

async function pickPoem() {
  const response = await fetch(`${CONTENT_URL}/api/poems`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Poem API returned ${response.status}`);
  const poems = await response.json() as Record<string, string>;
  const entries = Object.entries(poems).filter(([, text]) => typeof text === "string" && text.trim());
  if (!entries.length) throw new Error("No poems available for delivery");
  const [title, content] = entries[Math.floor(Math.random() * entries.length)];
  return { title, excerpt: content.trim().slice(0, 600) };
}

async function sendTemplate(phone: string, title: string, excerpt: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!accessToken || !phoneNumberId || !templateName) {
    throw new Error("WhatsApp Cloud API is not configured");
  }

  const version = process.env.WHATSAPP_GRAPH_API_VERSION ?? "v23.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone.replace(/\D/g, ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "te" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: title.slice(0, 200) },
            { type: "text", text: excerpt || "ఈరోజు పద్యం చదవండి." },
          ],
        }],
      },
    }),
  });
  if (!response.ok) {
    const error = await response.text().catch(() => "WhatsApp request failed");
    throw new Error(`WhatsApp API returned ${response.status}: ${error.slice(0, 300)}`);
  }
}

export default defineSchedule({
  cron: "*/5 * * * *",
  async run() {
    const tokens = await kv.smembers(SUBSCRIBER_INDEX) as string[];
    if (!tokens.length) return;

    const now = new Date();
    const due: Array<{ token: string; subscription: Subscription; slot: string }> = [];
    for (const token of tokens) {
      const raw = await kv.get(`${SUBSCRIPTION_PREFIX}${token}`);
      if (!raw) {
        await kv.srem(SUBSCRIBER_INDEX, token);
        continue;
      }
      try {
        const subscription = (typeof raw === "string" ? JSON.parse(raw) : raw) as Subscription;
        const slot = dueSlot(subscription, now);
        if (slot && slot !== subscription.lastSentSlot) due.push({ token, subscription, slot });
      } catch (error) {
        console.error("Invalid poem subscription record", error);
      }
    }
    if (!due.length) return;

    let poem: { title: string; excerpt: string };
    try {
      poem = await pickPoem();
    } catch (error) {
      console.error("Scheduled poem selection failed", error);
      return;
    }

    await Promise.all(due.map(async ({ token, subscription, slot }) => {
      const lockKey = `${SUBSCRIPTION_PREFIX}${token}:lock:${slot}`;
      const acquired = await kv.set(lockKey, "1", { nx: true, ex: 600 });
      if (!acquired) return;
      try {
        await sendTemplate(subscription.phone, poem.title, poem.excerpt);
        subscription.lastSentSlot = slot;
        await kv.set(`${SUBSCRIPTION_PREFIX}${token}`, JSON.stringify(subscription));
      } catch (error) {
        await kv.del(lockKey);
        console.error("Scheduled poem delivery failed", error);
      }
    }));
  },
});