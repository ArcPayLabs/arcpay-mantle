import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NetworkMode = "mantle";

type NetworkState = {
  mode: NetworkMode;
  setMode: (mode: NetworkMode) => void;
};

export const useNetwork = create<NetworkState>()(
  persist(
    (set) => ({
      mode: "mantle",
      setMode: () => set({ mode: "mantle" }),
    }),
    {
      name: "arcpay-mantle-network",
      version: 1,
      partialize: () => ({ mode: "mantle" as const }),
    },
  ),
);
