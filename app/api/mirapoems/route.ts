import { NextResponse } from "next/server";

/**
 * API: /api/poems
 *
 * This Next.js API route now gets poems from
 * the Python backend instead of reading Markdown files.
 *
 * Response:
 *
 * {
 *   "అసహనం": "poem content...",
 *   "దయ": "poem content...",
 *   ...
 * }
 */

export async function GET() {
  try {
    // --------------------------------------------------------
    // Call Python main.py
    //
    // Python endpoint:
    //
    // /api/main?endpoint=mirapoems
    //
    // Python will get the poems from PostgreSQL.
    // --------------------------------------------------------

    const apiUrl =
      `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}` +
      `/api/main?endpoint=mirapoems`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    // --------------------------------------------------------
    // Check whether Python API returned an error
    // --------------------------------------------------------

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to load poems from Python API",
        },
        {
          status: response.status,
        }
      );
    }

    // --------------------------------------------------------
    // Read JSON returned by Python
    // --------------------------------------------------------

    const poems = await response.json();

    // --------------------------------------------------------
    // Return poems to your React component
    // --------------------------------------------------------

    return NextResponse.json(poems);

  } catch (error) {

    console.error(
      "Error loading poems:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load poems",
      },
      {
        status: 500,
      }
    );
  }
}