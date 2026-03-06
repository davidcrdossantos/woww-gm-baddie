"use client";

import { useState, useCallback } from "react";

// ── Page Header ────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-700 px-8 py-5 flex items-center justify-between sticky top-0 bg-zinc-950 z-10">
      <div>
        <h1 className="text-white font-bold text-lg">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────

export function Spinner({ msg }: { msg?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      {msg && (
        <p className="text-amber-400 text-sm animate-pulse">{msg}</p>
      )}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

export function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-8 text-center text-zinc-400 text-sm">
      {msg}
    </div>
  );
}

// ── Error Box ──────────────────────────────────────────────────────────────

export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-300 text-sm">
      <span className="font-bold">Error: </span>{msg}
    </div>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────

export function Btn({
  onClick,
  disabled,
  children,
  full,
  secondary,
  small,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  full?: boolean;
  secondary?: boolean;
  small?: boolean;
  type?: "button" | "submit";
}) {
  const size = small ? "py-1.5 px-3 text-xs" : "py-2.5 px-5 text-sm";
  if (secondary) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${full ? "w-full" : ""} ${size} bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-100 font-semibold rounded-lg transition-colors cursor-pointer`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} ${size} bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors cursor-pointer`}
    >
      {children}
    </button>
  );
}

// ── CharField ──────────────────────────────────────────────────────────────

export function CharField({
  label,
  hint,
  value,
  onChange,
  multiline,
  max,
  placeholder,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  max?: number;
  placeholder?: string;
  rows?: number;
}) {
  const left = max ? max - (value?.length || 0) : null;
  return (
    <div className="mb-4">
      <label className="label-base">{label}</label>
      {hint && <p className="text-xs text-zinc-400 mb-1">{hint}</p>}
      {multiline ? (
        <textarea
          rows={rows}
          className="input-base resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
          maxLength={max}
        />
      ) : (
        <input
          className="input-base"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
          maxLength={max}
        />
      )}
      {left !== null && (
        <p className={`text-xs mt-1 ${left < 20 ? "text-red-400" : "text-zinc-500"}`}>
          {left} chars left
        </p>
      )}
    </div>
  );
}

// ── BeastToggle ────────────────────────────────────────────────────────────

export function BeastToggle({
  beast,
  setBeast,
}: {
  beast: boolean;
  setBeast: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-600">
      <span className="text-sm text-zinc-300">Regular</span>
      <button
        onClick={() => setBeast(!beast)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          beast ? "bg-amber-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            beast ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-sm font-bold ${beast ? "text-amber-400" : "text-zinc-400"}`}>
        ⚡ Beast Mode
      </span>
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────

export function Tabs({
  tabs,
  active,
  setActive,
}: {
  tabs: string[];
  active: string;
  setActive: (t: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 mb-4 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
            active === t
              ? "bg-amber-500 text-black"
              : "text-zinc-300 hover:text-white hover:bg-zinc-700"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── OutputRow ──────────────────────────────────────────────────────────────

export function OutputRow({
  text,
  faved,
  onFav,
  extra,
}: {
  text: string;
  faved: boolean;
  onFav: () => void;
  extra?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <div
      className={`flex items-start gap-3 bg-zinc-800 border rounded-xl px-4 py-3 transition-all ${
        faved
          ? "border-amber-500/60"
          : "border-zinc-600 hover:border-zinc-500"
      }`}
    >
      <button
        onClick={onFav}
        className="text-zinc-500 hover:text-amber-400 mt-0.5 flex-shrink-0"
      >
        {faved ? "★" : "☆"}
      </button>
      <p className="text-white text-sm flex-1 leading-relaxed">{text}</p>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={copy}
          className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600"
        >
          {copied ? "✓" : "Copy"}
        </button>
        {extra}
      </div>
    </div>
  );
}

// ── RichText ───────────────────────────────────────────────────────────────

export function RichText({ content }: { content?: string }) {
  if (!content) return <p className="text-zinc-400 italic text-sm">No content yet.</p>;
  const lines = content.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('"') || trimmed.startsWith("\u201c"))
          return (
            <blockquote
              key={i}
              className="border-l-2 border-amber-500 pl-4 py-1 text-amber-200 text-sm italic leading-relaxed bg-amber-500/5 rounded-r-lg"
            >
              {trimmed}
            </blockquote>
          );
        if (/^[-•*]/.test(trimmed))
          return (
            <div key={i} className="flex gap-2 text-sm text-zinc-200 leading-relaxed">
              <span className="text-amber-500 mt-1 flex-shrink-0 text-xs">◆</span>
              <span>{trimmed.replace(/^[-•*]\s*/, "")}</span>
            </div>
          );
        if (/^#+\s/.test(trimmed))
          return (
            <h4 key={i} className="text-white font-bold text-sm mt-3">
              {trimmed.replace(/^#+\s/, "")}
            </h4>
          );
        if (/^\d+\./.test(trimmed))
          return (
            <div key={i} className="flex gap-3 text-sm text-zinc-200 leading-relaxed">
              <span className="text-amber-500 font-bold flex-shrink-0 w-5 text-right">
                {trimmed.match(/^\d+/)?.[0]}.
              </span>
              <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        return (
          <p key={i} className="text-zinc-200 text-sm leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

// ── ClientBadge ────────────────────────────────────────────────────────────

export function ClientBadge({ title }: { title?: string }) {
  return (
    <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-3 mb-5">
      <p className="text-zinc-400 text-xs uppercase font-semibold mb-1">Active Client</p>
      <p className="text-white text-sm font-medium">
        {title || <span className="text-zinc-500 italic font-normal">No client saved — go to Clients first</span>}
      </p>
    </div>
  );
}
