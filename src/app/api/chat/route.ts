import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages, systemPrompt } = await request.json();

    const apiKey = process.env.CUSTOM_LLM_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.CUSTOM_LLM_BASE_URL;
    const model = process.env.CUSTOM_LLM_MODEL || "gpt-4o";

    if (!apiKey) {
      console.warn("Warning: Neither CUSTOM_LLM_API_KEY nor OPENAI_API_KEY environment variable is set.");
      return NextResponse.json(
        { error: "No API key provided. Please set CUSTOM_LLM_API_KEY or OPENAI_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    // Format messages for OpenAI Chat Completion
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model,
      messages: apiMessages,
      stream: true,
      temperature: 0.1,
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        const textEncoder = new TextEncoder();
        try {
          let accumulatedContent = "";
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              accumulatedContent += content;
              const payload = JSON.stringify({ type: "content", content: accumulatedContent });
              controller.enqueue(textEncoder.encode(payload + "\n"));
            }
          }
          controller.close();
        } catch (e) {
          console.error("Error in OpenAI streaming loop:", e);
          controller.error(e);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("API Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
