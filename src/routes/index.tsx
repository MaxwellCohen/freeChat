"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import clsx from "clsx";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
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
} from "@/components/ui/popover";

import { Model } from "@openrouter/sdk/models/model";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  systemMessageStore,
  currentSystemMessage,
} from "@/lib/system-message-store";
import { useStore } from "@tanstack/react-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Info, Settings } from "lucide-react";
import { createServerFn } from '@tanstack/react-start'
import { useQuery } from "@tanstack/react-query";

const loadModels = createServerFn({method: "GET"}).handler( async () => {
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
    return data.data.filter((model: Model) => {
      const price = new Set(Object.values(model.pricing));
      if (price.size !== 1) {
        return false;
      }
      return +[...price][0] === 0;
    }) as Array<Model>;
  } catch (error) {
    console.error(error);
  }
})

export const Route = createFileRoute("/")({
  component: App,
  loader: async () =>  loadModels()
});

function App() {
  const data = Route.useLoaderData();
  
  const [selectedModelIndex, setSelectedModelIndex] = useState("0");
  const systemMessage = useStore(currentSystemMessage);
  const store = useStore(systemMessageStore);
  const model = data?.[Number(selectedModelIndex)];
  const modelID = model?.id || "";
  console.log(model);
  if (!model) {
    return null;
  }
  return (
    <div
      className={clsx(
        "grid grid-cols-1 border border-gray-700 rounded-md grid-rows-[auto_1fr_auto] h-screen"
      )}
    >
      <div
        className={clsx(
          "flex flex-row items-center gap-4 flex-wrap border border-gray-700"
        )}
      >
        <SidebarTrigger className="shrink-0" />
          <div className="contents">
            <label htmlFor="modelSelect">Model:</label>
            <Select
              onValueChange={setSelectedModelIndex}
              value={selectedModelIndex}
            >
              <SelectTrigger id="modelSelect" className="field-sizing-content">
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
          <Popover>
            <PopoverTrigger
              className={buttonVariants({ variant: "ghost", size: "icon", className: "size-7" })}
            >
              <Info className="inline-block w-4 h-4" />
              <span className="sr-only">Model Info </span>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(var(--radix-popper-available-width)*.75)] h-[500px] overflow-auto">
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

                <pre className="h-500 overflow-auto">
                  {JSON.stringify(model, null, 2)}
                </pre>
              </div>
            </PopoverContent>
          </Popover>
          <SettingsModel />
          <div> {store.currentSystemMessage}</div>
        </div>
    
      <ChatForm modelId={modelID} key={`${systemMessage}${modelID}`} systemMessage={systemMessage} />
    </div>
  );
}

