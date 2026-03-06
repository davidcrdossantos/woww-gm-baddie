"use client";

import { useState, useEffect, useCallback } from "react";

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
}

interface Page {
  id: string;
  name: string;
}

interface SavedSettings {
  hasToken: boolean;
  tokenPreview?: string;
  adAccountId?: string;
  adAccountName?: string;
  pageId?: string;
  pageName?: string;
}

export default function SettingsForm() {
  const [token, setToken] = useState("");
  const [tokenDirty, setTokenDirty] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState<SavedSettings | null>(null);

  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [pagesError, setPagesError] = useState("");

  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SavedSettings) => {
        setSaved(data);
        if (data.tokenPreview) setToken(data.tokenPreview);
        if (data.adAccountId) setSelectedAccount(data.adAccountId);
        if (data.pageId) setSelectedPage(data.pageId);
        if (data.hasToken) {
          fetchAccounts();
          fetchPages();
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const r = await fetch("/api/meta/accounts");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setAccounts(d.accounts);
    } catch (e: unknown) {
      setAccountsError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    setPagesLoading(true);
    setPagesError("");
    try {
      const r = await fetch("/api/meta/pages");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setPages(d.pages);
    } catch (e: unknown) {
      setPagesError(e instanceof Error ? e.message : "Failed to load pages");
    } finally {
      setPagesLoading(false);
    }
  }, []);

  const handleSaveToken = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token }),
    });
    setSaving(false);
    setTokenDirty(false);
    await Promise.all([fetchAccounts(), fetchPages()]);
  };

  const handleSaveAll = async () => {
    const account = accounts.find((a) => a.id === selectedAccount);
    const page = pages.find((p) => p.id === selectedPage);

    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: token,
        adAccountId: selectedAccount,
        adAccountName: account?.name,
        pageId: selectedPage,
        pageName: page?.name,
      }),
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Token */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Meta Access Token</h2>
        <p className="text-xs text-zinc-300 mb-4">
          Get yours from{" "}
          <a
            href="https://developers.facebook.com/tools/explorer"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline"
          >
            Meta Graph API Explorer
          </a>
          . Add <code className="bg-zinc-800 px-1 rounded text-amber-300">ads_management</code> and{" "}
          <code className="bg-zinc-800 px-1 rounded text-amber-300">pages_read_engagement</code> permissions.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showToken ? "text" : "password"}
              className="input-base pr-10"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setTokenDirty(true);
              }}
              placeholder="EAAxxxxxxxxxx..."
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-300 text-xs"
            >
              {showToken ? "Hide" : "Show"}
            </button>
          </div>
          {tokenDirty && (
            <button
              onClick={handleSaveToken}
              disabled={saving}
              className="btn-brand text-sm px-4 py-2 whitespace-nowrap"
            >
              {saving ? "Saving…" : "Save & Fetch →"}
            </button>
          )}
        </div>

        {saved?.hasToken && !tokenDirty && (
          <p className="text-xs text-emerald-500 mt-2">✓ Token saved</p>
        )}
      </div>

      {/* Ad Accounts */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Ad Account</h2>
            <p className="text-xs text-zinc-300">Ads will be created in this account</p>
          </div>
          <button
            onClick={fetchAccounts}
            className="text-xs text-zinc-300 hover:text-amber-400 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {accountsLoading && (
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <div className="w-4 h-4 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
            Loading accounts…
          </div>
        )}
        {accountsError && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {accountsError}{" "}
            <button onClick={fetchAccounts} className="underline">
              Retry
            </button>
          </div>
        )}
        {!accountsLoading && !accountsError && accounts.length === 0 && (
          <p className="text-zinc-400 text-sm">
            {saved?.hasToken ? "No ad accounts found." : "Save a token first to load accounts."}
          </p>
        )}

        <div className="space-y-2">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAccount(a.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                selectedAccount === a.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${selectedAccount === a.id ? "text-amber-400" : "text-zinc-200"}`}>
                  {a.name}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    a.account_status === 1
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {a.account_status === 1 ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                act_{a.account_id} · {a.currency}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Facebook Page</h2>
            <p className="text-xs text-zinc-300">Ads publish from this page</p>
          </div>
          <button
            onClick={fetchPages}
            className="text-xs text-zinc-300 hover:text-amber-400 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {pagesLoading && (
          <div className="flex items-center gap-2 text-zinc-300 text-sm">
            <div className="w-4 h-4 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
            Loading pages…
          </div>
        )}
        {pagesError && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {pagesError}{" "}
            <button onClick={fetchPages} className="underline">
              Retry
            </button>
          </div>
        )}
        {!pagesLoading && !pagesError && pages.length === 0 && (
          <p className="text-zinc-400 text-sm">
            {saved?.hasToken ? "No pages found." : "Save a token first to load pages."}
          </p>
        )}

        <div className="space-y-2">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPage(p.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                selectedPage === p.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <p className={`text-sm font-semibold ${selectedPage === p.id ? "text-amber-400" : "text-zinc-200"}`}>
                {p.name}
              </p>
              <p className="text-xs text-zinc-300 mt-0.5">{p.id}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSaveAll}
        disabled={saving || !selectedAccount || !selectedPage}
        className="btn-brand w-full py-3 text-base font-black disabled:opacity-40"
      >
        {saving ? "Saving…" : saveSuccess ? "✓ Settings Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
