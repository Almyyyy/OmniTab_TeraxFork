import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileExplorer, type FileExplorerHandle } from "@/modules/explorer";
import type { HostDraft, HostProfile } from "@/modules/hosts/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  FolderTreeIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  ServerStack02Icon,
} from "@hugeicons/core-free-icons";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { RemoteFileExplorer } from "./RemoteFileExplorer";
import { newHostId, useHostsStore } from "./lib/hostsStore";
import { clearHostPassword, setHostPassword } from "./lib/passwords";

type SourceValue = "local" | `host:${string}`;

type Props = {
  localRootPath: string | null;
  activeFilePath?: string | null;
  onOpenFile: (path: string, pin?: boolean) => void;
  onPathRenamed?: (from: string, to: string) => void;
  onPathDeleted?: (path: string) => void;
  onRevealInTerminal?: (path: string) => void;
  onAttachToAgent?: (path: string) => void;
  onOpenMarkdownPreview?: (path: string) => void;
  onOpenHostTerminal: (host: HostProfile) => void;
};

const SOURCE_STORAGE_KEY = "omnitab.files.source";

const EMPTY_DRAFT: HostDraft = {
  name: "",
  hostname: "",
  port: 22,
  username: "",
  authMode: "agent",
  keyPath: "",
  remotePath: ".",
};

