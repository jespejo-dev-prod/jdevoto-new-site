import { prisma } from "@/lib/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const EventSchema = z.object({
  eventType: z.string(),
  eventData: z.any().optional(),
  pageUrl: z.string(),
  referrer: z.string().optional().nullable(),
  sessionId: z.string()
});

const EventsBatchSchema = z.object({
  events: z.array(EventSchema).max(100)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = EventsBatchSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || null;
    const userAgent = req.headers.get("user-agent") || null;
    const userId = req.headers.get("x-user-id") || null;

    const eventsToCreate = result.data.events.map(event => ({
      ...event,
      ipAddress,
      userAgent,
      userId
    }));

    await prisma.analyticsEvent.createMany({
      data: eventsToCreate
    });

    return NextResponse.json({ received: eventsToCreate.length });
  } catch (error) {
    console.error("Error creating analytics events:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
