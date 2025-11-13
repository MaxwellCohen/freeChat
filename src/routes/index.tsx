"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import clsx from "clsx";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


import { Model } from "@openrouter/sdk/models/model";

async function loadModels() {
  "use server";
  const url =
    "https://openrouter.ai/api/v1/models?max_price=0&order=latency-low-to-high";
  const options = {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}` },
  };
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!Array.isArray(data?.data)) {
      return [];
    }
    return data.data.filter(
      (model: Model) => {
        const price = new Set(Object.values(model.pricing))
        if (price.size !== 1) {
          return false;
        } 
        return (+[...price][0] === 0);
      }
    ) as Array<Model>;
  } catch (error) {
    console.error(error);
  }
}

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    const modelList = await loadModels();
    return modelList;
  },
});

function App() {
  const data = Route.useLoaderData();
  const [selectedModelIndex, setSelectedModelIndex] = useState("0");
  const [systemMessage, setSystemMessage] = useState("You are a helpful assistant.");
  console.log("data", data);
  console.log("selected Model", selectedModelIndex);
  const model = data?.[Number(selectedModelIndex)];
  const modelID= model?.id || "";
  console.log(model)
  return (
    <div
      className={clsx(
        "grid grid-cols-1 border border-gray-700 rounded-md grid-rows-[auto_1fr_auto] h-screen"
      )}
    >
      <div
        className={clsx(
          "flex flex-row items-center justify-between gap-4 flex-wrap border border-gray-700"
        )}
      >
        <SidebarTrigger className="self-start shrink-0" />
        <div className={clsx("flex-1")}>
        <div className="flex flex-row gap-2 items-center mb-2">
        <label htmlFor="modelSelect">Select a model:</label>
        <Select  onValueChange={setSelectedModelIndex} value={selectedModelIndex}>
          <SelectTrigger id="modelSelect" className="w-[280px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {data?.map((model, index) => (
              <SelectItem key={model.id} value={`${index}`}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        {
          model ? (
            <Popover >
                <PopoverTrigger className={buttonVariants({ variant: "secondary" })}>More info for {model?.name}</PopoverTrigger>
                <PopoverContent className="w-[calc(var(--radix-popper-available-width)*.75)] ">
                  <div>
                    <span className="font-bold">Model ID: </span>
                    {model.id}
                  </div>
                  
                  <div>
                    <span className="font-bold">Model Name: </span>
                    {model.name}
                  </div>
                  <div>
                    <span className="font-bold">Context: </span>
                    {
                    // @ts-expect-error
                  model.context_length
                  }
                  </div>
                  <div>
                    <span className="font-bold">Created: </span>
                    {new Date(model.created * 1000).toLocaleDateString()} 
                  </div>
                  <div>
                    <span className="font-bold">Model Input Modalities: </span>
                    {
                    // @ts-expect-error
                    model.architecture.input_modalities.join(", ")
                    }
                  </div>
                  <div>
                    <span className="font-bold">Model Output Modalities: </span>
                    {
                    // @ts-expect-error
                    model.architecture.output_modalities.join(", ")
                    }
                  </div>
                  <div>
                    
                    {model?.description}
                  </div>
                </PopoverContent>
            </Popover>
          ): null
        }
        </div>
        <div className="flex flex-col flex-1">

        <label htmlFor="systemMessage">System Message:</label>
        <Textarea id="systemMessage" className={clsx("flex-1")} value={systemMessage} onChange={(e) => setSystemMessage(e.target.value)}></Textarea>
        </div>
      </div>
      <ChatForm modelId={modelID} key={modelID} />
    </div>
  );
}

function ChatForm({ modelId }: { modelId: string }) {
  const [messageText, setMessageText] = useState("");
  const { messages, sendMessage, status, error, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: modelId,
      },
    }),
  });

  return (
    <>
      <div className={clsx("flex flex-col overflow-y-auto")}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx("px-4 my-2", {
              "text-right self-end": message.role === "user",
              "text-left": message.role === "assistant",
            })}
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div
                    className={clsx("border-1 w-fit rounded-md p-2", {
                      "border-muted-foreground": message.role === "user",
                      "border-accent-foreground": message.role === "assistant",
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
          </div>
        ))}
        {status === "submitted" && (
          <div>Please Wait...</div>
        )}
        {status === "streaming" && (
          <div>Getting data...</div>
        )}
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
          if (messageText.trim()) {
            sendMessage({ text: messageText });
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
