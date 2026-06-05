export { TabBar } from "./TabBar";
export {
  MAX_PANES_PER_TAB,
  useTabs,
  type Tab,
  type TerminalTab,
  type EditorTab,
  type PreviewTab,
  type MarkdownTab,
  type AiDiffTab,
  type GitDiffTab,
  type GitHistoryTab,
  type GitCommitFileDiffTab,
  type AiDiffStatus,
  type TabPatch,
} from "./lib/useTabs";
export { useWorkspaceCwd } from "./lib/useWorkspaceCwd";
export { useWindowTitle } from "./lib/useWindowTitle";
export {
  TAB_DRAG_MIME,
  TAB_DRAG_ENDED_EVENT,
  TAB_DRAG_HOVER_EVENT,
  TAB_DRAG_STARTED_EVENT,
  TAB_DRAG_TEXT,
  TAB_TRANSFER_ACCEPTED_EVENT,
  TAB_TRANSFER_EVENT,
  TAB_TRANSFER_READY_EVENT,
  parseTabTransferPayload,
  type TabDragHoverSignal,
  type TabDropEdge,
  type TabDragSignal,
  type TabStripMetrics,
  type TabStripRect,
  type TabStripTabRect,
  type TabTransferAccepted,
  type TabTransferPayload,
  type TabTransferReady,
} from "./lib/transfer";
