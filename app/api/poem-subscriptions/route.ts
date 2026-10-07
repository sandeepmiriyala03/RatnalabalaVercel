import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";


type Frequency = "daily" | "six-hours";

type Subscription = {
  phone: string;
  time: string;
  frequency: Frequency;
  timezone: string;
  lastSentSlot?: string;
};

const SUBSCRIBER_INDEX = "ratnalabala:poem-subscription-tokens";
const SUBSCRIPTION_PREFIX = "ratnalabala:poem-subscription:";

function getToken(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

function getSubscriptionKey(token: string) {
  return `${SUBSCRIPTION_PREFIX}${token}`;
}

function parseSubscription(value: unknown): Subscription | null {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" ? parsed as Subscription : null;
  } catch {
    return null;
  }
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "చెల్లని సెషన్." }, { status: 401 });

  const subscription = parseSubscription(await kv.get(getSubscriptionKey(token)));
  if (!subscription) return NextResponse.json({ enabled: false });

  return NextResponse.json({ enabled: true, ...subscription });
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "చెల్లని సెషన్." }, { status: 401 });

  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_TEMPLATE_NAME) {
    return NextResponse.json(
      { error: "సైట్ నిర్వాహకుడు WhatsApp Cloud APIని ఇంకా అమర్చలేదు." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[\s()-]/g, "") : "";
  const time = typeof body?.time === "string" ? body.time : "";
  const frequency = body?.frequency as Frequency;
  const timezone = typeof body?.timezone === "string" ? body.timezone : "";

  if (body?.consent !== true) {
    return NextResponse.json({ error: "పంపడానికి మీ సమ్మతి అవసరం." }, { status: 400 });
  }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return NextResponse.json({ error: "దేశ కోడ్‌తో సరైన నంబర్ ఇవ్వండి. ఉదా: +919876543210" }, { status: 400 });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NextResponse.json({ error: "సరైన సమయాన్ని ఎంచుకోండి." }, { status: 400 });
  }
  if (frequency !== "daily" && frequency !== "six-hours") {
    return NextResponse.json({ error: "సరైన పంపే వ్యవధిని ఎంచుకోండి." }, { status: 400 });
  }
  if (!isValidTimezone(timezone)) {
    return NextResponse.json({ error: "మీ టైమ్‌జోన్‌ను గుర్తించలేకపోయాం." }, { status: 400 });
  }

  const subscription: Subscription = { phone, time, frequency, timezone };
  await kv.set(getSubscriptionKey(token), JSON.stringify(subscription));
  await kv.sadd(SUBSCRIBER_INDEX, token);
  return NextResponse.json({ enabled: true });
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: "చెల్లని సెషన్." }, { status: 401 });

  await kv.del(getSubscriptionKey(token));
  await kv.srem(SUBSCRIBER_INDEX, token);
  return NextResponse.json({ enabled: false });
}
