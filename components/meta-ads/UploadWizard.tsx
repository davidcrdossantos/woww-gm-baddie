"use client";

import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────

interface LocalFile {
  file: File;
  name: string;
  size: number;
  type: "image" | "video";
  mime: string;
  preview?: string;
}

interface CreativeRecord {
  id: string;
  fileName: string;
  fileType: "image" | "video";
  adName: string;
  thumbnailPath?: string | null;
  mimeType: string;
  filePath: string;
  fileSize: number;
}

interface AdSetRecord {
  id: string;
  name: string;
  status: string;
}

interface CampaignRecord {
  id: string;
  name: string;
  status: string;
  objective: string;
}

interface LaunchResult {
  adsCreated: number;
  adsErrored: number;
  errorLog: string[];
}

const STEPS = ["Upload Creatives", "Ad Copy & URL", "Campaign & Launch"];
const CTA_OPTIONS = [
  "LEARN_MORE","SHOP_NOW","SIGN_UP","SUBSCRIBE","GET_OFFER","ORDER_NOW",
  "BOOK_NOW","CONTACT_US","DOWNLOAD","GET_QUOTE","APPLY_NOW","BUY_NOW",
  "WATCH_MORE","SEE_MENU","SEND_MESSAGE","GET_STARTED",
];
const IMAGE_MIMES = ["image/jpeg","image/png","image/gif","image/webp","image/bmp","image/tiff"];
const VIDEO_MIMES = ["video/mp4","video/quicktime","video/x-msvideo","video/x-ms-wmv","video/mpeg","video/webm"];

function classifyFile(file: File): "image" | "video" | null {
  if (IMAGE_MIMES.includes(file.type)) return "image";
  if (VIDEO_MIMES.includes(file.type)) return "video";
  return null;
}

// ── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < current
                  ? "bg-emerald-500 text-white"
                  : i === current
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                i === current ? "text-white" : i < current ? "text-emerald-400" : "text-zinc-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-3 ${i < current ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1 ─────────────────────────────────────────────────────────────────

