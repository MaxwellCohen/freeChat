import { createFileRoute } from "@tanstack/react-router";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const openRouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export const Route = createFileRoute("/api/title")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const req = await request.json();
          const { message, model } = req as { message: string; model: string };
          if (!message || !model) {
            return new Response(
              JSON.stringify({ error: "Invalid request" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const prompt = `Generate a concise chat title (4-8 words) based on this first user message. Avoid quotes and punctuation beyond letters and spaces. Title:
${message}`;

          const { text } = await generateText({
            model: openRouter.chat(model),
            prompt,
          });

          const title = text.trim().replace(/["'`]/g, "").slice(0, 80);
          return new Response(
            JSON.stringify({ title }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Failed to generate title" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});

