import { NextResponse } from "next/server";

// Simple in-memory store for syncing between standard browser and Electron
let currentCode = "";
const pendingActions: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "action") {
    const actions = [...pendingActions];
    pendingActions.length = 0;
    return NextResponse.json({ actions });
  }

  return NextResponse.json({ code: currentCode });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.type === "update-code") {
      currentCode = body.code;
      return NextResponse.json({ success: true });
    }

    if (body.type === "trigger-action") {
      pendingActions.push(body.event);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
