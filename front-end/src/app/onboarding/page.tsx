"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { PassCard } from "@/components/PassCard";
import { AccountCard } from "@/components/AccountCard";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useEffect, useMemo, useRef, useState } from "react";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function OnboardingPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);

  // NFC scanning state machine
  type NfcState = "idle" | "starting" | "scanning" | "ready" | "unsupported" | "error";
  const [nfcState, setNfcState] = useState<NfcState>("idle");
  const startedRef = useRef(false);

  // Derive localized labels
  const labels = useMemo(() => {
    if (lang === "zh") {
      return {
        title: "创建账户",
        desc: "首次贴卡自动为您创建 Solana 钱包，无需助记词与复杂设置。",
        nfc: {
          idle: "准备 NFC...",
          starting: "正在开启 NFC 扫描…",
          scanning: "请将 NFC 卡片贴近手机…",
          ready: "已读取 NFC，正在为您创建账户…",
          unsupported: "此浏览器不支持 Web NFC，请使用支持 NFC 的浏览器（如部分 Android 浏览器）。",
          error: "开启 NFC 扫描失败，请轻触屏幕一次以授权，或重试。",
        },
        created: "账户创建完成",
        id: "ID",
        address: "地址",
      };
    }
    return {
      title: "Create account",
      desc: "Create a Solana wallet on first tap. No seed phrase.",
      nfc: {
        idle: "Preparing NFC...",
        starting: "Starting NFC scan…",
        scanning: "Bring the NFC card close to your phone…",
        ready: "NFC read, creating your account…",
        unsupported: "This browser doesn't support Web NFC. Please use a browser with NFC support (Android only).",
        error: "Failed to start NFC scan. Tap the screen once to authorize, then try again.",
      },
      created: "Account created",
      id: "ID",
      address: "Address",
    };
  }, [lang]);

  // Start Web NFC scanning (best effort with auto + gesture fallback)
  useEffect(() => {
    if (account) return; // Skip scanning if already onboarded
    if (startedRef.current) return;

    let cancelled = false;
    let ndef: any | null = null;

    const canNfc = typeof window !== "undefined" && (window as any).NDEFReader;
    if (!canNfc) {
      setNfcState("unsupported");
      return;
    }

    const tryStart = async () => {
      if (cancelled || startedRef.current) return;
      try {
        startedRef.current = true;
        setNfcState("starting");
        const Reader = (window as any).NDEFReader;
        ndef = new Reader();
        // Start scanning
        await ndef.scan();
        if (cancelled) return;
        setNfcState("scanning");

        ndef.onreading = (event: any) => {
          if (cancelled) return;
          if (account) return;
          setNfcState("ready");
          // Use NFC serialNumber or fallback random to deterministically derive an ID
          const seed: string = event?.serialNumber || (crypto?.randomUUID?.() ?? Math.random().toString(36));
          const id = seed.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || Math.random().toString(36).slice(2, 10);
          // Build a pseudo address (mock)
          const base = btoa(unescape(encodeURIComponent(seed))).replace(/[^a-zA-Z0-9]/g, "");
          const address = ("So" + base).slice(0, 32).padEnd(32, "x");
          setAccount({ id, address, balanceFiat: 0, balanceSol: 0 });
        };
        ndef.onreadingerror = () => {
          if (!cancelled) setNfcState("error");
        };
      } catch (e: any) {
        // Many browsers require a user activation; fall back to waiting a tap gesture
        setNfcState("error");
        startedRef.current = false;
      }
    };

    // Attempt immediate start (may fail if user activation is required)
    void tryStart();

    // Fallback: start scanning on first user gesture
    const onFirstGesture = () => {
      void tryStart();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("touchstart", onFirstGesture, { once: true });

    return () => {
      cancelled = true;
      try {
        window.removeEventListener("pointerdown", onFirstGesture);
        window.removeEventListener("touchstart", onFirstGesture);
      } catch {}
      // No standardized stop() yet; scanning stops when navigating away
      ndef = null;
    };
  }, [account]);

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">{lang === "zh" ? "NFC 一贴创建账户" : "NFC onboarding"}</h1>
          <SectionCard title={labels.title}>
            {labels.desc}
            <div className="mt-3 text-xs opacity-80">
              {nfcState === "idle" && labels.nfc.idle}
              {nfcState === "starting" && labels.nfc.starting}
              {nfcState === "scanning" && labels.nfc.scanning}
              {nfcState === "ready" && labels.nfc.ready}
              {nfcState === "unsupported" && (
                <span className="text-red-500">{labels.nfc.unsupported}</span>
              )}
              {nfcState === "error" && (
                <span className="text-amber-500">{labels.nfc.error}</span>
              )}
            </div>
            {account && (
              <div className="mt-3 text-xs">
                <div>• {labels.created}</div>
                <div>• {labels.id}: <span className="font-mono">{account.id}</span></div>
                <div>• {labels.address}: <span className="font-mono break-all">{account.address}</span></div>
              </div>
            )}
          </SectionCard>
        </div>
        <div className="flex justify-center md:justify-end">
          {account ? (
            <AccountCard
              id={account.id}
              address={account.address}
              sns={account.sns}
              balanceFiat={account.balanceFiat}
              balanceSol={account.balanceSol}
              lang={lang}
            />
          ) : (
            <PassCard active={false} name={lang === "zh" ? "未命名" : "Unnamed"} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
