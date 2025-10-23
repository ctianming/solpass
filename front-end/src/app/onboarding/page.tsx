"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { PassCard } from "@/components/PassCard";
import { FlippablePassCard } from "@/components/FlippablePassCard";
import { AccountCard } from "@/components/AccountCard";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useEffect, useMemo, useRef, useState } from "react";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function OnboardingPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);
  // SNS modal state
  const [snsOpen, setSnsOpen] = useState(false);
  const [snsName, setSnsName] = useState("");
  type SnsStatus = "idle" | "checking" | "available" | "taken" | "registering" | "success" | "error";
  const [snsStatus, setSnsStatus] = useState<SnsStatus>("idle");

  // NFC scanning state machine
  type NfcState = "idle" | "starting" | "scanning" | "ready" | "creating" | "unsupported" | "error";
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
          ready: "已读取 NFC",
          creating: "正在为您创建账户…",
          unsupported: "此浏览器不支持 Web NFC，请使用支持 NFC 的浏览器（如部分 Android 浏览器）。",
          error: "开启 NFC 扫描失败，请轻触屏幕一次以授权，或重试。",
        },
        created: "账户创建完成",
        id: "ID",
        address: "地址",
        sns: {
          title: "注册域名",
          open: "注册 SNS 域名",
          placeholder: "输入你想要的名称",
          check: "检查可用性",
          available: "可用",
          taken: "已被占用",
          register: "注册域名",
          registering: "正在注册…",
          registered: "域名注册完成",
        },
      };
    }
    return {
      title: "Create account",
      desc: "Create a Solana wallet on first tap. No seed phrase.",
      nfc: {
        idle: "Preparing NFC...",
        starting: "Starting NFC scan…",
        scanning: "Bring the NFC card close to your phone…",
  ready: "NFC read",
  creating: "Creating your account…",
        unsupported: "This browser doesn't support Web NFC. Please use a browser with NFC support (Android only).",
        error: "Failed to start NFC scan. Tap the screen once to authorize, then try again.",
      },
      created: "Account created",
      id: "ID",
      address: "Address",
      sns: {
        title: "Register domain",
        open: "Register SNS domain",
        placeholder: "Enter desired name",
        check: "Check availability",
        available: "Available",
        taken: "Taken",
        register: "Register domain",
        registering: "Registering…",
        registered: "Domain registered",
      },
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

    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const bytesToBase58 = (source: Uint8Array) => {
      if (!source || source.length === 0) return "";
      const BASE = 58;
      const LEADER = alphabet[0];
      // Count leading zeros
      let zeros = 0;
      while (zeros < source.length && source[zeros] === 0) zeros++;
      // Size estimation per base-x
      const size = (((source.length - zeros) * 138) / 100 + 1) | 0;
      const b58 = new Uint8Array(size);
      let length = 0;
      for (let i = zeros; i < source.length; i++) {
        let carry = source[i];
        let j = 0;
        for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
          carry += 256 * b58[k];
          b58[k] = carry % BASE;
          carry = (carry / BASE) | 0;
        }
        length = j;
      }
      // Skip leading zeros in base58 result
      let it = size - length;
      while (it < size && b58[it] === 0) it++;
      let str = "";
      for (let i = 0; i < zeros; i++) str += LEADER;
      for (; it < size; ++it) str += alphabet[b58[it]];
      return str;
    };

    const deriveAddress = async (seed: string): Promise<string> => {
      try {
        if (crypto?.subtle?.digest) {
          const enc = new TextEncoder().encode(seed);
          const buf = await crypto.subtle.digest("SHA-256", enc);
          const hash = new Uint8Array(buf);
          const b58 = bytesToBase58(hash);
          // Typical Solana pubkeys are ~43-44 chars; if short, pad by re-encoding extra zero
          if (b58.length < 43) {
            const extended = bytesToBase58(new Uint8Array([...hash, 0]));
            return extended.slice(0, 44);
          }
          return b58.slice(0, 44);
        }
      } catch {}
      // Fallback random base58
      const rnd = new Uint8Array(32);
      (crypto?.getRandomValues ? crypto.getRandomValues(rnd) : rnd.fill(7));
      return bytesToBase58(rnd);
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const tryStart = async () => {
      if (cancelled || startedRef.current) return;
      try {
        startedRef.current = true;
        setNfcState("starting");
        // small pre-scan delay for realism
        await sleep(300 + Math.random() * 300);
        const Reader = (window as any).NDEFReader;
        ndef = new Reader();
        // Start scanning
        await ndef.scan();
        if (cancelled) return;
        setNfcState("scanning");

        ndef.onreading = async (event: any) => {
          if (cancelled) return;
          if (account) return;
          setNfcState("ready");
          // Use NFC serialNumber or fallback random to deterministically derive an ID
          const seed: string = event?.serialNumber || (crypto?.randomUUID?.() ?? Math.random().toString(36));
          const id = seed.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || Math.random().toString(36).slice(2, 10);
          const address = await deriveAddress(seed);
          // hold a creating phase for realism
          setNfcState("creating");
          await sleep(900 + Math.random() * 700);
          setAccount({ id, address, balanceFiat: 0, balanceSol: 0 });
          // exit creating state so UI can reveal account
          setNfcState("ready");
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

  // Open SNS modal via query param (client-only)
  useEffect(() => {
    if (!account || snsOpen) return;
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const want = params.get("sns");
        if (want === "1") {
          setSnsOpen(true);
          setSnsStatus("idle");
        }
      }
    } catch {}
  }, [account, snsOpen]);

  // sns helpers
  const checkAvailability = async (): Promise<boolean> => {
    if (!snsName) return false;
    setSnsStatus("checking");
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
    const h = Array.from(snsName).reduce((s, c) => s + c.charCodeAt(0), 0);
    const ok = h % 3 !== 0 && snsName.length >= 3;
    setSnsStatus(ok ? "available" : "taken");
    return ok;
  };
  const doRegister = async () => {
    if (!account || !snsName) return;
    // If not already available, try checking first
    if (snsStatus === "idle" || snsStatus === "taken") {
      const ok = await checkAvailability();
      if (!ok) return;
    } else if (snsStatus === "checking") {
      const ok = await checkAvailability();
      if (!ok) return;
    } else if (snsStatus !== "available") {
      return;
    }
    setSnsStatus("registering");
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 700));
    const domain = `${snsName}.sol`;
    setAccount({ ...account, sns: domain });
    setSnsStatus("success");
    setTimeout(() => setSnsOpen(false), 800);
  };

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">{lang === "zh" ? "NFC 一贴创建账户" : "NFC onboarding"}</h1>
          {!account && (
          <SectionCard title={labels.title}>
            {labels.desc}
            <div className="mt-3 text-xs opacity-80">
              {nfcState === "idle" && labels.nfc.idle}
              {nfcState === "starting" && labels.nfc.starting}
              {nfcState === "scanning" && labels.nfc.scanning}
              {nfcState === "ready" && labels.nfc.ready}
              {nfcState === "creating" && labels.nfc.creating}
              {nfcState === "unsupported" && (
                <span className="text-red-500">{labels.nfc.unsupported}</span>
              )}
              {nfcState === "error" && (
                <span className="text-amber-500">{labels.nfc.error}</span>
              )}
            </div>
            {(nfcState === "starting" || nfcState === "scanning" || nfcState === "creating") && (
              <div className="mt-4 flex items-center gap-2 text-xs">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
                <span className="opacity-80">
                  {nfcState === "starting" && (lang === "zh" ? "初始化 NFC…" : "Initializing NFC…")}
                  {nfcState === "scanning" && (lang === "zh" ? "等待贴卡…" : "Waiting for tag…")}
                  {nfcState === "creating" && (lang === "zh" ? "生成账户与密钥…" : "Generating account…")}
                </span>
              </div>
            )}
            {/* After creation, the text card no longer shows details — use the flippable card + SNS modal */}
          </SectionCard>
          )}
        </div>
        <div className="flex justify-center md:justify-end">
          {account && nfcState !== "creating" ? (
            <div className="flex flex-col items-center gap-4">
              <FlippablePassCard address={account.address} name={account.sns ?? null} lang={lang} />
              <button
                onClick={() => {
                  setSnsOpen(true);
                  setSnsStatus("idle");
                  setSnsName("");
                }}
                className="rounded-full border px-4 py-2 text-sm"
              >
                {labels.sns.open}
              </button>
            </div>
          ) : (
            <PassCard active={false} name={lang === "zh" ? "未命名" : "Unnamed"} />
          )}
        </div>
      </div>

      {/* Full-screen loader overlay during account creation */}
      {nfcState === "creating" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full animate-spin [animation-duration:1.2s] bg-[conic-gradient(#22c55e,#06b6d4,#8b5cf6,#22c55e)]" />
              <div className="absolute inset-2 rounded-full bg-white dark:bg-neutral-950" />
            </div>
            <div className="text-sm opacity-90">
              {lang === "zh" ? "正在为您创建账户…" : "Creating your account…"}
            </div>
          </div>
        </div>
      )}

      {/* SNS modal */}
      {snsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSnsOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-white dark:bg-neutral-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">{labels.sns.title}</div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={snsName}
                  onChange={(e) => setSnsName(e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase())}
                  placeholder={labels.sns.placeholder}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
                />
                <div className="px-2 py-1 rounded border text-xs min-w-24 text-center flex items-center justify-center gap-2">
                  {snsStatus === "checking" && (
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                  )}
                  {snsStatus === "registering" && (
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                  )}
                  {snsStatus === "idle" && (lang === "zh" ? "预览" : "Preview")}
                  {snsStatus === "checking" && (lang === "zh" ? "检查中…" : "Checking…")}
                  {snsStatus === "available" && labels.sns.available}
                  {snsStatus === "taken" && labels.sns.taken}
                  {snsStatus === "registering" && labels.sns.registering}
                  {snsStatus === "success" && labels.sns.registered}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={checkAvailability} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50" disabled={!snsName || snsStatus === "checking" || snsStatus === "registering"}>
                  {labels.sns.check}
                </button>
                <button onClick={doRegister} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 inline-flex items-center gap-2" disabled={!snsName || snsStatus === "registering"}>
                  {snsStatus === "registering" && (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                  )}
                  {labels.sns.register}
                </button>
              </div>
              <div className="rounded-lg border p-3 text-xs grid gap-1">
                <div className="flex justify-between py-0.5"><span className="text-neutral-500">{lang === "zh" ? "域名" : "Domain"}</span><span className="font-mono">{snsName ? `${snsName}.sol` : "-"}</span></div>
                <div className="flex justify-between py-0.5"><span className="text-neutral-500">{lang === "zh" ? "所有者" : "Owner"}</span><span className="font-mono">{account?.address.slice(0,4)}…{account?.address.slice(-4)}</span></div>
                <div className="flex justify-between py-0.5"><span className="text-neutral-500">{lang === "zh" ? "费用" : "Fee"}</span><span>{lang === "zh" ? "代付（0 SOL）" : "Sponsored (0 SOL)"}</span></div>
                <div className="flex justify-between py-0.5"><span className="text-neutral-500">{lang === "zh" ? "有效期" : "Expiry"}</span><span>{lang === "zh" ? "1 年" : "1 year"}</span></div>
              </div>
              {snsStatus === "success" && (
                <div className="rounded-lg border p-3 text-xs bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div>• {labels.sns.registered}: <span className="font-mono">{account?.sns}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
