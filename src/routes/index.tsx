"use client";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import clsx from "clsx";
import { buttonVariants } from "@/components/ui/button";
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

import {
  systemMessageStore,
  currentSystemMessage,
} from "@/lib/system-message-store";
import { useStore } from "@tanstack/react-store";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadModels } from "../lib/loadModels";
import { ChatForm } from "@/components/chatForm/chatFrom";
import { SettingsModel } from "./settings-model";

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

 
