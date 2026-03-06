"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Creative {
  id: string;
  fileName: string;
  fileType: "image" | "video";
  adName: string;
  fileSize: number;
  metaAdId?: string | null;
  status: string;
  errorMessage?: string | null;
}

interface Batch {
  id: string;
  batchName: string;
  campaignName?: string | null;
  adSetName?: string | null;
  status: string;
  adsCreated: number;
  adsErrored: number;
  errorLog?: string[] | null;
  primaryTexts?: string[] | null;
  headlines?: string[] | null;
  ctaType?: string | null;
  websiteUrl?: string | null;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  complete: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  error: "bg-red-500/20 text-red-400 border border-red-500/30",
  uploading: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  draft: "bg-zinc-700 text-zinc-400",
};

const CREATIVE_DOT: Record<string, string> = {
  created: "bg-emerald-500",
  error: "bg-red-500",
  uploading: "bg-amber-500",
  pending: "bg-zinc-600",
};

function BatchCard({ batch }: { batch: Batch }) {
  const [expanded, setExpanded] = useState(false);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCreatives = useCallback(async () => {
    if (creatives.length > 0) return;
    setLoading(true);
    const r = await fetch(`/api/batch/${batch.id}/creatives`);
    const d = await r.json();
    setCreatives(d.creatives || []);
    setLoading(false);
  }, [batch.id, creatives.length]);

  const handleExpand = () => {
    setExpanded((v) => !v);
    if (!expanded) loadCreatives();
  };

  const relativeTime = formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true });

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-white font-semibold text-sm truncate">{batch.batchName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_BADGE[batch.status] || STATUS_BADGE.draft}`}>
                {batch.status}
              </span>
            </div>
            {(batch.campaignName || batch.adSetName) && (
              <p className="text-xs text-zinc-300">
                {batch.campaignName && <span>{batch.campaignName}</span>}
                {batch.campaignName && batch.adSetName && <span className="mx-1.5 text-zinc-700">→</span>}
                {batch.adSetName && <span>{batch.adSetName}</span>}
              </p>
            )}
            <p className="text-xs text-zinc-400 mt-0.5">{relativeTime}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {batch.adsCreated > 0 && (
              <span className="text-emerald-400 font-bold text-sm">{batch.adsCreated} ✓</span>
            )}
            {batch.adsErrored > 0 && (
              <span className="text-red-400 font-bold text-sm">{batch.adsErrored} ✗</span>
            )}
            <span className="text-zinc-400 text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Copy summary */}
          {(batch.ctaType || batch.websiteUrl) && (
            <div className="px-5 py-3 bg-zinc-900/50 flex flex-wrap gap-4 text-xs text-zinc-400">
              {batch.ctaType && <span>CTA: <span className="text-amber-400">{batch.ctaType}</span></span>}
              {batch.websiteUrl && (
                <span>URL: <a href={batch.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{batch.websiteUrl}</a></span>
              )}
              {batch.primaryTexts && <span>{batch.primaryTexts.length} text{batch.primaryTexts.length !== 1 ? "s" : ""}</span>}
              {batch.headlines && <span>{batch.headlines.length} headline{batch.headlines.length !== 1 ? "s" : ""}</span>}
            </div>
          )}

          {/* Creatives */}
          {loading ? (
            <div className="px-5 py-4 text-zinc-300 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {creatives.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-base">{c.fileType === "video" ? "🎬" : "🖼️"}</span>
                  <p className="text-sm text-zinc-200 font-medium flex-1">{c.adName}</p>
                  <p className="text-xs text-zinc-300 hidden md:block">{c.fileName}</p>
                  {c.metaAdId && <p className="text-xs text-zinc-400 font-mono hidden md:block">{c.metaAdId}</p>}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${CREATIVE_DOT[c.status] || CREATIVE_DOT.pending}`} />
                    <span className="text-xs text-zinc-300">{c.status}</span>
                  </div>
                  {c.errorMessage && (
                    <span className="text-xs text-red-400 truncate max-w-48" title={c.errorMessage}>{c.errorMessage}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error log */}
          {batch.errorLog && batch.errorLog.length > 0 && (
            <div className="px-5 py-4 border-t border-zinc-800 bg-red-500/5">
              <p className="text-xs font-bold text-red-400 uppercase mb-2">Batch Errors</p>
              {batch.errorLog.map((e, i) => (
                <p key={i} className="text-xs text-zinc-400 font-mono">
                  <span className="text-zinc-400">{String(i + 1).padStart(2, "0")}. </span>{e}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/batch")
      .then((r) => r.json())
      .then((d) => {
        setBatches(d.batches || []);
        setLoading(false);
      });
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-300 py-8">
        <div className="w-5 h-5 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
        Loading history…
      </div>
    );
  }

  if (!batches.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-white font-semibold mb-1">No batches yet</p>
        <p className="text-zinc-300 text-sm mb-5">Upload your first batch to see it here.</p>
        <Link href="/dashboard/meta-ads/upload" className="btn-brand px-6 py-2 text-sm">
          Upload Batch
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-zinc-300">{batches.length} batch{batches.length !== 1 ? "es" : ""}</p>
        <button onClick={() => setLastRefresh(Date.now())} className="text-xs text-zinc-300 hover:text-amber-400 transition-colors">
          ↻ Refresh
        </button>
      </div>
      <div className="space-y-3">
        {batches.map((b) => <BatchCard key={b.id} batch={b} />)}
      </div>
    </div>
  );
}
