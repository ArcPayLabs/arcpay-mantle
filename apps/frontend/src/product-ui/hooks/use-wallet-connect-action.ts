"use client";

import { useCallback, useEffect, useState } from "react";
import { getAddress } from "ethers";
import { MANTLE_CHAIN_ID_HEX } from "@mantle/lib/mantle";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type WalletSupabaseAuth = {
  email: string;
  tokenHash: string;
  type: "email";
};

export type WalletConnectResult = {
  address: string;
  supabaseAuth?: WalletSupabaseAuth;
};

type WalletConnectAction = {
  readonly connectWallet: () => Promise<WalletConnectResult>;
  readonly connected: boolean;
  readonly connecting: boolean;
  readonly errorMessage: string | null;
  readonly label: string;
  readonly publicKeyBase58: string | null;
  readonly selectedWalletName: string | null;
};

const sessionKey = "arcpay-mantle-wallet-session";

export function useWalletConnectAction(): WalletConnectAction {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(sessionKey);
    if (stored) setAddress(stored);
  }, []);

  const connectWallet = useCallback(async (): Promise<WalletConnectResult> => {
    try {
      setConnecting(true);
      setErrorMessage(null);
      const provider = getProvider();
      if (!provider) {
        throw new Error("Install MetaMask, Rabby, or another EVM wallet to connect to Mantle.");
      }

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: MANTLE_CHAIN_ID_HEX,
          chainName: "Mantle Testnet",
          nativeCurrency: { name: "Mantle Test Token", symbol: "MNT", decimals: 18 },
          rpcUrls: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL ?? "https://rpc.sepolia.mantle.xyz"],
          blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
        }],
      }).catch(async () => {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: MANTLE_CHAIN_ID_HEX }] });
      });

      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const nextAddress = getAddress(accounts[0] ?? "");
      const challenge = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: nextAddress }),
      });
      const challengeBody = await challenge.json() as { message?: string; error?: string };
      if (!challenge.ok || !challengeBody.message) throw new Error(challengeBody.error ?? "Unable to create wallet challenge.");

      const signature = await provider.request({
        method: "personal_sign",
        params: [challengeBody.message, nextAddress],
      }) as string;
      const verified = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const verifiedBody = await verified.json() as { address?: string; error?: string; supabaseAuth?: WalletSupabaseAuth };
      if (!verified.ok || !verifiedBody.address) throw new Error(verifiedBody.error ?? "Wallet signature verification failed.");

      window.localStorage.setItem(sessionKey, nextAddress);
      setAddress(nextAddress);
      return { address: nextAddress, supabaseAuth: verifiedBody.supabaseAuth };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mantle wallet connection failed.";
      setErrorMessage(message);
      console.warn("Mantle wallet connection failed.", message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setConnecting(false);
    }
  }, []);

  return {
    connectWallet,
    connected: Boolean(address),
    connecting,
    errorMessage,
    label: address ? short(address) : connecting ? "Connecting..." : "Connect wallet",
    publicKeyBase58: address,
    selectedWalletName: "Mantle EVM",
  };
}

function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null;
}

function short(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
