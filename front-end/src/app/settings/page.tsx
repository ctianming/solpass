"use client";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { useLocalStorage } from "@/lib/useLocalStorage";

type Lang = "en" | "zh";

export default function SettingsPage() {
  const [lang, setLang] = useLocalStorage<Lang>("lang", "zh");
  const [dark, setDark] = useLocalStorage("theme-dark", false);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-5">{lang === "zh" ? "设置" : "Settings"}</h1>
      <div className="grid gap-5">
        <SectionCard title={lang === "zh" ? "外观" : "Appearance"}>
          <div className="flex items-center justify-between">
            <span>{lang === "zh" ? "深色模式" : "Dark mode"}</span>
            <button className={`rounded-full border px-3 py-1 text-sm ${dark ? "bg-zinc-800 text-white" : "bg-white"}`} onClick={() => setDark(!dark)}>
              {dark ? (lang === "zh" ? "开启" : "On") : (lang === "zh" ? "关闭" : "Off")}
            </button>
          </div>
        </SectionCard>
        <SectionCard title={lang === "zh" ? "语言" : "Language"}>
          <div className="flex items-center justify-between">
            <span>{lang === "zh" ? "切换语言" : "Switch language"}</span>
            <button className="rounded-full border px-3 py-1 text-sm" onClick={() => setLang(lang === "zh" ? "en" : "zh")}>{lang.toUpperCase()}</button>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
