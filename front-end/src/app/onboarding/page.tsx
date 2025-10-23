"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { PassCard } from "@/components/PassCard";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function OnboardingPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);

  const createAccount = () => {
    if (account) {
      setAccount(null);
      return;
    }
    const id = Math.random().toString(36).slice(2, 10);
    const address = "So" + Math.random().toString(36).slice(2).padEnd(30, "x");
    setAccount({ id, address, balanceFiat: 0, balanceSol: 0 });
  };

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">{lang === "zh" ? "NFC 一贴创建账户" : "NFC onboarding"}</h1>
          <SectionCard
            title={lang === "zh" ? "创建账户" : "Create account"}
            actions={<button className="rounded-lg border px-3 py-1.5 text-sm" onClick={createAccount}>{account ? (lang === "zh" ? "重新初始化" : "Re-initialize") : (lang === "zh" ? "贴卡创建账户" : "Tap to create")}</button>}
          >
            {lang === "zh" ? "首次贴卡自动为您创建 Solana 钱包，无需助记词与复杂设置。" : "Create a Solana wallet on first tap. No seed phrase."}
            {account && (
              <div className="mt-3 text-xs">
                <div>• {lang === "zh" ? "账户创建完成" : "Account created"}</div>
                <div>• ID: <span className="font-mono">{account.id}</span></div>
                <div>• Address: <span className="font-mono break-all">{account.address}</span></div>
              </div>
            )}
          </SectionCard>
        </div>
        <div className="flex justify-center md:justify-end">
          <PassCard active={!!account} name={account?.sns ?? (lang === "zh" ? "未命名" : "Unnamed")} id={account?.id ?? undefined} />
        </div>
      </div>
    </AppShell>
  );
}
