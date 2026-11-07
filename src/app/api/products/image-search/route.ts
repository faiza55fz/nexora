
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PIXABAY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Pixabay API key is missing" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      image_type: "photo",
      category: "food",
      safesearch: "true",
      per_page: "12",
    });

    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image search failed" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      images: (data.hits || []).map((item: any) => ({
        id: item.id,
        preview: item.previewURL,
        image: item.largeImageURL || item.webformatURL,
        tags: item.tags,
        photographer: item.user,
        source: item.pageURL,
      })),
    });
  } catch (error) {
    console.error("Pixabay image search error:", error);

    return NextResponse.json(
      { error: "Something went wrong while searching images" },
      { status: 500 }
    );
  }
}