function Step1({
  onComplete,
}: {
  onComplete: (batchId: string, creatives: CreativeRecord[]) => void;
}) {
  const today = format(new Date(), "dd MMM yyyy");
  const [batchName, setBatchName] = useState(`Batch ${today}`);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [rejectedMsg, setRejectedMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const rejected: string[] = [];
    const toAdd: LocalFile[] = [];
    for (const file of incoming) {
      const type = classifyFile(file);
      if (!type) { rejected.push(file.name); continue; }
      if (files.some((f) => f.name === file.name)) continue;
      toAdd.push({
        file,
        name: file.name,
        size: file.size,
        type,
        mime: file.type,
        preview: type === "image" ? URL.createObjectURL(file) : undefined,
      });
    }
    if (rejected.length) setRejectedMsg(`Skipped: ${rejected.join(", ")} (unsupported type)`);
    setFiles((prev) => [...prev, ...toAdd]);
  }, [files]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (name: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.name === name);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.name !== name);
    });
  };

  const handleUpload = async () => {
    if (!batchName.trim() || !files.length) return;
    setUploading(true); setError(""); setProgress(0);

    // Create batch
    const batchRes = await fetch("/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchName }),
    });
    const batchData = await batchRes.json();
    if (!batchRes.ok) { setError(batchData.error || "Failed to create batch"); setUploading(false); return; }
    const batchId = batchData.batch.id;
    setProgress(1);

    // Upload files
    const fd = new FormData();
    fd.append("batchId", batchId);
    files.forEach((f) => fd.append("files", f.file));

    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();

    if (uploadRes.status === 400) {
      setError("All uploads failed. Check file types.");
      setUploading(false);
      return;
    }

    setProgress(files.length + 1);
    await new Promise((r) => setTimeout(r, 400));
    onComplete(batchId, uploadData.creatives);
  };

  const totalSteps = files.length + 1;
  const pct = totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0;

  return (
    <div className="max-w-2xl">
      {/* Batch name */}
      <div className="mb-5">
        <label className="label-base">Batch Name</label>
        <input
          className="input-base"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          placeholder="e.g. Summer Sale Creatives"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging ? "border-amber-500 bg-amber-500/5" : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        <div className="text-4xl mb-3">📁</div>
        <p className="text-white font-semibold mb-1">Drag & drop images or videos</p>
        <p className="text-zinc-300 text-xs mb-4">JPG, PNG, GIF, WebP, BMP, TIFF · MP4, MOV, AVI, WMV, WebM</p>
        <button
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="btn-secondary text-sm px-5 py-2"
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
      </div>

      {rejectedMsg && (
        <p className="text-amber-400 text-xs mt-2">{rejectedMsg}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
          {files.map((f) => (
            <div key={f.name} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-lg">{f.type === "video" ? "🎬" : "🖼️"}</span>
              <p className="text-sm text-zinc-200 flex-1 truncate">{f.name}</p>
              <p className="text-xs text-zinc-300 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={() => removeFile(f.name)} className="text-zinc-400 hover:text-red-400 text-xs flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span>Uploading…</span><span>{pct}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || !files.length || !batchName.trim()}
        className="btn-brand w-full mt-6"
      >
        {uploading ? "Uploading…" : "Upload & Continue →"}
      </button>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────────────────

export interface AdCopyData {
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
  ctaType: string;
  websiteUrl: string;
  displayLink: string;
}

function VariationList({
  label,
  hint,
  values,
  onChange,
  multiline,
  max,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  multiline?: boolean;
  max?: number;
}) {
  const update = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...values, ""]);
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="label-base">{label}</label>
          {hint && <p className="text-xs text-zinc-300">{hint}</p>}
        </div>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            {multiline ? (
              <textarea
                rows={3}
                className="input-base resize-none flex-1"
                value={v}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`${label} ${i + 1}`}
                maxLength={max}
              />
            ) : (
              <input
                className="input-base flex-1"
                value={v}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`${label} ${i + 1}`}
                maxLength={max}
              />
            )}
            <button
              onClick={() => remove(i)}
              disabled={values.length <= 1}
              className="text-zinc-400 hover:text-red-400 disabled:opacity-30 text-sm px-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {values.length < 5 && (
        <button onClick={add} className="text-xs text-amber-500 hover:text-amber-400 mt-2">
          + Add variation
        </button>
      )}
    </div>
  );
}

