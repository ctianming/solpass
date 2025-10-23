"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function SnsPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);

  const registerSns = () => {
    if (!account) return;
    const base = (lang === "zh" ? "用户名" : "user") + account.id.slice(0, 3);
    setAccount({ ...account, sns: `${base}.sol` });
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-5">{lang === "zh" ? "SNS 域名" : "Solana Name Service"}</h1>
      <SectionCard
        title={lang === "zh" ? "注册域名" : "Register domain"}
        actions={<button className="rounded-lg border px-3 py-1.5 text-sm" onClick={registerSns}>{lang === "zh" ? "注册 sns 域名" : "Register SNS"}</button>}
      >
        {lang === "zh" ? "为您的账户注册独一无二的 .sol 域名，便于收款与识别。" : "Register a unique .sol domain for your account."}
        {account?.sns && <div className="mt-3 text-xs">• {lang === "zh" ? "域名注册完成" : "Domain registered"}: <span className="font-mono">{account.sns}</span></div>}
        {!account && <div className="mt-3 text-sm">{lang === "zh" ? "请先在“Onboarding”创建账户" : "Please create an account in Onboarding first."}</div>}
      </SectionCard>
    </AppShell>
  );
}
