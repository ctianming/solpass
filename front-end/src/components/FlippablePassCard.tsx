"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Props = {
  address: string;
  name?: string | null;
  className?: string;
  lang?: "en" | "zh";
};

export function FlippablePassCard({ address, name, className = "", lang = "zh" }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const gen = async () => {
      try {
        const url = await QRCode.toDataURL(address, { width: 264, margin: 1 });
        if (mounted) setQr(url);
      } catch {}
    };
    gen();
    return () => {
      mounted = false;
    };
  }, [address]);

  const display = useMemo(() => {
    if (name) return name;
    if (!address) return lang === "zh" ? "未命名" : "Unnamed";
    return `${address.slice(0, 6)}…${address.slice(-6)}`;
  }, [name, address, lang]);

  return (
    <div className={`[perspective:1000px] ${className}`}>
      <div
        className="relative h-72 w-48 sm:h-80 sm:w-56 md:h-96 md:w-64 [transform-style:preserve-3d] transition-transform duration-500 cursor-pointer"
        onClick={() => setFlipped((v) => !v)}
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl border bg-gradient-to-br from-emerald-400/70 to-indigo-400/70 dark:from-emerald-500/20 dark:to-indigo-500/20 shadow-xl p-5 [backface-visibility:hidden]">
          <div className="flex h-full flex-col justify-between">
            <div className="text-sm opacity-80">Solana Pass</div>
            <div className="text-2xl font-extrabold tracking-wide">
              {display}
            </div>
            <div className="text-[10px] opacity-80">{lang === "zh" ? "轻触翻转，查看二维码" : "Tap to flip for QR"}</div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 rounded-2xl border bg-white dark:bg-neutral-900 shadow-xl p-4 grid place-items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {qr ? (
            <img src={qr} alt="QR" className="h-56 w-56 object-contain" />
          ) : (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}
