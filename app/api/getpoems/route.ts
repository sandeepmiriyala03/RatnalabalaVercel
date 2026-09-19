import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const poetId = request.nextUrl.searchParams.get("poet_id");

    if (!poetId) {
      return NextResponse.json(
        { error: "poet_id is required" },
        { status: 400 }
      );
    }

    const apiUrl =
      `https://ratnalabala.vercel.app/api/main?endpoint=poems&poet_id=${encodeURIComponent(poetId)}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to load poems from Python API" },
        { status: response.status }
      );
    }

    const poems = await response.json();

    return NextResponse.json(poems);
  } catch (error) {
    console.error("Error loading poems:", error);

    return NextResponse.json(
      { error: "Failed to load poems" },
      { status: 500 }
    );
  }
}