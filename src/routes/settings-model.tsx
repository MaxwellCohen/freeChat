import { startTransition, useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useConfirm } from "@/components/ui/confirm"
import { systemMessageStore, currentSystemMessage } from "@/lib/system-message-store"
import { useStore } from "@tanstack/react-store"
import { Settings } from "lucide-react"

export function SettingsModel() {
  const confirm = useConfirm()
  const systemMessageStoreState = useStore(systemMessageStore)
  const systemMessage = useStore(currentSystemMessage)
  const [systemMessageState, setSystemMessageState] = useState({
    name: "",
    systemMessage: systemMessage,
  })

  function findSystemMessage(name: string) {
    return systemMessageStoreState.savedSystemMessages.find(
      (message) => message.name === name,
    )
  }
  useEffect(() => {
    if (systemMessage !== systemMessageState.systemMessage) {
      setSystemMessageState({
        name: systemMessage,
        systemMessage: systemMessage,
      })
    }
  }, [systemMessage])

  console.log(systemMessageStoreState)
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
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const name = (formData.get("systemMessageName") as string).trim()
            const content = (formData.get("systemMessage") as string).trim()
            const existing = findSystemMessage(name)
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
            }))
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="systemMessageSelect">Saved System Messages:</Label>
          <Select
            value={systemMessageState.name}
            onValueChange={(name) => {
              const found = findSystemMessage(name)
              if (!found) {
                return
              }
              setSystemMessageState({
                name,
                systemMessage: found?.systemMessage || "",
              })
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
                const value = e.target.value
                setSystemMessageState(() => ({
                  name: value,
                  systemMessage: findSystemMessage(value)?.systemMessage || "",
                }))
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
                startTransition(async () => {
                  const ok = await confirm({
                    title: "Delete system message",
                    description: (
                      <span>
                        Are you sure you want to delete “{systemMessageState.name}”?
                      </span>
                    ),
                    confirmText: "Delete",
                    cancelText: "Cancel",
                    destructive: true,
                  })
                  if (!ok) return
                  systemMessageStore.setState((prev) => ({
                    savedSystemMessages: prev.savedSystemMessages.filter(
                      (msg) => msg.name !== systemMessageState.name,
                    ),
                    currentSystemMessage:
                      prev.currentSystemMessage === systemMessageState.name
                        ? ""
                        : prev.currentSystemMessage,
                  }))
                  setSystemMessageState({ name: "", systemMessage: "" })
                })
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
  )
}

