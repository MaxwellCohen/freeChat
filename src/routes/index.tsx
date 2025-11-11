import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import clsx from "clsx";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
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
        <div className={clsx("ml-4")}>model selector</div>
        <div className={clsx("flex-1")}>system message</div>
      </div>
      <div className={clsx("flex flex-col")}>
        chat body
      </div>
      <div
        className={clsx(
          "flex flex-col items-center justify-between gap-4 flex-wrap border border-gray-700"
        )}
      >
        <Textarea className={clsx("flex-1")} />
        <Button  className={clsx("rounded-full")}>send</Button>
      </div>
    </div>
  );
}
