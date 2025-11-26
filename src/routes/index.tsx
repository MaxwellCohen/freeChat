"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  DialogTitle,
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
import { useQuery } from "@tanstack/react-query";
import { loadModels } from "../lib/loadModels";
import { ChatForm } from "@/components/chatForm/chatFrom";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [selectedModelIndex, setSelectedModelIndex] = useState("0");
  const systemMessage = useStore(currentSystemMessage);
  const store = useStore(systemMessageStore);
  const { data, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: loadModels,
  });
  const model = data?.[Number(selectedModelIndex)];
  console.log(model);
  if (isLoading) {
    return <div>Loading Page</div>;
  }

  if (!model) {
    return <div>Error Loading Model</div>;
  }
  const modelID = model?.id || "";
  return (
    <div
      className={clsx(
        "grid grid-cols-1 border border-gray-700 rounded-md grid-rows-[auto_1fr_auto] h-screen",
      )}
    >
      <div
        className={clsx(
          "flex flex-row items-center gap-4 flex-wrap border border-gray-700",
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
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "size-7",
            })}
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

      <ChatForm
        model={model}
        key={`${systemMessage}${modelID}`}
        systemMessage={systemMessage}
      />
    </div>
  );
}

function SettingsModel() {
  const systemMessageStoreState = useStore(systemMessageStore);
  const systemMessage = useStore(currentSystemMessage);
  const [systemMessageState, setSystemMessageState] = useState({
    name: "",
    systemMessage: systemMessage,
  });

  function findSystemMessage(name: string) {
    return systemMessageStoreState.savedSystemMessages.find(
      (message) => message.name === name,
    );
  }
  useEffect(() => {
    if (systemMessage !== systemMessageState.systemMessage) {
      setSystemMessageState({
        name: systemMessage,
        systemMessage: systemMessage,
      });
    }
  }, [systemMessage]);

  console.log(systemMessageStoreState);
  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Settings className="inline-block w-4 h-4" />
        <span className="sr-only">Settings </span>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>System Message Settings</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = (formData.get("systemMessageName") as string).trim();
            const content = (formData.get("systemMessage") as string).trim();
            const existing = findSystemMessage(name);
            systemMessageStore.setState((prev) => ({
              savedSystemMessages: existing
                ? prev.savedSystemMessages.map((message) =>
                    message.name === name
                      ? { ...message, systemMessage: content }
                      : message,
                  )
                : [
                    ...prev.savedSystemMessages,
                    { name, systemMessage: content },
                  ],
              currentSystemMessage: name || "",
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
                setSystemMessageState(() => ({
                  name: value,
                  systemMessage: findSystemMessage(value)?.systemMessage || "",
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
          <div className="grid grid-cols-[1fr_1fr_2fr] gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete “${systemMessageState.name}”?`,
                  )
                ) {
                  systemMessageStore.setState((prev) => ({
                    savedSystemMessages: prev.savedSystemMessages.filter(
                      (msg) => msg.name !== systemMessageState.name,
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
              <Button
                type="button"
                onClick={() =>
                  systemMessageStore.setState((prev) => ({
                    currentSystemMessage: "",
                    savedSystemMessages: prev.savedSystemMessages,
                  }))
                }
              >
                Clear
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">Save</Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
