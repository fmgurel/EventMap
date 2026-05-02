import { NextResponse } from "next/server";
import { ingest } from "@/lib/pipeline";
import { getStoreInfo } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await ingest();
  return NextResponse.json(result);
}

export async function GET() {
  const info = await getStoreInfo();
  return NextResponse.json(info);
}
