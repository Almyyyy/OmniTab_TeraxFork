import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HostProfile, HostSourceValue } from "@/modules/hosts";
import { sourceForHost } from "@/modules/hosts";
import type { Tab } from "@/modules/tabs";
import {
  Add01Icon,
  FolderTreeIcon,
  PencilEdit02Icon,
  ServerStack02Icon,
  SidebarLeftIcon,
} from "@/components/icons";
import { AppIcon, type IconComponent } from "@/components/icons";
import type { SearchAddon } from "@xterm/addon-search";
import { useEffect, useMemo, useRef } from "react";
import { PaneTreeView } from "./PaneTreeView";
import type { TerminalPaneHandle } from "./TerminalPane";
import { leafIds } from "./lib/panes";

type Props = {
  tabs: Tab[];
  activeId: number;
  /** Register/unregister handle by leaf id (not tab id). */
  registerHandle: (leafId: number, handle: TerminalPaneHandle | null) => void;
  onSearchReady: (leafId: number, addon: SearchAddon) => void;
  onCwd: (leafId: number, cwd: string) => void;
  onExit: (leafId: number, code: number) => void;
  onFocusLeaf: (tabId: number, leafId: number) => void;
};

type Bundle = {
  setRef: (h: TerminalPaneHandle | null) => void;
  onSearch: (addon: SearchAddon) => void;
  onCwd: (cwd: string) => void;
  onExit: (code: number) => void;
};

export function TerminalStack({
  tabs,
  activeId,
  registerHandle,
  onSearchReady,
  onCwd,
  onExit,
  onFocusLeaf,
}: Props) {
  const terminals = useMemo(
    () => tabs.filter((t) => t.kind === "terminal"),
    [tabs],
  );

  const registerRef = useRef(registerHandle);
  const searchReadyRef = useRef(onSearchReady);
  const cwdRef = useRef(onCwd);
  const exitRef = useRef(onExit);
  useEffect(() => {
    registerRef.current = registerHandle;
  }, [registerHandle]);
  useEffect(() => {
    searchReadyRef.current = onSearchReady;
  }, [onSearchReady]);
  useEffect(() => {
    cwdRef.current = onCwd;
  }, [onCwd]);
  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  const bundles = useRef(new Map<number, Bundle>());
  const getBundle = (leafId: number): Bundle => {
    let b = bundles.current.get(leafId);
    if (!b) {
      b = {
        setRef: (h) => registerRef.current(leafId, h),
        onSearch: (addon) => searchReadyRef.current(leafId, addon),
        onCwd: (cwd) => cwdRef.current(leafId, cwd),
        onExit: (code) => exitRef.current(leafId, code),
      };
      bundles.current.set(leafId, b);
    }
    return b;
  };

  useEffect(() => {
    const live = new Set<number>();
    for (const t of terminals)
      for (const id of leafIds(t.paneTree)) live.add(id);
    for (const id of bundles.current.keys()) {
      if (!live.has(id)) bundles.current.delete(id);
    }
  }, [terminals]);

  return (
    <div className="relative h-full w-full">
      {terminals.map((t) => {
        const tabVisible = t.id === activeId;
        return (
          <div
            key={t.id}
            className="absolute inset-0"
            style={{
              visibility: tabVisible ? "visible" : "hidden",
              pointerEvents: tabVisible ? "auto" : "none",
            }}
            aria-hidden={!tabVisible}
          >
            <PaneTreeView
              node={t.paneTree}
              tabVisible={tabVisible}
              activeLeafId={t.activeLeafId}
              onFocusLeaf={(leafId) => onFocusLeaf(t.id, leafId)}
              getBundle={getBundle}
            />
          </div>
        );
      })}
    </div>
  );
}

export function TerminalHostToolbar({
  onToggleSidebar,
  hosts,
  selectedHostSource,
  selectedHost,
  onSelectHostSource,
  onCreateHost,
  onEditHost,
}: {
  onToggleSidebar: () => void;
  hosts: HostProfile[];
  selectedHostSource: HostSourceValue;
  selectedHost: HostProfile | null;
  onSelectHostSource: (source: HostSourceValue) => void;
  onCreateHost: () => void;
  onEditHost: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-border/60">
      <div className="flex h-9 items-center gap-1 bg-card/40 px-1.5">
        <IconButton
          title="Toggle sidebar"
          onClick={onToggleSidebar}
          icon={SidebarLeftIcon}
        />

        <div className="flex min-w-0 flex-1 items-center">
          <Select
            value={selectedHostSource}
            onValueChange={(value) =>
              onSelectHostSource(value as HostSourceValue)
            }
          >
            <SelectTrigger className="h-7 w-full rounded-md bg-muted/60 px-2 text-xs focus:ring-0 focus-visible:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex min-w-0 items-center gap-2">
                  <AppIcon
                    icon={FolderTreeIcon}
                    size={14}
                    strokeWidth={1.75}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">Local</span>
                </div>
              </SelectItem>
              {hosts.map((host) => (
                <SelectItem key={host.id} value={sourceForHost(host.id)}>
                  <div className="flex min-w-0 items-center gap-2">
                    <AppIcon
                      icon={ServerStack02Icon}
                      size={14}
                      strokeWidth={1.75}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{host.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <IconButton title="New host" onClick={onCreateHost} icon={Add01Icon} />
        <IconButton
          title="Edit host"
          disabled={!selectedHost}
          onClick={onEditHost}
          icon={PencilEdit02Icon}
        />
      </div>
    </div>
  );
}

function IconButton({
  title,
  disabled,
  onClick,
  icon,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  icon: IconComponent;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="size-7 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <AppIcon icon={icon} size={14} strokeWidth={1.75} />
    </Button>
  );
}