function SettingsModel() {
  const systemMessage = useStore(currentSystemMessage);
  const systemMessageStoreState = useStore(systemMessageStore);
  const [systemMessageState, setSystemMessageState] = useState({
    name: systemMessageStoreState.currentSystemMessage,
    systemMessage: systemMessage,
  });

  function findSystemMessage(name: string) {
    return systemMessageStoreState.savedSystemMessages.find(
      (message) => message.name === name
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Settings className="inline-block w-4 h-4" />
        <span className="sr-only">Settings </span>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = (
              e.currentTarget.elements.namedItem(
                "systemMessageName"
              ) as HTMLInputElement
            ).value.trim();
            const content = (
              e.currentTarget.elements.namedItem(
                "systemMessage"
              ) as HTMLTextAreaElement
            ).value.trim();
            if (!name) return;
            const existing = findSystemMessage(name);
            systemMessageStore.setState((prev) => ({
              savedSystemMessages: existing
                ? prev.savedSystemMessages.map((message) =>
                    message.name === name
                      ? { ...message, systemMessage: content }
                      : message
                  )
                : [
                    ...prev.savedSystemMessages,
                    { name, systemMessage: content },
                  ],
              currentSystemMessage: name,
            }));
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="systemMessageSelect">Saved System Messages:</Label>
          <Select
            value={systemMessageState.name}
            onValueChange={(name) => {
              const found = findSystemMessage(name);
              if (!found) {
                return;
              }
              setSystemMessageState({
                name,
                systemMessage: found?.systemMessage || "",
              });
            }}
          >
            <SelectTrigger id="systemMessageSelect" className="w-full">
              <SelectValue placeholder="Pick a saved message" />
            </SelectTrigger>
            <SelectContent>
              {systemMessageStoreState.savedSystemMessages.map((msg) => (
                <SelectItem key={msg.name} value={msg.name}>
                  {msg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label htmlFor="systemMessageName">System Message Name</Label>
          <div className="flex gap-2">
            <Input
              id="systemMessageName"
              name="systemMessageName"
              className="flex-1"
              value={systemMessageState.name}
              onChange={(e) => {
                const value = e.target.value;
                setSystemMessageState((prev) => ({
                  name: value,
                  systemMessage:
                    findSystemMessage(value)?.systemMessage ||
                    prev.systemMessage,
                }));
              }}
              placeholder="e.g. Helpful Assistant"
              required
              autoComplete="off"
              list="savedSystemMessages"
            />
            <datalist id="savedSystemMessages">
              {systemMessageStoreState.savedSystemMessages.map((msg) => (
                <option key={msg.name} value={msg.name}>
                  {msg.name}
                </option>
              ))}
            </datalist>
          </div>
          <Label htmlFor="systemMessage">System Message:</Label>
          <Textarea
            id="systemMessage"
            name="systemMessage"
            className="flex-1"
            value={systemMessageState.systemMessage}
            onChange={(e) =>
              setSystemMessageState({
                name: systemMessageState.name,
                systemMessage: e.target.value,
              })
            }
            placeholder="You are a helpful assistant…"
            required
          />
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete “${systemMessageState.name}”?`
                  )
                ) {
                  systemMessageStore.setState((prev) => ({
                    savedSystemMessages: prev.savedSystemMessages.filter(
                      (msg) => msg.name !== systemMessageState.name
                    ),
                    currentSystemMessage:
                      prev.currentSystemMessage === systemMessageState.name
                        ? ""
                        : prev.currentSystemMessage,
                  }));
                  setSystemMessageState({ name: "", systemMessage: "" });
                }
              }}
            >
              Delete
            </Button>
            <DialogClose asChild>
              <Button type="submit">Save</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChatForm({
  modelId,
  systemMessage,
}: {
  modelId: string;
  systemMessage: string;
}) {
  const [messageText, setMessageText] = useState("");
  

  const chat = useChat({
    transport: new DefaultChatTransport({
      body: {
        model: modelId,
      },
    }),
    onFinish: (...args) => {
      console.log('finished message', ...args);
    },
    messages: [
      {
        id: "1",
        role: "system" as const,
        parts: [{ type: "text", text: systemMessage }],
      },
    ] as UIMessage<unknown, any, any>[] 
  });
  const { messages, sendMessage, status, error, regenerate } = chat;
  console.log(chat);
  return (
    <>
      <div className={clsx("flex flex-col overflow-y-auto")}>
        {messages.map((message) => {
          if (message.role === "system") {
            return <details>
              <summary>System Message</summary>
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text) {
                  return (
                    <div
                      className={clsx("border w-fit rounded-md p-2", {
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
            </details>;
          }


          return(<div
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
              if (part.type === "data-usage" && part.data) {
                return (
                  <div className={clsx("border w-fit rounded-md p-2 my-2", {})}>
                    <details>
                      <summary>Usage Data</summary>
                      <pre>{JSON.stringify(part.data, null, 2)}</pre>
                    </details>
                  </div>
                );
              }
              return (
                <details>
                  <summary>Message</summary>
                  <pre>{JSON.stringify(message, null, 2)}</pre>
                </details>
              );
            })}
          </div>
        )})}
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
