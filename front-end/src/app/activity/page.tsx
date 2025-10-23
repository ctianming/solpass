"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "en" | "zh";
type Account = { id: string; address: string; sns?: string; balanceFiat: number; balanceSol: number };

export default function ActivityPage() {
  const [lang] = useLocalStorage<Lang>("lang", "zh");
  const [account] = useLocalStorage<Account | null>("account", null);

  const items = [
    { id: 1, title: lang === "zh" ? "创建账户" : "Created account", status: "success" },
    { id: 2, title: lang === "zh" ? "充值 50 元" : "Topped up 50 CNY", status: "success" },
    { id: 3, title: lang === "zh" ? "执行一次代付操作" : "Performed sponsored tx", status: "success" },
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-5">{lang === "zh" ? "活动" : "Activity"}</h1>
      <SectionCard title={lang === "zh" ? "最近" : "Recent"}>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>{i.title}</span>
              <span className="text-emerald-600">●</span>
            </li>
          ))}
        </ul>
        {!account && <div className="mt-3 text-sm">{lang === "zh" ? "暂无记录" : "No records yet"}</div>}
      </SectionCard>
    </AppShell>
  );
}