function Step2({
  creatives: initialCreatives,
  onComplete,
}: {
  creatives: CreativeRecord[];
  onComplete: (data: AdCopyData, creatives: CreativeRecord[]) => void;
}) {
  const [creatives, setCreatives] = useState(initialCreatives);
  const [primaryTexts, setPrimaryTexts] = useState([""]);
  const [headlines, setHeadlines] = useState([""]);
  const [descriptions, setDescriptions] = useState([""]);
  const [ctaType, setCtaType] = useState("LEARN_MORE");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [displayLink, setDisplayLink] = useState("");
  const [validationError, setValidationError] = useState("");
  const [thumbLoading, setThumbLoading] = useState<Record<string, boolean>>({});
  const [savingName, setSavingName] = useState<Record<string, boolean>>({});

  const handleNameBlur = useCallback(async (id: string, adName: string) => {
    if (!adName.trim()) return;
    setSavingName((p) => ({ ...p, [id]: true }));
    await fetch("/api/creative", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adName }),
    });
    setSavingName((p) => ({ ...p, [id]: false }));
  }, []);

  const handleThumb = useCallback(async (id: string, file: File) => {
    setThumbLoading((p) => ({ ...p, [id]: true }));
    const fd = new FormData();
    fd.append("creativeId", id);
    fd.append("thumbnail", file);
    const r = await fetch("/api/creative/thumbnail", { method: "POST", body: fd });
    const d = await r.json();
    if (r.ok) {
      setCreatives((prev) =>
        prev.map((c) => (c.id === id ? { ...c, thumbnailPath: d.creative.thumbnailPath } : c))
      );
    }
    setThumbLoading((p) => ({ ...p, [id]: false }));
  }, []);

  const handleContinue = () => {
    const hasText = primaryTexts.some((t) => t.trim());
    const hasHeadline = headlines.some((h) => h.trim());
    let validUrl = false;
    try { new URL(websiteUrl); validUrl = true; } catch {}
    if (!hasText || !hasHeadline || !validUrl) {
      setValidationError("Please fill in at least 1 primary text, 1 headline, and a valid URL.");
      return;
    }
    setValidationError("");
    onComplete({ primaryTexts: primaryTexts.filter(Boolean), headlines: headlines.filter(Boolean), descriptions: descriptions.filter(Boolean), ctaType, websiteUrl, displayLink }, creatives);
  };

  return (
    <div className="grid grid-cols-5 gap-8 max-w-5xl">
      <div className="col-span-3">
        {/* Creatives summary */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Uploaded Creatives</h3>
          <div className="space-y-2">
            {creatives.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
                <span className="text-lg">{c.fileType === "video" ? "🎬" : "🖼️"}</span>
                <p className="text-xs text-zinc-300 flex-1 truncate">{c.fileName}</p>
                <div className="relative">
                  <input
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 w-44"
                    defaultValue={c.adName}
                    onBlur={(e) => handleNameBlur(c.id, e.target.value)}
                    placeholder="Ad name"
                  />
                  {savingName[c.id] && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-amber-500">…</span>
                  )}
                </div>
                {c.fileType === "video" && (
                  <label className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${c.thumbnailPath ? "text-emerald-400 bg-emerald-400/10" : "text-zinc-300 bg-zinc-800 hover:bg-zinc-700"}`}>
                    {thumbLoading[c.id] ? "…" : c.thumbnailPath ? "✓ Thumb" : "+ Thumb"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumb(c.id, f); }} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Copy fields */}
        <VariationList label="Primary Text" hint="Meta rotates them automatically" values={primaryTexts} onChange={setPrimaryTexts} multiline max={5000} />
        <VariationList label="Headlines" values={headlines} onChange={setHeadlines} max={255} />
        <VariationList label="Descriptions" values={descriptions} onChange={setDescriptions} max={255} />

        {/* URL & CTA */}
        <div className="mb-4">
          <label className="label-base">Website URL *</label>
          <input className="input-base" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com/page" />
        </div>
        <div className="mb-4">
          <label className="label-base">Display Link <span className="text-zinc-400 font-normal normal-case">(optional)</span></label>
          <input className="input-base" value={displayLink} onChange={(e) => setDisplayLink(e.target.value)} placeholder="yoursite.com" />
        </div>
        <div className="mb-6">
          <label className="label-base">Call to Action</label>
          <select className="input-base" value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
            {CTA_OPTIONS.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {validationError && <p className="text-red-400 text-sm mb-4">{validationError}</p>}

        <button onClick={handleContinue} className="btn-brand w-full">Continue to Launch →</button>
      </div>

      <div className="col-span-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-8">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">Copy Preview</h3>
          <p className="text-white font-semibold text-sm mb-1">{headlines[0] || "Your headline"}</p>
          <p className="text-zinc-400 text-xs leading-relaxed mb-2">{primaryTexts[0] || "Your primary text will appear here…"}</p>
          <p className="text-amber-400 text-xs font-semibold">{ctaType.replace(/_/g, " ")}</p>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Variations</p>
            <p className="text-xs text-zinc-400">{primaryTexts.filter(Boolean).length} primary text{primaryTexts.filter(Boolean).length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-zinc-400">{headlines.filter(Boolean).length} headline{headlines.filter(Boolean).length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-zinc-400">{descriptions.filter(Boolean).length} description{descriptions.filter(Boolean).length !== 1 ? "s" : ""}</p>
            {primaryTexts.filter(Boolean).length > 1 || headlines.filter(Boolean).length > 1 || descriptions.filter(Boolean).length > 1 ? (
              <p className="text-xs text-amber-500 mt-2 bg-amber-500/10 rounded px-2 py-1">Asset feed spec will be used (multi-variation)</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────────────────────

function Step3({
  creatives,
  copyData,
  onLaunch,
}: {
  creatives: CreativeRecord[];
  copyData: AdCopyData;
  onLaunch: (result: LaunchResult, adSetId: string, campaignId: string, campaignName: string, adSetName: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [adSets, setAdSets] = useState<AdSetRecord[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedAdSet, setSelectedAdSet] = useState("");
  const [adSetMode, setAdSetMode] = useState<"existing" | "create">("existing");
  const [newAdSetName, setNewAdSetName] = useState("");
  const [sourceAdSetId, setSourceAdSetId] = useState("");
  const [launchAsPaused, setLaunchAsPaused] = useState(true);
  const [enhancements, setEnhancements] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [adSetsLoading, setAdSetsLoading] = useState(false);
  const [creatingAdSet, setCreatingAdSet] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const r = await fetch("/api/meta/campaigns");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setCampaigns(d.campaigns);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const fetchAdSets = useCallback(async (campaignId: string) => {
    setAdSetsLoading(true);
    setSelectedAdSet("");
    try {
      const r = await fetch(`/api/meta/adsets?campaignId=${campaignId}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setAdSets(d.adSets);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load ad sets");
    } finally {
      setAdSetsLoading(false);
    }
  }, []);

  useState(() => { fetchCampaigns(); });

  const handleCampaignChange = (id: string) => {
    setSelectedCampaign(id);
    setAdSets([]);
    setSelectedAdSet("");
    if (id) fetchAdSets(id);
  };

  const handleCreateAdSet = async () => {
    if (!newAdSetName.trim() || !sourceAdSetId || !selectedCampaign) return;
    setCreatingAdSet(true);
    setError("");
    try {
      const r = await fetch("/api/meta/adsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAdSetName, campaignId: selectedCampaign, sourceAdSetId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      const created: AdSetRecord = { id: d.adSet.id, name: newAdSetName, status: "PAUSED" };
      setAdSets((prev) => [...prev, created]);
      setSelectedAdSet(created.id);
      setAdSetMode("existing");
      setNewAdSetName("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create ad set");
    } finally {
      setCreatingAdSet(false);
    }
  };

  const handleLaunch = async () => {
    if (!selectedAdSet || !selectedCampaign) return;
    setLaunching(true); setError("");

    const batchId = new URLSearchParams(window.location.search).get("batchId") ||
      sessionStorage.getItem("currentBatchId") || "";

    const campaign = campaigns.find((c) => c.id === selectedCampaign);
    const adSet = adSets.find((a) => a.id === selectedAdSet);

    const r = await fetch("/api/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        adSetId: selectedAdSet,
        campaignId: selectedCampaign,
        campaignName: campaign?.name,
        adSetName: adSet?.name,
        ...copyData,
        launchAsPaused,
        enhancementsEnabled: enhancements,
      }),
    });

    const d = await r.json();
    setLaunching(false);

    if (r.status === 400) { setError(d.error || "Launch failed"); return; }
    onLaunch(d, selectedAdSet, selectedCampaign, campaign?.name || "", adSet?.name || "");
  };

  const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaign);
  const selectedAdSetData = adSets.find((a) => a.id === selectedAdSet);

  return (
    <div className="grid grid-cols-5 gap-8 max-w-5xl">
      <div className="col-span-3 space-y-6">
        {/* Campaign */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Campaign</h3>
          {campaignsLoading ? (
            <div className="flex items-center gap-2 text-zinc-300 text-sm">
              <div className="w-4 h-4 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
              Loading…
            </div>
          ) : (
            <select className="input-base" value={selectedCampaign} onChange={(e) => handleCampaignChange(e.target.value)}>
              <option value="">Select a campaign…</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {selectedCampaignData && (
            <div className="mt-2 flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCampaignData.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>
                {selectedCampaignData.status}
              </span>
              <span className="text-xs text-zinc-300">{selectedCampaignData.objective}</span>
            </div>
          )}
        </div>

        {/* Ad Set */}
        {selectedCampaign && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-1">Ad Set</h3>
            <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
              ⚠️ Dynamic Creative ad sets only allow 1 ad —{" "}
              <button onClick={() => setAdSetMode("create")} className="underline">
                create a new ad set
              </button>{" "}
              for bulk uploads.
            </p>

            {adSetMode === "existing" ? (
              <>
                {adSetsLoading ? (
                  <div className="flex items-center gap-2 text-zinc-300 text-sm">
                    <div className="w-4 h-4 border border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
                    Loading ad sets…
                  </div>
                ) : (
                  <select className="input-base" value={selectedAdSet} onChange={(e) => setSelectedAdSet(e.target.value)}>
                    <option value="">Select an ad set…</option>
                    {adSets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                {selectedAdSetData && (
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${selectedAdSetData.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>
                    {selectedAdSetData.status}
                  </span>
                )}
                <button onClick={() => setAdSetMode("create")} className="text-xs text-amber-500 hover:text-amber-400 mt-3 block">
                  + Create new ad set
                </button>
              </>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-3">Clone settings from an existing ad set:</p>
                <select className="input-base mb-3" value={sourceAdSetId} onChange={(e) => setSourceAdSetId(e.target.value)}>
                  <option value="">Select source ad set…</option>
                  {adSets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input
                  className="input-base mb-3"
                  value={newAdSetName}
                  onChange={(e) => setNewAdSetName(e.target.value)}
                  placeholder="New ad set name"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateAdSet()}
                />
                <div className="flex gap-2">
                  <button onClick={handleCreateAdSet} disabled={creatingAdSet || !newAdSetName.trim() || !sourceAdSetId} className="btn-brand text-sm px-4 py-2">
                    {creatingAdSet ? "Creating…" : "Create Ad Set"}
                  </button>
                  <button onClick={() => setAdSetMode("existing")} className="btn-secondary text-sm px-4 py-2">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Launch Options */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Launch Options</h3>
          {[
            { key: "paused", label: "Launch as paused", hint: "Review in Ads Manager before activating", value: launchAsPaused, set: setLaunchAsPaused },
            { key: "enhance", label: "Enable creative enhancements", hint: "Meta AI auto-adjusts your creative", value: enhancements, set: setEnhancements },
          ].map(({ key, label, hint, value, set }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5" onClick={() => set(!value)}>
                <input type="checkbox" checked={value} onChange={() => {}} className="sr-only" />
                <div className={`w-4 h-4 rounded border transition-colors ${value ? "bg-amber-500 border-amber-500" : "border-zinc-600 bg-zinc-800"}`}>
                  {value && <span className="text-black text-xs flex items-center justify-center h-full font-bold">✓</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-200 font-medium">{label}</p>
                <p className="text-xs text-zinc-300">{hint}</p>
              </div>
            </label>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={handleLaunch}
          disabled={launching || !selectedAdSet}
          className="btn-brand w-full text-base py-3 font-black disabled:opacity-40"
        >
          {launching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Launching {creatives.length} ad{creatives.length !== 1 ? "s" : ""}…
            </span>
          ) : `🚀 Launch ${creatives.length} Ad${creatives.length !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* Summary */}
      <div className="col-span-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-8">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">Launch Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-300">Creatives</span><span className="text-white font-semibold">{creatives.length}</span></div>
            <div className="flex justify-between"><span className="text-zinc-300">Primary texts</span><span className="text-white">{copyData.primaryTexts.filter(Boolean).length}</span></div>
            <div className="flex justify-between"><span className="text-zinc-300">Headlines</span><span className="text-white">{copyData.headlines.filter(Boolean).length}</span></div>
            <div className="flex justify-between"><span className="text-zinc-300">CTA</span><span className="text-amber-400">{copyData.ctaType.replace(/_/g, " ")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-zinc-300 flex-shrink-0">URL</span><a href={copyData.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-400 truncate text-xs">{copyData.websiteUrl}</a></div>
            <div className="pt-3 border-t border-zinc-800 space-y-1">
              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${launchAsPaused ? "bg-amber-500" : "bg-emerald-500"}`} /><p className="text-xs text-zinc-400">{launchAsPaused ? "Launching paused" : "Launching active"}</p></div>
              <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${enhancements ? "bg-emerald-500" : "bg-zinc-600"}`} /><p className="text-xs text-zinc-400">Enhancements {enhancements ? "on" : "off"}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Results ────────────────────────────────────────────────────────────────

function LaunchResults({
  result,
  total,
  onReset,
}: {
  result: LaunchResult;
  total: number;
  onReset: () => void;
}) {
  const allSuccess = result.adsErrored === 0;
  const allFailed = result.adsCreated === 0;
  const partial = !allSuccess && !allFailed;

  const config = allSuccess
    ? { border: "border-emerald-500/40", bg: "bg-emerald-500/10", icon: "✅", title: "Launch Successful!", color: "text-emerald-400" }
    : allFailed
    ? { border: "border-red-500/40", bg: "bg-red-500/10", icon: "❌", title: "Launch Failed", color: "text-red-400" }
    : { border: "border-amber-500/40", bg: "bg-amber-500/10", icon: "⚠️", title: "Partially Launched", color: "text-amber-400" };

  return (
    <div className="max-w-2xl">
      <div className={`border ${config.border} ${config.bg} rounded-xl p-6 mb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h2 className={`text-lg font-black ${config.color}`}>{config.title}</h2>
            <p className="text-sm text-zinc-400">
              {allSuccess ? `All ${total} ads created successfully.` : partial ? `${result.adsCreated} of ${total} ads created.` : "No ads were created."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            ["Total", total, "text-zinc-300"],
            ["Created", result.adsCreated, "text-emerald-400"],
            ["Failed", result.adsErrored, result.adsErrored > 0 ? "text-red-400" : "text-zinc-400"],
          ].map(([label, val, color]) => (
            <div key={label as string} className="bg-zinc-900 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${color}`}>{val as number}</p>
              <p className="text-xs text-zinc-300">{label as string}</p>
            </div>
          ))}
        </div>

        {result.errorLog.length > 0 && (
          <div className="bg-zinc-950 rounded-lg p-4">
            <p className="text-xs font-bold text-red-400 uppercase mb-2">Error Log</p>
            {result.errorLog.map((e, i) => (
              <p key={i} className="text-xs text-zinc-400 font-mono leading-relaxed">
                <span className="text-zinc-400">{String(i + 1).padStart(2, "0")}. </span>{e}
              </p>
            ))}
          </div>
        )}

        {result.adsCreated > 0 && (
          <a
            href="https://adsmanager.facebook.com"
            target="_blank"
            rel="noreferrer"
            className="block text-center text-sm text-amber-400 hover:underline mt-4"
          >
            Open Ads Manager →
          </a>
        )}
      </div>

      <button onClick={onReset} className="btn-brand w-full">
        Upload Another Batch
      </button>
    </div>
  );
}

// ── Wizard Shell ───────────────────────────────────────────────────────────

export default function UploadWizard() {
  const [step, setStep] = useState(0);
  const [batchId, setBatchId] = useState("");
  const [uploadedCreatives, setUploadedCreatives] = useState<CreativeRecord[]>([]);
  const [copyData, setCopyData] = useState<AdCopyData | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  const handleStep1Complete = (id: string, creatives: CreativeRecord[]) => {
    setBatchId(id);
    setUploadedCreatives(creatives);
    sessionStorage.setItem("currentBatchId", id);
    setStep(1);
  };

  const handleStep2Complete = (data: AdCopyData, updatedCreatives: CreativeRecord[]) => {
    setCopyData(data);
    setUploadedCreatives(updatedCreatives);
    setStep(2);
  };

  const handleLaunch = (
    result: LaunchResult,
    _adSetId: string,
    _campaignId: string,
    _campaignName: string,
    _adSetName: string
  ) => {
    setLaunchResult(result);
  };

  const handleReset = () => {
    setBatchId("");
    setUploadedCreatives([]);
    setCopyData(null);
    setLaunchResult(null);
    sessionStorage.removeItem("currentBatchId");
    setStep(0);
  };

  if (launchResult) {
    return <LaunchResults result={launchResult} total={uploadedCreatives.length} onReset={handleReset} />;
  }

  return (
    <div>
      <StepIndicator current={step} />
      {step === 0 && <Step1 onComplete={handleStep1Complete} />}
      {step === 1 && <Step2 creatives={uploadedCreatives} onComplete={handleStep2Complete} />}
      {step === 2 && copyData && (
        <Step3 creatives={uploadedCreatives} copyData={copyData} onLaunch={handleLaunch} />
      )}
    </div>
  );
}
