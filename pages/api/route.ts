import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json(
      {
        error: {
          code: 405,
          message: "Method Not Allowed",
        },
      },
      {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      },
    );
  }
  let bugSolver = "";
  function dataParser(data: string): any {
    bugSolver = "";
    data = data.trim();
    if (data === "" || data === "[DONE]") {
      return "[PASS]";
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      console.log("[ERROR]", data);
      bugSolver = data;
      return "[BROKEN]";
    }
  }
  try {
    const json = await req.json();
    let {
      model,
      messages,
      apikey,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      max_tokens,
    } = json;

    if (!model || model === null) {
      model = "gpt-4o-mini";
    }
    if (!apikey || apikey === null || apikey.length == 0) {
      apikey = process.env.OPENAI_API_KEY;
    }
    if (!top_p || top_p === null) {
      top_p = 0.9;
    }
    if (!presence_penalty || presence_penalty === null) {
      presence_penalty = 0;
    }
    if (!frequency_penalty || frequency_penalty === null) {
      frequency_penalty = 0;
    }
    if (!max_tokens || max_tokens === null) {
      max_tokens = 2000;
    }
    if (!temperature || temperature === null) {
      temperature = 0.4;
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // 等待0.5秒钟

    console.log("fetching resp...");

    let fetchResult = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apikey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
          max_tokens: max_tokens,
          stream: true,
          n: 1,
        }),
      },
    );

    console.log("start streaming...");

    // 生成一个 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        try {
          for await (const chunk of fetchResult.body as any as IterableIterator<Uint8Array>) {
            let value = bugSolver + decoder.decode(chunk);
            // console.log(value);
            value.split("data: ").forEach((item) => {
              const event = dataParser(item);
              if (event !== "[PASS]" && event !== "[BROKEN]") {
                if ("error" in event) {
                  // 报错
                  controller.enqueue(encoder.encode("\n```json\n"));
                  controller.enqueue(
                    encoder.encode(JSON.stringify(event, undefined, 2)),
                  );
                  controller.enqueue(encoder.encode("\n```"));
                  controller.close();
                } else if (event.choices[0].finish_reason === "stop") {
                  controller.close();
                } else {
                  controller.enqueue(
                    encoder.encode(event.choices[0].delta?.content),
                  );
                }
              }
            });
          }
        } catch (error) {
          controller.enqueue(encoder.encode("\n```json\n"));
          controller.enqueue(
            encoder.encode(
              `TypeError: NetworkError while fetching data stream: ${error}`,
            ),
          );
          controller.enqueue(encoder.encode("\n```"));
          console.error("Network Error:", error);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
        "Content-Encoding": "none",
      },
    });
  } catch (error) {
    console.error("Network Error:", error);
    return NextResponse.json({
      error: {
        code: 401,
        message: "Network error when fetching resource!",
      },
    });
  }
}
