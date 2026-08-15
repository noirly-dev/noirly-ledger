import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceUIState = {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceUIState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
    }),
    { name: "noirly-ledger-workspace" },
  ),
);

type UIState = {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  transactionComposerOpen: boolean;
  setTransactionComposerOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  transactionComposerOpen: false,
  setTransactionComposerOpen: (open) => set({ transactionComposerOpen: open }),
}));
