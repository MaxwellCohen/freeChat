import { createFileRoute } from "@tanstack/react-router";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { convertToModelMessages, streamText, createIdGenerator } from "ai";


const openRouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

function getChatID() {
  return createIdGenerator({
    prefix: "chat",
    size: 25,
  })();
}


export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let usageData: any;
          const start = Date.now();
          const req = await request.json();
          const {
            messages,
            model,
            system = "",
          } = req;

          const updatedMessages = convertToModelMessages(messages);
          console.log("req", req);
          // console.log("model", model);
          const result = streamText({
            model: openRouter.chat(model),
            system: "You are a helpful assistant. Text must be returned in markdown format.",
            messages:
              updatedMessages,
            providerOptions: {
              reasoning: { enabled: false },
            },
            
            onStepFinish: ({ usage, ...props }) => {
              console.log("props", JSON.stringify(props));
              // @ts-ignore
              const systemMessage = props?.request?.body?.messages?.find((message: any) => message.role === "system")?.content || system;
              usageData = {data: {...usage, duration: Date.now() - start, systemMessage}};
            },
          });
          const textResponse = result.toUIMessageStreamResponse();

          const addInUsageDataMessage = new ReadableStream({
            async start(controller) {
              try {
                if (!textResponse.body) {
                  controller.close();
                  return;
                }

                const reader = textResponse.body.getReader();
                let usageInjected = false;

                while (true) {
                  const { done, value } = await reader.read();

                  // Inject usage data once
                  if (!usageInjected && usageData) {
                    controller.enqueue(
                      addData({ type: "data-usage", ...usageData })
                    );
                    usageInjected = true;
                  }

                  if (done) break;
                  controller.enqueue(value);
                }

                controller.close();
              } catch (err) {
                controller.error(err);
              }
            },
          });

          return new Response(addInUsageDataMessage);
        } catch (error) {
          console.error("Chat API error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to process chat request" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});

function addData(data: any) {
  const encoder = new TextEncoder();
  const mainData = encoder.encode(
    `data: ${JSON.stringify(data)}\n\n`
  );
  return mainData;
}
