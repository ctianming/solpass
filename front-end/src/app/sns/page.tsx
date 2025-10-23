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
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

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
          preview: "预览",
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
          preview: "Preview",
          needAccount: "Please create an account in Onboarding first.",
        };
  }, [lang]);

  const checkAvailability = async () => {
    setChecking(true);
    setAvailable(null);
    // Mock result: simple hash to flip availability
    await new Promise((r) => setTimeout(r, 500));
    const h = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0);
    setAvailable(h % 3 !== 0 && name.length >= 3);
    setChecking(false);
  };

  const registerSns = async () => {
    if (!account || !available || !name) return;
    const domain = `${name}.sol`;
    setAccount({ ...account, sns: domain });
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
                  <div className="px-2 py-1 rounded border text-xs min-w-20 text-center">
                    {checking ? "…" : available == null ? t.preview : available ? t.available : t.taken}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={checkAvailability} className="rounded-lg border px-3 py-1.5 text-sm">
                    {t.check}
                  </button>
                  <button
                    onClick={registerSns}
                    disabled={!available || !name}
                    className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    {t.register}
                  </button>
                </div>
                {account?.sns && (
                  <div className="text-xs">• {lang === "zh" ? "域名注册完成" : "Domain registered"}: <span className="font-mono">{account.sns}</span></div>
                )}
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
