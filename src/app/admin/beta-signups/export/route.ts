import { NextResponse } from "next/server";
import { db } from "@/db";
import { betaSignups } from "@/db/schema";
import { desc } from "drizzle-orm";

// Gated by middleware.ts's ADMIN_PASSWORD check on the whole /admin path —
// this route needs no auth logic of its own.
export const dynamic = "force-dynamic";

function csvCell(value: string): string {
  // Quote whenever the value contains anything a plain comma-split would
  // misparse — commas, quotes, or newlines (notes are free text and can
  // contain any of these) — doubling embedded quotes per RFC 4180.
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const rows = await db.select().from(betaSignups).orderBy(desc(betaSignups.createdAt));

  const header = ["Name", "Email", "Describes them", "Interested in", "Skill focus", "Note", "Signed up"];
  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.name,
        row.email,
        row.describesYou,
        row.interestedIn,
        row.skillFocus ?? "",
        row.note ?? "",
        row.createdAt ? row.createdAt.toISOString() : "",
      ]
        .map((v) => csvCell(String(v)))
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="beta-signups.csv"',
    },
  });
}
