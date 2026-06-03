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
import { Empty, EmptyContent, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { HostDraft, HostProfile } from "@/modules/hosts/types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ComputerTerminal02Icon,
  Delete02Icon,
  FolderTransferIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  ServerStack02Icon,
} from "@hugeicons/core-free-icons";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { newHostId, useHostsStore } from "./lib/hostsStore";
import { clearHostPassword, setHostPassword } from "./lib/passwords";

type Props = {
  onOpenSsh: (host: HostProfile) => void;
  onOpenSftp: (host: HostProfile) => void;
};

const EMPTY_DRAFT: HostDraft = {
  name: "",
  hostname: "",
  port: 22,
  username: "",
  authMode: "agent",
  keyPath: "",
  remotePath: ".",
};

export function HostsPanel({ onOpenSsh, onOpenSftp }: Props) {
  const hydrate = useHostsStore((s) => s.hydrate);
  const hosts = useHostsStore((s) => s.hosts);
  const remove = useHostsStore((s) => s.remove);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<HostProfile | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hosts;
    return hosts.filter((h) =>
      [h.name, h.hostname, h.username]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [hosts, query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-card text-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <HugeiconsIcon
            icon={ServerStack02Icon}
            size={16}
            strokeWidth={2}
            className="shrink-0 text-muted-foreground"
          />
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hosts
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
      </div>

      <div className="shrink-0 border-b border-border/50 px-2 py-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hosts"
          className="h-8 rounded-lg bg-background/60 text-sm"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <Empty className="h-full border-0 p-6">
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={ServerStack02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle className="text-sm">
                {hosts.length === 0 ? "No hosts" : "No matches"}
              </EmptyTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => setCreating(true)}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                New Host
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((host) => (
              <HostRow
                key={host.id}
                host={host}
                onOpenSsh={onOpenSsh}
                onOpenSftp={onOpenSftp}
                onEdit={() => setEditing(host)}
                onDelete={() => {
                  if (window.confirm(`Delete "${host.name}"?`)) {
                    remove(host.id);
                    void clearHostPassword(host.id);
                  }
                }}
              />
            ))}
          </div>
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
}

function HostRow({
  host,
  onOpenSsh,
  onOpenSftp,
  onEdit,
  onDelete,
}: {
  host: HostProfile;
  onOpenSsh: (host: HostProfile) => void;
  onOpenSftp: (host: HostProfile) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const target = host.username ? `${host.username}@${host.hostname}` : host.hostname;
  return (
    <div
      className={cn(
        "group flex min-h-14 items-center gap-2 rounded-lg px-2 py-2",
        "text-left hover:bg-foreground/[0.045]",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left outline-none"
        onClick={() => onOpenSsh(host)}
        onDoubleClick={() => onOpenSftp(host)}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70 text-muted-foreground ring-1 ring-border/60">
          <HugeiconsIcon icon={ServerStack02Icon} size={17} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {host.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {target}
            {host.port !== 22 ? `:${host.port}` : ""}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="rounded-md"
          title="SSH"
          onClick={() => onOpenSsh(host)}
        >
          <HugeiconsIcon
            icon={ComputerTerminal02Icon}
            size={13}
            strokeWidth={2}
          />
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          className="rounded-md"
          title="SFTP"
          onClick={() => onOpenSftp(host)}
        >
          <HugeiconsIcon icon={FolderTransferIcon} size={13} strokeWidth={2} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-md"
              title="More"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={13}
                strokeWidth={2}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuItem onSelect={onEdit}>
              <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={2} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
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
    const nextHost = host ? { ...draft, id: host.id } : { ...draft, id: newHostId() };
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
