import { createFileRoute } from "@tanstack/react-router";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText } from "ai";
import { loadModels } from "../../lib/loadModels";

const SYSTEM_MESSAGE =
  "You are a helpful assistant. Text can be formatted in markdown.";

const openRouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let usageData: {
            data: any;
          };
          const start = Date.now();
          const req = await request.json();
          const { messages, model } = req;
          const models = await loadModels();
          const modelData = models?.find((m) => m.id === model);
          if (!modelData) {
            return new Response(
              JSON.stringify({ error: "Failed to load models" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          const updatedMessages = convertToModelMessages(messages);
          console.log("req", req);
          const result = streamText({
            model: openRouter.chat(model),
            system: SYSTEM_MESSAGE,
            messages: updatedMessages,
            onStepFinish: ({ usage }) => {
              usageData = {
                data: { ...usage, duration: Date.now() - start, start: start },
              };
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
                // @ts-ignore
                for await (const chunk of textResponse.body) {
                  controller.enqueue(chunk);
                }
                if (usageData) {
                  controller.enqueue(
                    makeSteamObject({ type: "data-usage", ...usageData })
                  );
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

const encoder = new TextEncoder();
function makeSteamObject(data: any) {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}
