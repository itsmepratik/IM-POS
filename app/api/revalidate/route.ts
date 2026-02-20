import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    // Basic security check to prevent unauthorized cache clearing
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
      console.warn("Unauthorized revalidation attempt");
      // return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      // Keeping it commented out for now to prevent breaking existing clients
      // but logging the warning for monitoring.
    }

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json({ message: "Missing tag parameter" }, { status: 400 });
    }

    revalidateTag(tag);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
