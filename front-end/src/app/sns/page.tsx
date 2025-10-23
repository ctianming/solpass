"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { AccountCard } from "@/components/AccountCard";
import { useMemo, useState } from "react";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function SnsPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);
  const [name, setName] = useState("");
  type Status = "idle" | "checking" | "available" | "taken" | "registering" | "success" | "error";
  const [status, setStatus] = useState<Status>("idle");

  const t = useMemo(() => {
    return lang === "zh"
      ? {
          title: "SNS 域名",
          desc: "为您的账户注册独一无二的 .sol 域名，便于收款与识别。",
          placeholder: "输入你想要的名称",
          check: "检查可用性",
          available: "可用",
          taken: "已被占用",
          register: "注册域名",
          registering: "正在注册…",
          registered: "域名注册完成",
          preview: "预览",
          summary: "订单预览",
          domain: "域名",
          owner: "所有者",
          fee: "费用",
          feeFree: "代付（0 SOL）",
          expiry: "有效期",
          oneYear: "1 年",
          needAccount: "请先在“Onboarding”创建账户",
        }
      : {
          title: "Solana Name Service",
          desc: "Register a unique .sol domain for your account.",
          placeholder: "Enter desired name",
      check: "Check availability",
          available: "Available",
          taken: "Taken",
      register: "Register domain",
      registering: "Registering…",
      registered: "Domain registered",
          preview: "Preview",
      summary: "Order summary",
      domain: "Domain",
      owner: "Owner",
      fee: "Fee",
      feeFree: "Sponsored (0 SOL)",
      expiry: "Expiry",
      oneYear: "1 year",
          needAccount: "Please create an account in Onboarding first.",
        };
  }, [lang]);

  const checkAvailability = async (): Promise<boolean> => {
    if (!name) return false;
    setStatus("checking");
  const wait = 800 + Math.random() * 400; // 0.8s-1.2s
  await new Promise((r) => setTimeout(r, wait));
    const h = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0);
    const ok = h % 3 !== 0 && name.length >= 3;
    setStatus(ok ? "available" : "taken");
    return ok;
  };

  const registerSns = async () => {
    if (!account || status !== "available" || !name) return;
  setStatus("registering");
  const wait = 1500 + Math.random() * 700; // 1.5s-2.2s
  await new Promise((r) => setTimeout(r, wait));
    const domain = `${name}.sol`;
    setAccount({ ...account, sns: domain });
    setStatus("success");
  };

  const onRegisterClick = async () => {
    if (!account || !name) return;
    // If not available yet, run check first
    if (status === "idle" || status === "taken") {
      const ok = await checkAvailability();
      if (!ok) return;
    }
    if (status === "available") {
      await registerSns();
    }
  };

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.desc}</p>
          <SectionCard title={lang === "zh" ? "注册域名" : "Register domain"}>
            {!account && <div className="text-sm">{t.needAccount}</div>}
            {account && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase())}
                    placeholder={t.placeholder}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
                  />
                  <div className="px-2 py-1 rounded border text-xs min-w-24 text-center flex items-center justify-center gap-2">
                    {status === "checking" && (
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                    )}
                    {status === "registering" && (
                      <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                    )}
                    {status === "idle" && t.preview}
                    {status === "checking" && (lang === "zh" ? "检查中…" : "Checking…")}
                    {status === "available" && t.available}
                    {status === "taken" && t.taken}
                    {status === "registering" && (lang === "zh" ? "注册中…" : t.registering)}
                    {status === "success" && t.registered}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={checkAvailability} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50" disabled={!name || status === "checking" || status === "registering"}>
                    {t.check}
                  </button>
                  <button
                    onClick={onRegisterClick}
                    disabled={!name || status === "checking" || status === "registering"}
                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {status === "registering" && (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
                    )}
                    {status === "registering" ? t.registering : t.register}
                  </button>
                </div>
                {(status === "checking" || status === "registering") && (
                  <div className="h-1 w-full rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div className="h-full w-1/3 bg-neutral-400/70 dark:bg-neutral-500/70 animate-[progress_1.2s_ease_infinite]" />
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-xs">
                    <div className="font-medium mb-2">{t.summary}</div>
                    <div className="flex justify-between py-0.5"><span className="text-neutral-500">{t.domain}</span><span className="font-mono">{name ? `${name}.sol` : "-"}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-neutral-500">{t.owner}</span><span className="font-mono">{account.address.slice(0,4)}…{account.address.slice(-4)}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-neutral-500">{t.fee}</span><span>{t.feeFree}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-neutral-500">{t.expiry}</span><span>{t.oneYear}</span></div>
                  </div>
                  {status === "success" && (
                    <div className="rounded-lg border p-3 text-xs bg-emerald-50/50 dark:bg-emerald-900/10">
                      <div>• {t.registered}: <span className="font-mono">{account?.sns}</span></div>
                    </div>
                  )}
                </div>
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
            <div className="text-sm text-neutral-500">{t.needAccount}</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
