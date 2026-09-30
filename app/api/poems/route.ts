import { NextResponse } from "next/server";

const API_URL = process.env.PYTHON_API_URL;

export async function GET(request: Request) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { error: "PYTHON_API_URL is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const poetId = searchParams.get("poet_id");

    if (!poetId) {
      return NextResponse.json(
        { error: "poet_id is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}?endpoint=poems&poet_id=${encodeURIComponent(poetId)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Python poems API failed:",
        response.status,
        errorText
      );

      return NextResponse.json(
        { error: "Failed to load poems" },
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