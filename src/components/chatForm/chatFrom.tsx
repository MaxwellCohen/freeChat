"use client";
import { useState } from "react";
import clsx from "clsx";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Streamdown } from "streamdown";

import { Model } from "@openrouter/sdk/models/model";
import { useNonRefreshingQuery } from "@/hooks/useNonRefreshingQuery";
export function ChatForm({
  model,
  systemMessage,
}: {
  model: Model;
  systemMessage: string;
}) {
  const [messageText, setMessageText] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const { data: title, isLoading } = useNonRefreshingQuery(
    ["title", firstMessage],
    async () => {
      const res = await fetch("/api/title", {
        method: "POST",
        body: JSON.stringify({
          message: firstMessage,
          model: model.id,
        }),
      });
      if (!res.ok) {
        return "";
      }
      const data = await res.json();
      return data.title || "";
    },
    !!firstMessage
  );

  const chat = useChat({
    transport: new DefaultChatTransport({
      body: {
        model: model.id,
      },
    }),
    messages: systemMessage
      ? ([
          {
            id: "1",
            role: "system" as const,
            parts: [{ type: "text", text: systemMessage }],
          },
        ] as UIMessage<unknown, any, any>[])
      : undefined,
  });
  const { messages, sendMessage, status, error, regenerate } = chat;
  console.log(chat);
  return (
    <>
      <div className={clsx("flex flex-col overflow-y-auto")}>
        <h2 className={clsx("px-4 py-2 font-semibold text-lg")}>
          {title ? title : "New Chat"} {isLoading ? "loading" : ''}
        </h2>
        {messages.map((message) => {
          if (message.role === "system") {
            return (
              <details>
                <summary>System Message</summary>
                {message.parts.map((part, index) => {
                  if (part.type === "text" && part.text) {
                    return (
                      <div
                        className={clsx("border w-fit rounded-md p-2", {
                          "border-muted-foreground": message.role === "user",
                          "border-accent-foreground":
                            message.role === "assistant",
                        })}
                      >
                        <Streamdown
                          isAnimating={status === "streaming"}
                          key={index}
                        >
                          {part.text}
                        </Streamdown>
                      </div>
                    );
                  }
                  return null;
                })}
              </details>
            );
          }

          return (
            <div
              key={message.id}
              className={clsx("px-4 my-2", {
                "text-right self-end": message.role === "user",
                "text-left": message.role === "assistant",
              })}
            >
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text) {
                  return (
                    <div
                      className={clsx("border w-fit rounded-md p-2", {
                        "border-muted-foreground": message.role === "user",
                        "border-accent-foreground":
                          message.role === "assistant",
                      })}
                    >
                      <Streamdown
                        isAnimating={status === "streaming"}
                        key={index}
                      >
                        {part.text}
                      </Streamdown>
                    </div>
                  );
                }
                if (part.type === "data-usage" && part.data) {
                  const data = part.data;
                  return (
                    <div
                      className={clsx("border w-fit rounded-md p-2 my-2", {})}
                    >
                      <details>
                        <summary>Usage Data</summary>
                        <div className="flex flex-row justify-between gap-4">
                          <div>Input Tokens: {data.inputTokens}</div>
                          <div>Completion Tokens: {data.outputTokens}</div>
                          <div>Total Tokens: {data.totalTokens}</div>
                          <div>
                            Used Context Percentage:{" "}
                            {(
                              (data.totalTokens /
                                (model as any).context_length) *
                              100
                            ).toFixed(2)}
                            %
                          </div>
                          <div>Duration: {data.duration} ms</div>
                        </div>
                      </details>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        })}
        {status === "submitted" && <div>Please Wait...</div>}
        {status === "streaming" && <div>Getting data...</div>}
        {error && (
          <>
            <div>An error occurred.</div>
            <div>{error.message}</div>
            <button type="button" onClick={() => regenerate()}>
              Retry
            </button>
          </>
        )}
      </div>
      <form
        className={clsx(
          "flex flex-col items-center justify-between gap-4 flex-wrap border border-gray-700"
        )}
        onSubmit={(e) => {
          e.preventDefault();
          const cleanMessageText = messageText.trim();
          if (cleanMessageText) {
            const userMessageCount = messages.filter(
              (m) => m.role === "user"
            ).length;
            if (userMessageCount === 0) {
              setFirstMessage(cleanMessageText);
            }
            sendMessage({ text: cleanMessageText });
            setMessageText("");
          }
        }}
      >
        <Textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={status !== "ready"}
          placeholder="Say something..."
          className={clsx("flex-1")}
        />
        <Button
          className={clsx("rounded-full")}
          type="submit"
          disabled={status !== "ready"}
        >
          send
        </Button>
      </form>
    </>
  );
}
