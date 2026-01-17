let views = 0;

export async function POST() {
  views++;
  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({ views });
}