export const HostsPanel = forwardRef<FileExplorerHandle, Props>(
  function HostsPanel(
    {
      localRootPath,
      activeFilePath,
      onOpenFile,
      onPathRenamed,
      onPathDeleted,
      onRevealInTerminal,
      onAttachToAgent,
      onOpenMarkdownPreview,
      onOpenHostTerminal,
    },
    ref,
  ) {
    const hydrate = useHostsStore((s) => s.hydrate);
    const hosts = useHostsStore((s) => s.hosts);
    const remove = useHostsStore((s) => s.remove);
    const [selectedSource, setSelectedSource] =
      useState<SourceValue>(readSelectedSource);
    const [editing, setEditing] = useState<HostProfile | null>(null);
    const [creating, setCreating] = useState(false);
    const localExplorerRef = useRef<FileExplorerHandle>(null);
    const remoteExplorerRef = useRef<FileExplorerHandle>(null);

    useEffect(() => {
      void hydrate();
    }, [hydrate]);

    const selectedHost =
      selectedSource === "local"
        ? null
        : (hosts.find((host) => sourceForHost(host.id) === selectedSource) ??
          null);

    const persistSource = useCallback(
      (source: SourceValue) => {
        setSelectedSource(source);
        try {
          window.localStorage.setItem(SOURCE_STORAGE_KEY, source);
        } catch {
          // storage may fail in private mode
        }
        if (source !== "local") {
          const host = hosts.find((h) => sourceForHost(h.id) === source);
          if (host) onOpenHostTerminal(host);
        }
      },
      [hosts, onOpenHostTerminal],
    );

    useEffect(() => {
      if (selectedSource === "local") return;
      const stillExists = hosts.some(
        (host) => sourceForHost(host.id) === selectedSource,
      );
      if (!stillExists) persistSource("local");
    }, [hosts, persistSource, selectedSource]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          if (selectedHost) remoteExplorerRef.current?.focus();
          else localExplorerRef.current?.focus();
        },
        isFocused: () =>
          selectedHost
            ? (remoteExplorerRef.current?.isFocused() ?? false)
            : (localExplorerRef.current?.isFocused() ?? false),
        focusSearch: () => {
          if (selectedHost) remoteExplorerRef.current?.focusSearch();
          else localExplorerRef.current?.focusSearch();
        },
      }),
      [selectedHost],
    );

    const deleteHost = useCallback(
      (host: HostProfile) => {
        if (!window.confirm(`Delete "${host.name}"?`)) return;
        remove(host.id);
        void clearHostPassword(host.id);
        if (selectedSource === sourceForHost(host.id)) persistSource("local");
      },
      [persistSource, remove, selectedSource],
    );

    const sourceValue = selectedHost ? sourceForHost(selectedHost.id) : "local";

    return (
      <div className="flex h-full min-h-0 flex-col bg-card text-sm">
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HugeiconsIcon
              icon={FolderTreeIcon}
              size={16}
              strokeWidth={2}
              className="shrink-0 text-muted-foreground"
            />
            <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Files
            </div>
          </div>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="rounded-md"
            title="New host"
            onClick={() => setCreating(true)}
          >
            <HugeiconsIcon icon={Add01Icon} size={13} strokeWidth={2} />
          </Button>
          {selectedHost ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="rounded-md"
                  title="Host options"
                >
                  <HugeiconsIcon
                    icon={MoreHorizontalIcon}
                    size={13}
                    strokeWidth={2}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem onSelect={() => setEditing(selectedHost)}>
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    size={14}
                    strokeWidth={2}
                  />
                  Edit Host
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => deleteHost(selectedHost)}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={14}
                    strokeWidth={2}
                  />
                  Delete Host
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="shrink-0 border-b border-border/50 px-2 py-2">
          <Select
            value={sourceValue}
            onValueChange={(value) => persistSource(value as SourceValue)}
          >
            <SelectTrigger className="h-8 w-full rounded-lg bg-background/60 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex min-w-0 items-center gap-2">
                  <HugeiconsIcon
                    icon={FolderTreeIcon}
                    size={14}
                    strokeWidth={2}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">Local</span>
                </div>
              </SelectItem>
              {hosts.map((host) => (
                <SelectItem key={host.id} value={sourceForHost(host.id)}>
                  <div className="flex min-w-0 items-center gap-2">
                    <HugeiconsIcon
                      icon={ServerStack02Icon}
                      size={14}
                      strokeWidth={2}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{host.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-h-0 flex-1">
          {selectedHost ? (
            <RemoteFileExplorer
              ref={remoteExplorerRef}
              host={selectedHost}
              onOpenTerminal={onOpenHostTerminal}
            />
          ) : (
            <FileExplorer
              ref={localExplorerRef}
              rootPath={localRootPath}
              activeFilePath={activeFilePath}
              onOpenFile={onOpenFile}
              onPathRenamed={onPathRenamed}
              onPathDeleted={onPathDeleted}
              onRevealInTerminal={onRevealInTerminal}
              onAttachToAgent={onAttachToAgent}
              onOpenMarkdownPreview={onOpenMarkdownPreview}
            />
          )}
        </div>

        <HostDialog
          open={creating}
          host={null}
          onOpenChange={setCreating}
        />
        <HostDialog
          open={editing !== null}
          host={editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      </div>
    );
  },
);

function readSelectedSource(): SourceValue {
  try {
    const stored = window.localStorage.getItem(SOURCE_STORAGE_KEY);
    if (stored === "local" || stored?.startsWith("host:")) {
      return stored as SourceValue;
    }
  } catch {
    // ignore
  }
  return "local";
}

function sourceForHost(id: string): SourceValue {
  return `host:${id}`;
}

function HostDialog({
  open,
  host,
  onOpenChange,
}: {
  open: boolean;
  host: HostProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const upsert = useHostsStore((s) => s.upsert);
  const [draft, setDraft] = useState<HostDraft>(EMPTY_DRAFT);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(host ?? EMPTY_DRAFT);
    setPassword("");
  }, [host, open]);

  const canSave =
    draft.hostname.trim().length > 0 &&
    (draft.authMode !== "password" || host !== null || password.length > 0);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    const nextHost = host
      ? { ...draft, id: host.id }
      : { ...draft, id: newHostId() };
    setSaving(true);
    void (async () => {
      try {
        upsert(nextHost);
        if (nextHost.authMode === "password") {
          if (password.length > 0) await setHostPassword(nextHost.id, password);
        } else {
          await clearHostPassword(nextHost.id);
        }
        onOpenChange(false);
      } catch (err) {
        window.alert(String(err));
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{host ? "Edit Host" : "New Host"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(e) => patchDraft(setDraft, { name: e.target.value })}
                className="rounded-lg"
                placeholder="Production"
              />
            </Field>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <Field label="Host">
                <Input
                  value={draft.hostname}
                  onChange={(e) =>
                    patchDraft(setDraft, { hostname: e.target.value })
                  }
                  className="rounded-lg"
                  placeholder="example.com"
                  required
                />
              </Field>
              <Field label="Port">
                <Input
                  type="number"
                  min={1}
                  max={65535}
                  value={draft.port}
                  onChange={(e) =>
                    patchDraft(setDraft, {
                      port: Number.parseInt(e.target.value, 10) || 22,
                    })
                  }
                  className="rounded-lg"
                />
              </Field>
            </div>
            <Field label="User">
              <Input
                value={draft.username}
                onChange={(e) =>
                  patchDraft(setDraft, { username: e.target.value })
                }
                className="rounded-lg"
                placeholder="deploy"
              />
            </Field>
            <div className="grid grid-cols-[150px_1fr] gap-3">
              <Field label="Auth">
                <Select
                  value={draft.authMode}
                  onValueChange={(value) => {
                    const authMode =
                      value === "key" || value === "password"
                        ? value
                        : "agent";
                    patchDraft(setDraft, { authMode });
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="key">Identity File</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Key Path">
                <Input
                  value={draft.keyPath}
                  onChange={(e) =>
                    patchDraft(setDraft, { keyPath: e.target.value })
                  }
                  disabled={draft.authMode !== "key"}
                  className="rounded-lg"
                  placeholder="~/.ssh/id_ed25519"
                />
              </Field>
            </div>
            {draft.authMode === "password" ? (
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg"
                  placeholder={host ? "Leave blank to keep existing" : ""}
                  autoComplete="new-password"
                />
              </Field>
            ) : null}
            <Field label="Remote Path">
              <Input
                value={draft.remotePath}
                onChange={(e) =>
                  patchDraft(setDraft, { remotePath: e.target.value })
                }
                className="rounded-lg"
                placeholder="."
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg"
              disabled={!canSave || saving}
            >
              Save Host
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function patchDraft(
  setDraft: Dispatch<SetStateAction<HostDraft>>,
  patch: Partial<HostDraft>,
): void {
  setDraft((curr) => ({ ...curr, ...patch }));
}
