import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  systemMessageStore,
  currentSystemMessage,
} from "@/lib/system-message-store";
import { useStore } from "@tanstack/react-store";
import { Button } from "./ui/button";
import clsx from "clsx";
import { Trash2 } from "lucide-react";

export function AppSidebar() {
  const systemMessageStoreState = useStore(systemMessageStore);
  const currentSystemMessageState = useStore(currentSystemMessage);
  console.log(currentSystemMessageState);
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Saved System Messages</SidebarGroupLabel>
          <Button
            variant={"ghost"}
            className={clsx("justify-start", {
              "bg-accent": !systemMessageStoreState.currentSystemMessage,
            })}
            onClick={() => {
              systemMessageStore.setState(() => ({
                currentSystemMessage: "",
                savedSystemMessages:
                  systemMessageStoreState.savedSystemMessages,
              }));
            }}
          >
            No Special System Message
          </Button>
          {systemMessageStoreState.savedSystemMessages.map((systemMessage) => (
            <div key={systemMessage.name} className="flex w-full items-center overflow-hidden mt-2">

            <Button
              key={systemMessage.name}
              variant={"ghost"}
              className={clsx("justify-start flex-1 truncate", {
                "bg-accent":
                systemMessage.name ===
                systemMessageStoreState.currentSystemMessage,
              })}
              onClick={() => {
                systemMessageStore.setState(() => ({
                  currentSystemMessage: systemMessage.name,
                  savedSystemMessages:
                  systemMessageStoreState.savedSystemMessages,
                }));
              }}
              title={systemMessage.name}
              >
              {systemMessage.name}
            </Button>
            <Button
              variant={"ghost"}
              size={"icon"}
              className="size-6"
              onClick={() => {
                systemMessageStore.setState(() => ({
                  currentSystemMessage: systemMessageStoreState.currentSystemMessage === systemMessage.name ? "" : systemMessageStoreState.currentSystemMessage,
                  savedSystemMessages: systemMessageStoreState.savedSystemMessages.filter(
                    (sm) => sm.name !== systemMessage.name
                  ),
                }));
              }}
              title={`Delete ${systemMessage.name}`}
            >
              <Trash2 className="text-destructive " />
              <span className="sr-only">Delete</span>
            </Button>
              </div>
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
