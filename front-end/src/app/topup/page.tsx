"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function TopupPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account, setAccount] = useLocalStorage<Account | null>("account", null);

  const topUpFiat = () => account && setAccount({ ...account, balanceFiat: account.balanceFiat + 50 });
  const sponsoredAction = () => {
    if (!account) return;
    if (account.balanceFiat <= 0) return alert(lang === "zh" ? "余额不足，请先充值" : "Insufficient balance. Top up first.");
    setAccount({ ...account, balanceFiat: Math.max(0, account.balanceFiat - 1), balanceSol: account.balanceSol + 0.001 });
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-5">{lang === "zh" ? "法币充值与代付" : "Fiat top-up & sponsored tx"}</h1>
      <div className="grid gap-5">
        <SectionCard
          title={lang === "zh" ? "账户余额" : "Balance"}
        >
          {account ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-4">
                <div className="text-zinc-500">Fiat</div>
                <div className="mt-1 font-mono">{account.balanceFiat.toFixed(2)} CNY</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-zinc-500">SOL</div>
                <div className="mt-1 font-mono">{account.balanceSol.toFixed(3)} SOL</div>
              </div>
            </div>
          ) : (
            <div className="text-sm">{lang === "zh" ? "请先在“Onboarding”创建账户" : "Please create an account in Onboarding first."}</div>
          )}
        </SectionCard>

        <SectionCard
          title={lang === "zh" ? "操作" : "Actions"}
          actions={
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={topUpFiat}>{lang === "zh" ? "充值 50 元" : "Top up 50 CNY"}</button>
              <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={sponsoredAction}>{lang === "zh" ? "发起代付操作" : "Sponsored action"}</button>
            </div>
          }
        >
          {lang === "zh" ? "链上操作由平台代付，并从账户法币余额中扣除。" : "On-chain fees are sponsored and deducted from fiat balance."}
        </SectionCard>
      </div>
    </AppShell>
  );
}
