"use client";

import { useState, useCallback } from "react";
import {
  Spinner, EmptyState, ErrorBox, Btn, CharField, BeastToggle,
  Tabs, OutputRow, RichText, ClientBadge, PageHeader
} from "@/components/ui";
import { callClaude, exportPDF } from "@/lib/utils/client-api";

// ── Shared product state hook ──────────────────────────────────────────────

export interface ProductData {
  title: string;
  category: string;
  description: string;
  url: string;
  market: string;
  problem: string;
  outcome: string;
  features: string;
  methodology: string;
  proof: string;
  mechanism: string;
  authority: string;
  customers: string;
  testimonials: string;
  _tip?: string;
}

export const EMPTY_PRODUCT: ProductData = {
  title: "", category: "", description: "", url: "", market: "",
  problem: "", outcome: "", features: "", methodology: "", proof: "",
  mechanism: "", authority: "", customers: "", testimonials: "",
};

// ── PRODUCT/CLIENT MODULE ──────────────────────────────────────────────────

export function ProductModule() {
  const [product, setProduct] = useState<ProductData>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const f = (k: keyof ProductData) => (v: string) => setProduct((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setLoading(true); setError("");
    try {
      const tip = await callClaude(`Review this client brief and give 2 sharp improvements:\n${JSON.stringify(product, null, 2)}`);
      setProduct((p) => ({ ...p, _tip: tip }));
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      sessionStorage.setItem("wowwgm_product", JSON.stringify({ ...product, _tip: tip }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4"><p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Required Fields</p></div>
        <CharField label="Client Title" value={product.title} onChange={f("title")} max={100} placeholder="e.g. The Property Freedom Blueprint" />
        <CharField label="Category" value={product.category} onChange={f("category")} max={100} placeholder="e.g. Property Investing" />
        <CharField label="Description" multiline value={product.description} onChange={f("description")} max={1000} hint="What it is, how it works." placeholder="Short, specific, outcome-led." />
        <CharField label="Company / Client URL" value={product.url} onChange={f("url")} max={500} placeholder="https://..." />
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 mb-4 mt-2"><p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Optional <span className="text-amber-400 normal-case font-normal">(recommended)</span></p></div>
        <CharField label="Target Market" value={product.market} onChange={f("market")} max={100} placeholder="Be narrow." />
        <CharField label="Pressing Problem" value={product.problem} onChange={f("problem")} max={200} />
        <CharField label="Desired Outcome" value={product.outcome} onChange={f("outcome")} max={200} placeholder="Specific 'after' state with numbers" />
        <CharField label="Features / USPs" multiline value={product.features} onChange={f("features")} max={200} />
        <CharField label="Methodology" value={product.methodology} onChange={f("methodology")} max={200} />
        <CharField label="Social Proof" value={product.proof} onChange={f("proof")} max={200} />
        <CharField label="Unique Mechanism" value={product.mechanism} onChange={f("mechanism")} max={200} />
        <CharField label="Authority Figure" value={product.authority} onChange={f("authority")} max={200} />
        <CharField label="Customers / Reviews" value={product.customers} onChange={f("customers")} max={100} placeholder="e.g. 12,000+ customers, 4.9 stars" />
        <CharField label="Testimonials" multiline value={product.testimonials} onChange={f("testimonials")} max={1000} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={save} disabled={loading} full>{loading ? "Saving..." : saved ? "✓ Saved!" : "Create Client"}</Btn>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">AI Feedback</h3>
        {loading && <Spinner msg="Analysing your client..." />}
        {product._tip && !loading && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5"><p className="font-bold text-amber-400 mb-3 text-sm">💡 Sharpening Tips</p><RichText content={product._tip} /></div>}
        {!product._tip && !loading && <EmptyState msg="Fill in your client and click Create to get AI feedback." />}
      </div>
    </div>
  );
}

// ── Helper to load saved product ──────────────────────────────────────────
function useProduct(): ProductData {
  if (typeof window === "undefined") return EMPTY_PRODUCT;
  try {
    const s = sessionStorage.getItem("wowwgm_product");
    return s ? JSON.parse(s) : EMPTY_PRODUCT;
  } catch { return EMPTY_PRODUCT; }
}

// ── AVATAR MODULE ─────────────────────────────────────────────────────────

const AVATAR_TABS = ["Introduction","Pains","Fears","Hopes & Dreams","Frustrations","Previous Solutions","Solution Soundbites","Desired Outcomes","Emotional Goals","Typical Day"];
const TAB_KEY: Record<string, string> = {"Introduction":"introduction","Pains":"pains","Fears":"fears","Hopes & Dreams":"hopes_dreams","Frustrations":"frustrations","Previous Solutions":"previous_solutions","Solution Soundbites":"solution_soundbites","Desired Outcomes":"desired_outcomes","Emotional Goals":"emotional_goals","Typical Day":"typical_day"};
const TAB_ICONS: Record<string, string> = {"Introduction":"👤","Pains":"😣","Fears":"😰","Hopes & Dreams":"✨","Frustrations":"😤","Previous Solutions":"🔄","Solution Soundbites":"🗣️","Desired Outcomes":"🎯","Emotional Goals":"❤️","Typical Day":"🌅"};

export function AvatarModule() {
  const product = useProduct();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState("Introduction");
  const [location, setLocation] = useState("Johannesburg");

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setAvatar(null); setError("");
    try {
      const raw = await callClaude(`Create a Dream Buyer Avatar. Use verbatim Reddit/forum-style language. Introduction in first person.\nProduct: ${product.title} | Market: ${product.market} | Problem: ${product.problem} | Outcome: ${product.outcome} | Location: ${location}\nReturn JSON with keys: name,location,age,gender,occupation,income,introduction,pains,fears,hopes_dreams,frustrations,previous_solutions,solution_soundbites,desired_outcomes,emotional_goals,typical_day\nEach value: 4-6 sentences/bullets with verbatim quotes. ONLY valid JSON, no markdown.`,
        "Return only valid JSON. No markdown, no backticks, no preamble.");
      try { setAvatar(JSON.parse(raw.replace(/```json|```/g, "").trim())); }
      catch { setAvatar({ _raw: raw }); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div>
        <ClientBadge title={product.title} />
        <CharField label="Target Location" value={location} onChange={setLocation} max={100} placeholder="e.g. Johannesburg, London" />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : "Generate Dream Buyer Avatar"}</Btn>
        {avatar && !avatar._raw && (
          <div className="mt-5 bg-zinc-800 border border-zinc-600 rounded-xl overflow-hidden">
            <div className="p-5 text-center bg-gradient-to-br from-purple-900/30 to-zinc-900">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-xl mx-auto mb-3">{avatar.name?.[0] || "?"}</div>
              <p className="text-white font-black">{avatar.name}</p>
              <p className="text-amber-400 text-xs mt-0.5">{avatar.occupation?.split(",")[0]}</p>
              <p className="text-zinc-400 text-xs mt-0.5">{avatar.location}</p>
            </div>
            <div className="p-4 space-y-2 border-t border-zinc-700 text-xs text-zinc-300">
              {[["💼", avatar.occupation],["💰", avatar.income],["🎓", avatar.age + " · " + avatar.gender]].map(([i, v]) => v && <div key={i as string} className="flex gap-2"><span>{i}</span><span>{v}</span></div>)}
            </div>
            <div className="px-4 pb-3 border-t border-zinc-700 pt-2 flex justify-end">
              <button onClick={() => exportPDF(`Avatar — ${avatar.name}`, AVATAR_TABS.map((t) => ({ heading: t, body: avatar[TAB_KEY[t]] || "" })))} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button>
            </div>
          </div>
        )}
      </div>
      <div className="col-span-2">
        {loading && <Spinner msg="Building your dream buyer from real market data..." />}
        {avatar && !avatar._raw && (
          <>
            <div className="flex gap-1 bg-zinc-800 rounded-xl p-1.5 mb-4 flex-wrap">
              {AVATAR_TABS.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === t ? "bg-amber-500 text-black" : "text-zinc-300 hover:text-white hover:bg-zinc-700"}`}>
                  <span>{TAB_ICONS[t]}</span><span className="hidden sm:block">{t}</span>
                </button>
              ))}
            </div>
            <div className="bg-zinc-800 border border-zinc-600 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-700 flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-transparent">
                <span className="text-2xl">{TAB_ICONS[activeTab]}</span>
                <div><h3 className="text-white font-bold text-sm">{activeTab}</h3><p className="text-zinc-400 text-xs">{avatar.name} · {avatar.location}</p></div>
              </div>
              <div className="p-6"><RichText content={avatar[TAB_KEY[activeTab]]} /></div>
            </div>
          </>
        )}
        {avatar?._raw && <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-5"><RichText content={avatar._raw} /></div>}
        {!avatar && !loading && !error && <EmptyState msg="Your Dream Buyer Avatar will appear here — persona card on the left, 10 deep-dive tabs on the right." />}
      </div>
    </div>
  );
}

// ── GOOGLE ADS MODULE ──────────────────────────────────────────────────────

const GADS_TABS = ["Headlines","Descriptions","Sitelinks","Keywords"];

export function GoogleAdsModule() {
  const product = useProduct();
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Headlines");
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [extraGeo, setExtraGeo] = useState("");
  const [matchFilter, setMatchFilter] = useState("All");
  const geo = extraGeo || "your target region";

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutputs({}); setError("");
    try {
      const base = `Product: ${product.title}\nCategory: ${product.category}\nMarket: ${product.market}\nGeo: ${geo}\nProblem: ${product.problem}\nOutcome: ${product.outcome}`;
      const [headlines, descriptions, sitelinks, keywords] = await Promise.all([
        callClaude(`${base}\n\nGenerate 15 Google Ads headlines. STRICT 30 char limit. Number 1-15. Show char count in brackets. Flag over 30 with ⚠️`),
        callClaude(`${base}\n\nGenerate 8 Google Ads descriptions. STRICT 90 char limit. Number 1-8. Show char count.`),
        callClaude(`${base}\n\nGenerate 6 Google Ads sitelinks. Each:\nSITELINK TITLE: (max 25 chars)\nDESCRIPTION 1: (max 35 chars)\nDESCRIPTION 2: (max 35 chars)\nURL PATH: /path\nNumber 1-6.`),
        callClaude(`${base}\n\nGenerate 40 keywords for ${geo}:\nPHRASE MATCH (in "quotes"): 15\nEXACT MATCH (in [brackets]): 15\nBROAD (+prefix): 10\nFor each: HIGH/MED/LOW volume.`),
      ]);
      setOutputs({ Headlines: headlines, Descriptions: descriptions, Sitelinks: sitelinks, Keywords: keywords });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const parseRows = (raw: string) => raw?.split("\n").filter((l) => /^\d+[\.\)]/.test(l.trim()) && l.trim().length > 3) || [];
  const parseKeywords = (raw: string) => {
    if (!raw) return [];
    return raw.split("\n").filter(l => l.trim()).map((line, i) => {
      const isPhrase = line.includes('"'); const isExact = line.includes("[") && line.includes("]"); const isBroad = line.trim().startsWith("+");
      const vol = line.includes("HIGH") ? "HIGH" : line.includes("MED") ? "MED" : line.includes("LOW") ? "LOW" : null;
      const type = isExact ? "Exact" : isPhrase ? "Phrase" : isBroad ? "Broad" : null;
      if (!type) return null;
      return { line: line.replace(/HIGH|MED|LOW/g, "").trim(), type, vol, i };
    }).filter(Boolean) as { line: string; type: string; vol: string | null; i: number }[];
  };
  const volColor = (v: string | null) => v === "HIGH" ? "text-emerald-400 bg-emerald-400/10" : v === "MED" ? "text-amber-400 bg-amber-400/10" : "text-zinc-400 bg-zinc-800";
  const matchColor = (t: string) => t === "Exact" ? "text-blue-400 bg-blue-400/10" : t === "Phrase" ? "text-purple-400 bg-purple-400/10" : "text-zinc-400 bg-zinc-700";
  const kw = parseKeywords(outputs.Keywords || "");
  const filteredKw = matchFilter === "All" ? kw : kw.filter((k) => k.type === matchFilter);

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-2">
        <ClientBadge title={product.title} />
        <CharField label="Target Geography" value={extraGeo} onChange={setExtraGeo} max={100} placeholder="e.g. South Africa, London" hint="For keyword research" />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : "Generate Google Ads"}</Btn>
        {Object.keys(outputs).length > 0 && (
          <button onClick={() => exportPDF(`Google Ads — ${product.title}`, GADS_TABS.map((t) => ({ heading: t, body: outputs[t] || "" })))} className="w-full mt-3 text-xs py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors">⬇ Download PDF</button>
        )}
      </div>
      <div className="col-span-3">
        <Tabs tabs={GADS_TABS} active={activeTab} setActive={setActiveTab} />
        {loading && <Spinner msg="Researching keywords and generating ad copy..." />}
        {activeTab === "Keywords" && !loading && (
          <div>
            <div className="flex gap-1 mb-3">{["All","Phrase","Exact","Broad"].map((f) => (<button key={f} onClick={() => setMatchFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${matchFilter === f ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{f}</button>))}</div>
            {filteredKw.length > 0 ? (
              <div className="space-y-1.5">{filteredKw.map((k, i) => (<div key={i} className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5"><button onClick={() => setFavs(f => ({...f,[`k-${k.i}`]:!f[`k-${k.i}`]}))} className="text-zinc-400 hover:text-amber-400">{favs[`k-${k.i}`] ? "★" : "☆"}</button><p className="text-zinc-200 text-sm flex-1 font-mono">{k.line}</p><div className="flex gap-1">{k.vol && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${volColor(k.vol)}`}>{k.vol}</span>}<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${matchColor(k.type)}`}>{k.type}</span></div></div>))}</div>
            ) : outputs.Keywords ? <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"><RichText content={outputs.Keywords} /></div>
            : <EmptyState msg="40 keywords with volume indicators will appear here." />}
          </div>
        )}
        {activeTab !== "Keywords" && !loading && (
          <div>
            <div className="space-y-2">{parseRows(outputs[activeTab] || "").map((line, i) => (<div key={i} className={`flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-2.5 ${favs[`${activeTab}-${i}`] ? "border-amber-500/60" : "border-zinc-700 hover:border-zinc-600"}`}><button onClick={() => setFavs(f => ({...f,[`${activeTab}-${i}`]:!f[`${activeTab}-${i}`]}))} className="text-zinc-400 hover:text-amber-400">{favs[`${activeTab}-${i}`] ? "★" : "☆"}</button><p className="text-sm flex-1 text-zinc-200">{line}</p><button onClick={() => navigator.clipboard.writeText(line)} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-500 rounded hover:bg-zinc-700">Copy</button></div>))}</div>
            {!outputs[activeTab] && <EmptyState msg={`${activeTab} will appear here.`} />}
          </div>
        )}
        {activeTab === "Sitelinks" && !loading && outputs.Sitelinks && (
          <div className="space-y-3">{outputs.Sitelinks.split(/\n(?=\d+[\.\)])/).filter((b) => b.trim().length > 5).map((block, i) => (<div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden"><div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex justify-between"><span className="text-xs font-bold text-amber-400">Sitelink {i + 1}</span><button onClick={() => navigator.clipboard.writeText(block)} className="text-xs text-zinc-400 hover:text-white">Copy</button></div><div className="p-4"><RichText content={block} /></div></div>))}</div>
        )}
      </div>
    </div>
  );
}

// ── FACEBOOK ADS MODULE ────────────────────────────────────────────────────

const AD_ANGLES = ["Curiosity","Story","Contrarian","Social Proof","Fear-Based","Result-First","Question Hook","Problem-Agitate-Solve"];
const LEAD_CTAS = ["Download Free Report","Watch Free Training","Book a Free Call","Get Instant Access"];
const ECOM_CTAS = ["Shop Now","Get Yours Today","Claim Your Discount","Order Now"];
const FB_TABS = ["Headlines","Body Copy","Link Descriptions"];

export function FacebookAdModule() {
  const product = useProduct();
  const [adType, setAdType] = useState("Lead Gen");
  const [angle, setAngle] = useState("Story");
  const [cta, setCta] = useState("Download Free Report");
  const [beast, setBeast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("Headlines");
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const ctaOptions = adType === "Lead Gen" ? LEAD_CTAS : ECOM_CTAS;

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutputs({}); setError("");
    try {
      const base = `Product: ${product.title} | Market: ${product.market} | Problem: ${product.problem} | Outcome: ${product.outcome} | Mechanism: ${product.mechanism} | Proof: ${product.proof} | Type: ${adType} | Angle: ${angle} | CTA: ${cta}`;
      const bm = beast ? "BEAST MODE: Aggressive, punchy, bold, pattern interrupts." : "";
      const [headlines, body, links] = await Promise.all([
        callClaude(`${base}\n${bm}\nGenerate 10 Facebook ad headlines using ${angle} angle. Under 40 chars. Number 1-10.`),
        callClaude(`${base}\n${bm}\nWrite 3 Facebook ad body copy variants:\n1. STRUCTURED\n2. CONVERSATIONAL\n3. STORY\nCTA: "${cta}"`),
        callClaude(`${base}\n${bm}\nGenerate 8 Facebook link descriptions. Under 25 words each. Number 1-8.`),
      ]);
      setOutputs({ Headlines: headlines, "Body Copy": body, "Link Descriptions": links });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const parseLines = (tab: string) => {
    const raw = outputs[tab] || "";
    if (tab === "Body Copy") return raw.split(/\n(?=\d+\.|STRUCTURED|CONVERSATIONAL|STORY)/i).filter((p) => p.trim().length > 20);
    return raw.split("\n").filter((l) => /^\d+[\.\)]/.test(l.trim()) && l.trim().length > 5);
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-4"><label className="label-base">Ad Type</label><div className="flex gap-2">{["Lead Gen","E-commerce"].map((t) => (<button key={t} onClick={() => { setAdType(t); setCta(t === "Lead Gen" ? LEAD_CTAS[0] : ECOM_CTAS[0]); }} className={`text-xs px-4 py-2 rounded-full border font-semibold transition-colors ${adType === t ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{t}</button>))}</div></div>
        <div className="mb-4"><label className="label-base">Angle</label><div className="flex flex-wrap gap-2">{AD_ANGLES.map((a) => (<button key={a} onClick={() => setAngle(a)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${angle === a ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{a}</button>))}</div></div>
        <div className="mb-4"><label className="label-base">CTA</label><div className="flex flex-wrap gap-2">{ctaOptions.map((c) => (<button key={c} onClick={() => setCta(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cta === c ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{c}</button>))}</div></div>
        <BeastToggle beast={beast} setBeast={setBeast} />
        <ClientBadge title={product.title} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : beast ? "⚡ Generate Beast Ads" : "Generate Facebook Ads"}</Btn>
      </div>
      <div>
        {Object.keys(outputs).length > 0 && <div className="flex justify-end mb-1"><button onClick={() => exportPDF(`Facebook Ads — ${product.title}`, FB_TABS.map((t) => ({ heading: t, body: outputs[t] || "" })))} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button></div>}
        <Tabs tabs={FB_TABS} active={activeTab} setActive={setActiveTab} />
        {loading && <Spinner msg="Writing your ads..." />}
        {activeTab === "Body Copy" && outputs["Body Copy"] ? (
          <div className="space-y-4">{parseLines("Body Copy").map((block, i) => (<div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden"><div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex justify-between"><span className="text-xs font-bold text-amber-400">{["Structured","Conversational","Story"][i] || `Variant ${i+1}`}</span><button onClick={() => navigator.clipboard.writeText(block)} className="text-xs text-zinc-500">Copy</button></div><div className="p-4"><RichText content={block} /></div></div>))}</div>
        ) : (
          <div className="space-y-2">{parseLines(activeTab).map((line, i) => (<OutputRow key={i} text={line} faved={!!favs[`${activeTab}-${i}`]} onFav={() => setFavs(f => ({...f,[`${activeTab}-${i}`]:!f[`${activeTab}-${i}`]}))} />))}</div>
        )}
        {!Object.keys(outputs).length && !loading && <EmptyState msg="Headlines, body copy, and link descriptions across 3 tabs." />}
      </div>
    </div>
  );
}

// ── HEADLINE MODULE ────────────────────────────────────────────────────────

export function HeadlineModule() {
  const product = useProduct();
  const [beast, setBeast] = useState(false);
  const [type, setType] = useState("Facebook Ad");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<string[]>([]);
  const [favs, setFavs] = useState<number[]>([]);

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutputs([]); setError("");
    try {
      const out = await callClaude(`Generate 10 ${type} headlines for: ${product.title} | Market: ${product.market} | Problem: ${product.problem} | Outcome: ${product.outcome}\n${beast ? "BEAST MODE: Aggressive, bold, pattern interrupts." : ""}\nNumber 1-10. Each on own line.`);
      const lines = out.split("\n").filter((l) => /^\d+[\.\)]/.test(l.trim()));
      setOutputs(lines.length >= 5 ? lines : out.split("\n").filter((l) => l.trim().length > 20));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-4"><label className="label-base">Type</label><div className="flex flex-wrap gap-2">{["Facebook Ad","Landing Page","Opt-in Page","Email Subject"].map((t) => (<button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${type === t ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300 hover:border-zinc-400"}`}>{t}</button>))}</div></div>
        <BeastToggle beast={beast} setBeast={setBeast} />
        <ClientBadge title={product.title} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : beast ? "⚡ Beast Headlines" : "Generate Headlines"}</Btn>
      </div>
      <div>
        {outputs.length > 0 && <div className="flex justify-end mb-3"><button onClick={() => exportPDF(`Headlines — ${product.title}`, [{ heading: "Headlines", body: outputs.join("\n") }])} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button></div>}
        {loading && <Spinner msg="Writing your headlines..." />}
        <div className="space-y-2">{outputs.map((o, i) => (<OutputRow key={i} text={o} faved={favs.includes(i)} onFav={() => setFavs(f => f.includes(i) ? f.filter(x => x !== i) : [...f, i])} />))}</div>
        {!outputs.length && !loading && !error && <EmptyState msg="Your headlines will appear here." />}
      </div>
    </div>
  );
}

// ── LANDING PAGE MODULE ────────────────────────────────────────────────────

export function LandingModule() {
  const product = useProduct();
  const [beast, setBeast] = useState(false);
  const [angle, setAngle] = useState("Shock & Solve");
  const [offerVariant, setOfferVariant] = useState("Original");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setError("");
    try {
      const html = await callClaude(`Write a complete HTML landing page.\nProduct: ${product.title}\nDescription: ${product.description}\nMarket: ${product.market}\nProblem: ${product.problem}\nOutcome: ${product.outcome}\nMechanism: ${product.mechanism}\nFeatures: ${product.features}\nProof: ${product.proof}\nAngle: ${angle}\nOffer: ${offerVariant}\n${beast ? "BEAST MODE: Bold, aggressive." : ""}\nComplete HTML with inline CSS. Dark premium design, gold (#EAB308) accents. Include: hero, problem, mechanism, benefits, social proof, CTA, guarantee. ONLY the HTML.`,
        "Write complete HTML with inline CSS. Return ONLY valid HTML starting with <!DOCTYPE html>. No markdown.");
      setOutputs(p => ({ ...p, [offerVariant]: html.replace(/```html|```/g, "").trim() }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };
  const current = outputs[offerVariant];

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-2">
        <div className="mb-4"><label className="label-base">Angle</label><div className="flex flex-wrap gap-2">{["Contrarian","Shock & Solve","Story-Based","Results-First"].map((a) => (<button key={a} onClick={() => setAngle(a)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${angle === a ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{a}</button>))}</div></div>
        <BeastToggle beast={beast} setBeast={setBeast} />
        <div className="mb-4"><label className="label-base">Offer Variant</label><div className="grid grid-cols-2 gap-2">{["Original","Godfather Offer","Free Offer","Dollar Offer"].map((v) => (<button key={v} onClick={() => setOfferVariant(v)} className={`text-xs px-3 py-2 rounded-lg border transition-colors ${offerVariant === v ? "bg-amber-500/20 border-amber-500 text-amber-300" : "border-zinc-600 text-zinc-300"}`}>{v}</button>))}</div></div>
        <ClientBadge title={product.title} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Writing Page..." : "Generate Landing Page"}</Btn>
        {current && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <button onClick={() => setViewMode("preview")} className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${viewMode === "preview" ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>👁 Preview</button>
              <button onClick={() => setViewMode("code")} className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${viewMode === "code" ? "bg-amber-500 text-black border-amber-500" : "border-zinc-600 text-zinc-300"}`}>{"</>"} HTML</button>
            </div>
            <button onClick={() => { const b = new Blob([current], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `landing-page.html`; a.click(); }} className="w-full text-xs py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors">⬇ Download HTML</button>
          </div>
        )}
      </div>
      <div className="col-span-3">
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 mb-4">{["Original","Godfather Offer","Free Offer","Dollar Offer"].map((v) => (<button key={v} onClick={() => setOfferVariant(v)} className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors flex-1 ${offerVariant === v ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"}`}>{v}</button>))}</div>
        {loading && <Spinner msg="Building your landing page..." />}
        {current && viewMode === "preview" && (
          <div className="rounded-xl overflow-hidden border border-zinc-700" style={{ height: "70vh" }}>
            <div className="bg-zinc-800 px-4 py-2 flex items-center gap-2 border-b border-zinc-700">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-amber-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
              <div className="flex-1 bg-zinc-700 rounded px-3 py-0.5 text-xs text-zinc-400 text-center">{product.title || "Landing Page"}</div>
            </div>
            <iframe srcDoc={current} className="w-full h-full bg-white" title="Preview" sandbox="allow-scripts" />
          </div>
        )}
        {current && viewMode === "code" && (
          <div className="rounded-xl overflow-hidden border border-zinc-700" style={{ height: "70vh" }}>
            <div className="bg-zinc-800 px-4 py-2 flex justify-between border-b border-zinc-700"><span className="text-xs text-zinc-400 font-mono">index.html</span><button onClick={() => navigator.clipboard.writeText(current)} className="text-xs text-zinc-400 hover:text-amber-400">Copy All</button></div>
            <pre className="p-4 text-xs text-emerald-400 font-mono overflow-auto h-full bg-zinc-950 leading-relaxed">{current}</pre>
          </div>
        )}
        {!current && !loading && <EmptyState msg="Your landing page will render as a live preview here." />}
      </div>
    </div>
  );
}

// ── MECHANISM MODULE ───────────────────────────────────────────────────────

const MECH_TABS = ["Hero Mechanisms","Headline Ideas","Beast Mode"];

export function MechanismModule() {
  const product = useProduct();
  const [fields, setFields] = useState({ why: "", prior: "", whyfail: "", descriptor: "", howitworks: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("Hero Mechanisms");
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const f = (k: keyof typeof fields) => (v: string) => setFields((p) => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutputs({}); setError("");
    try {
      const base = `Product: ${product.title} | Outcome: ${product.outcome} | Market: ${product.market} | Why problem: ${fields.why} | Prior solutions: ${fields.prior} | Why they fail: ${fields.whyfail} | Descriptor: ${fields.descriptor} | How: ${fields.howitworks}`;
      const [mechs, headlines, beast] = await Promise.all([
        callClaude(`${base}\nGenerate 5 Hero Mechanism names+descriptions:\nNAME: (punchy, ownable)\nDESCRIPTION: (2 paragraphs)\nNumber 1-5.`),
        callClaude(`${base}\nGenerate 5 Negative Angle + 5 Positive Angle headlines each with SUBHEAD.`),
        callClaude(`${base}\nBEAST MODE: 5 extremely aggressive mechanism names + 2-sentence descriptions. Number 1-5.`),
      ]);
      setOutputs({ "Hero Mechanisms": mechs, "Headline Ideas": headlines, "Beast Mode": beast });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const blocks = (outputs[activeTab] || "").split("\n\n").filter((p) => p.trim().length > 10);

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <Tabs tabs={MECH_TABS} active={activeTab} setActive={setActiveTab} />
        {loading && <Spinner msg="Engineering your mechanisms..." />}
        {blocks.length > 0 && !loading && (
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <div key={i} className={`bg-zinc-900 border rounded-xl overflow-hidden ${favs[`${activeTab}-${i}`] ? "border-amber-500/60" : "border-zinc-700 hover:border-zinc-600"}`}>
                <div className="px-4 py-3 border-b border-zinc-800 flex justify-between">
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Mechanism {i + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setFavs(fv => ({...fv,[`${activeTab}-${i}`]:!fv[`${activeTab}-${i}`]}))} className={`text-xs px-2 py-1 rounded ${favs[`${activeTab}-${i}`] ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500"}`}>{favs[`${activeTab}-${i}`] ? "★" : "☆"}</button>
                    <button onClick={() => navigator.clipboard.writeText(block)} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-500 rounded">Copy</button>
                  </div>
                </div>
                <div className="p-4"><RichText content={block} /></div>
              </div>
            ))}
            <button onClick={() => exportPDF(`Mechanisms — ${product.title}`, MECH_TABS.map((t) => ({ heading: t, body: outputs[t] || "" })))} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button>
          </div>
        )}
        {!outputs[activeTab] && !loading && <EmptyState msg="Mechanisms will appear here." />}
      </div>
      <div className="col-span-2">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Inputs</h3>
          <ClientBadge title={product.title} />
          <CharField label="Why does the problem exist?" multiline value={fields.why} onChange={f("why")} max={200} placeholder="Root cause" />
          <CharField label="Solutions they've tried" multiline value={fields.prior} onChange={f("prior")} max={200} />
          <CharField label="Why those solutions fail" multiline value={fields.whyfail} onChange={f("whyfail")} max={200} />
          <CharField label="Mechanism descriptor" value={fields.descriptor} onChange={f("descriptor")} max={100} placeholder="algorithm, protocol, system..." />
          <CharField label="How it's applied" multiline value={fields.howitworks} onChange={f("howitworks")} max={200} />
          {error && <ErrorBox msg={error} />}
          <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : "Generate Mechanisms"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── HVCO MODULE ───────────────────────────────────────────────────────────

const HVCO_TABS = ["Long Titles","Short Titles","Beast Mode Titles","Subheadlines"];

export function LeadMagnetModule() {
  const product = useProduct();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("Long Titles");
  const [favs, setFavs] = useState<Record<string, boolean>>({});

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutputs({}); setError("");
    try {
      const base = `Product: ${product.title} | Market: ${product.market} | Problem: ${product.problem} | Outcome: ${product.outcome} | Topic: ${topic || "general"}`;
      const [long, short, beast, subs] = await Promise.all([
        callClaude(`${base}\nGenerate 8 LONG HVCO titles. Specific, promise-driven, numbers/timeframes. Number 1-8.`),
        callClaude(`${base}\nGenerate 8 SHORT HVCO titles (5-7 words max). Punchy. Number 1-8.`),
        callClaude(`${base}\nBEAST MODE: 8 extremely bold HVCO titles. Number 1-8.`),
        callClaude(`${base}\nGenerate 8 HVCO subheadlines. Concrete, under 20 words. Number 1-8.`),
      ]);
      setOutputs({ "Long Titles": long, "Short Titles": short, "Beast Mode Titles": beast, Subheadlines: subs });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const lines = (outputs[activeTab] || "").split("\n").filter((l) => /^\d+[\.\)]/.test(l.trim()) && l.trim().length > 5);

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <CharField label="Topic Prompt" value={topic} onChange={setTopic} max={200} placeholder="e.g. Free 2-week trial..." />
        <ClientBadge title={product.title} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Generating..." : "Generate HVCO Titles"}</Btn>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1"><span />{Object.keys(outputs).length > 0 && <button onClick={() => exportPDF(`HVCO — ${product.title}`, HVCO_TABS.map((t) => ({ heading: t, body: outputs[t] || "" })))} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button>}</div>
        <Tabs tabs={HVCO_TABS} active={activeTab} setActive={setActiveTab} />
        {loading && <Spinner msg="Generating title variations..." />}
        <div className="space-y-2">{lines.map((line, i) => (<OutputRow key={i} text={line} faved={!!favs[`${activeTab}-${i}`]} onFav={() => setFavs(fv => ({...fv,[`${activeTab}-${i}`]:!fv[`${activeTab}-${i}`]}))} extra={<button className="text-xs px-2 py-1 bg-zinc-800 text-zinc-500 rounded whitespace-nowrap">+15</button>} />))}</div>
        {!lines.length && outputs[activeTab] && <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4"><RichText content={outputs[activeTab]} /></div>}
        {!outputs[activeTab] && !loading && <EmptyState msg="Titles across 4 tabs — Long, Short, Beast Mode, and Subheadlines." />}
      </div>
    </div>
  );
}

// ── GODFATHER MODULE ───────────────────────────────────────────────────────

export function GodfatherModule() {
  const product = useProduct();
  const [offerType, setOfferType] = useState("Godfather (Zero Risk)");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  const [faved, setFaved] = useState(false);

  const offerDesc: Record<string, string> = {
    "Godfather (Zero Risk)": "Hit the goal or full refund. Bold risk reversal.",
    "Work For Free": "Keep working until you win.",
    "$1 Trial": "Low friction $1 entry into the full offer.",
  };

  const generate = async () => {
    if (!product.title) { setError("Create and save a client first — go to the Clients module."); return; }
    setLoading(true); setOutput(""); setError("");
    try {
      const out = await callClaude(`Create "${offerType}" offer for: ${product.title} | ${product.description} | Market: ${product.market} | Outcome: ${product.outcome} | Proof: ${product.proof}\nStyle: ${offerDesc[offerType]}\nOFFER HEADLINE:\nCORE PROMISE:\nWHAT'S INCLUDED: (6 bullets)\nBONUSES: (3 named)\nGUARANTEE:\nCTA:\nURGENCY:`);
      setOutput(out);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-5 space-y-2">
          {Object.entries(offerDesc).map(([t, desc]) => (
            <button key={t} onClick={() => setOfferType(t)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${offerType === t ? "bg-amber-500/10 border-amber-500" : "border-zinc-600 text-zinc-300 hover:border-zinc-500"}`}>
              <p className={`text-sm font-semibold ${offerType === t ? "text-amber-400" : "text-zinc-200"}`}>{t}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
        <ClientBadge title={product.title} />
        {error && <ErrorBox msg={error} />}
        <Btn onClick={generate} disabled={loading} full>{loading ? "Engineering Offer..." : "Generate Godfather Offer"}</Btn>
      </div>
      <div>
        <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Offer Structure</h3>{output && <button onClick={() => exportPDF(`Godfather — ${product.title}`, [{ heading: offerType, body: output }])} className="text-xs text-zinc-400 hover:text-amber-400">⬇ PDF</button>}</div>
        {loading && <Spinner msg="Engineering your offer..." />}
        {output && (
          <div className={`bg-zinc-800 border rounded-xl overflow-hidden ${faved ? "border-amber-500/60" : "border-zinc-600"}`}>
            <div className="bg-gradient-to-r from-amber-500/10 to-transparent px-5 py-3 border-b border-zinc-700 flex justify-between">
              <span className="text-amber-400 font-bold text-sm">💎 {offerType}</span>
              <div className="flex gap-2">
                <button onClick={() => setFaved(!faved)} className={`text-xs px-2.5 py-1.5 rounded-lg ${faved ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-300"}`}>{faved ? "★ Saved" : "☆ Save"}</button>
                <button onClick={() => navigator.clipboard.writeText(output)} className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-700 text-zinc-300">Copy</button>
              </div>
            </div>
            <div className="p-5"><RichText content={output} /></div>
          </div>
        )}
        {!output && !loading && !error && <EmptyState msg="Your godfather offer will appear here." />}
      </div>
    </div>
  );
}

// ── AD CREATIVES MODULE ────────────────────────────────────────────────────

const TEMPLATES = [
  { id: "bold", name: "Bold Statement", desc: "Large headline, minimal copy" },
  { id: "social", name: "Social Proof", desc: "Result + testimonial style" },
  { id: "question", name: "Question Hook", desc: "Disruptive opening question" },
  { id: "before-after", name: "Before / After", desc: "Transformation contrast" },
  { id: "native", name: "Native Feed", desc: "Organic, phone-photo look" },
  { id: "stat", name: "Stat Shock", desc: "Lead with a bold statistic" },
];
const IMG_STYLES_LIST = [
  { id: "cinematic", label: "Cinematic" },{ id: "minimal", label: "Minimal" },{ id: "lifestyle", label: "Lifestyle" },
  { id: "abstract", label: "Abstract" },{ id: "product", label: "Product Shot" },{ id: "dark", label: "Dark & Bold" },
];

export function AdCreativesModule() {
  const product = useProduct();
  const [template, setTemplate] = useState("bold");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [cta, setCta] = useState("Learn More");
  const [bgColor, setBgColor] = useState("#0f0f1a");
  const [accentColor, setAccentColor] = useState("#EAB308");
  const [textColor, setTextColor] = useState("#ffffff");
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgStyle, setImgStyle] = useState("cinematic");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");

  const h = headline || "Your Headline Goes Here";
  const s = subtext || "Supporting copy that drives action.";

  const generateImages = useCallback(async () => {
    setImgLoading(true); setImgError("");
    try {
      let prompt = imgPrompt.trim();
      if (!prompt) {
        const raw = await callClaude(`Write a concise image generation prompt (max 40 words) for a ${imgStyle} style ad.\nClient: ${product.title || "a business"}. No text in image. Return ONLY the prompt.`);
        prompt = raw.trim(); setImgPrompt(prompt);
      }
      const seeds = [Math.random(), Math.random(), Math.random(), Math.random()].map(r => Math.floor(r * 99999));
      const enc = encodeURIComponent(prompt + ", professional advertising photography, high quality");
      setGeneratedImages(seeds.map(s => `https://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&seed=${s}&nologo=true&enhance=true`));
      setSelectedImg(`https://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&seed=${seeds[0]}&nologo=true&enhance=true`);
    } catch { setImgError("Image generation failed."); }
    setImgLoading(false);
  }, [imgPrompt, imgStyle, product.title]);

  const renderPreview = (bgImage: string | null = null) => {
    const bgStyle = bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: bgColor };
    const base: React.CSSProperties = { ...bgStyle, width: "100%", aspectRatio: "1/1", display: "flex", flexDirection: "column", padding: "32px", boxSizing: "border-box", position: "relative", overflow: "hidden", borderRadius: "12px", fontFamily: "system-ui" };
    const overlay: React.CSSProperties | null = bgImage ? { position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", borderRadius: "12px" } : null;
    const inner: React.CSSProperties = { position: "relative", zIndex: 1 };

    if (template === "bold") return (<div style={base}>{overlay && <div style={overlay} />}<div style={{ ...inner, position: "absolute", top: 0, left: 0, width: "6px", height: "100%", background: accentColor, zIndex: 2 }} /><div style={{ ...inner, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "16px" }}><p style={{ color: accentColor, fontSize: "10px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "12px" }}>{product.category || "ANNOUNCEMENT"}</p><h1 style={{ color: textColor, fontSize: "clamp(18px,4vw,30px)", fontWeight: 900, lineHeight: 1.2, marginBottom: "16px" }}>{h}</h1><p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px", lineHeight: 1.6, marginBottom: "24px" }}>{s}</p><div style={{ display: "inline-block", background: accentColor, color: "#000", padding: "10px 20px", borderRadius: "6px", fontWeight: 700, fontSize: "13px", width: "fit-content" }}>{cta} →</div></div></div>);
    if (template === "question") return (<div style={{ ...base, justifyContent: "center", alignItems: "center", textAlign: "center" }}>{overlay && <div style={overlay} />}<p style={{ ...inner, color: accentColor, fontSize: "clamp(20px,4.5vw,34px)", fontWeight: 900, lineHeight: 1.2, marginBottom: "18px" }}>{h}</p><p style={{ ...inner, color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.6, maxWidth: "80%", marginBottom: "26px" }}>{s}</p><div style={{ ...inner, background: accentColor, color: "#000", padding: "12px 28px", borderRadius: "30px", fontWeight: 700, fontSize: "14px" }}>{cta}</div></div>);
    if (template === "before-after") return (<div style={{ ...base, padding: "0", overflow: "hidden" }}><div style={{ height: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}><div style={{ textAlign: "center" }}><p style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, letterSpacing: "2px", marginBottom: "8px" }}>BEFORE</p><p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: 1.5 }}>{s}</p></div></div><div style={{ height: "50%", background: accentColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" }}><p style={{ color: "#000", fontSize: "10px", fontWeight: 700, letterSpacing: "2px", marginBottom: "8px" }}>AFTER</p><p style={{ color: "#000", fontSize: "clamp(14px,3vw,20px)", fontWeight: 900, lineHeight: 1.3, marginBottom: "12px" }}>{h}</p><div style={{ background: "#000", color: accentColor, padding: "8px 20px", borderRadius: "20px", fontWeight: 700, fontSize: "12px" }}>{cta}</div></div></div>);
    if (template === "native") return (<div style={{ ...base, background: "#f5f5f5" }}><div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}><div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px" }}>{product.title?.[0] || "W"}</div><div><p style={{ color: "#1a1a1a", fontSize: "12px", fontWeight: 600 }}>{product.title || "Sponsored"}</p><p style={{ color: "#888", fontSize: "10px" }}>Sponsored</p></div></div><div style={{ height: "140px", borderRadius: "8px", marginBottom: "14px", overflow: "hidden", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>{bgImage ? <img src={bgImage} alt="ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <p style={{ color: "#aaa", fontSize: "11px" }}>Generate an image →</p>}</div><p style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: 700, marginBottom: "5px" }}>{h}</p><p style={{ color: "#555", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>{s}</p><div style={{ background: "#1877f2", color: "#fff", padding: "9px", borderRadius: "6px", textAlign: "center", fontWeight: 600, fontSize: "13px" }}>{cta}</div></div>);
    if (template === "stat") return (<div style={{ ...base, justifyContent: "center" }}>{overlay && <div style={overlay} />}<div style={{ ...inner, textAlign: "center", marginBottom: "20px" }}><p style={{ color: accentColor, fontSize: "clamp(44px,10vw,72px)", fontWeight: 900, lineHeight: 1 }}>{product.customers?.split(" ")[0] || "500+"}</p><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}>Happy Customers</p></div><h2 style={{ ...inner, color: textColor, fontSize: "clamp(16px,3.5vw,24px)", fontWeight: 800, textAlign: "center", lineHeight: 1.3, marginBottom: "20px" }}>{h}</h2><div style={{ ...inner, background: accentColor, color: "#000", padding: "12px 24px", borderRadius: "6px", fontWeight: 700, textAlign: "center", fontSize: "13px" }}>{cta}</div></div>);
    // social
    return (<div style={{ ...base, justifyContent: "space-between" }}>{overlay && <div style={overlay} />}<div style={{ ...inner, background: "rgba(0,0,0,0.55)", border: `1px solid ${accentColor}40`, borderRadius: "8px", padding: "16px", marginBottom: "12px" }}><p style={{ color: accentColor, fontSize: "11px", marginBottom: "6px" }}>★★★★★ Verified</p><p style={{ color: "#fff", fontSize: "13px", lineHeight: 1.6, fontStyle: "italic" }}>"{s}"</p></div><div style={inner}><h1 style={{ color: textColor, fontSize: "clamp(16px,3.5vw,24px)", fontWeight: 900, lineHeight: 1.3, marginBottom: "14px" }}>{h}</h1><div style={{ background: accentColor, color: "#000", padding: "10px 20px", borderRadius: "6px", fontWeight: 700, fontSize: "13px", textAlign: "center" }}>{cta}</div></div></div>);
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-5"><label className="label-base">Template</label><div className="grid grid-cols-2 gap-2">{TEMPLATES.map((t) => (<button key={t.id} onClick={() => setTemplate(t.id)} className={`text-left px-3 py-2.5 rounded-xl border transition-all ${template === t.id ? "bg-amber-500/10 border-amber-500" : "border-zinc-700"}`}><p className={`text-xs font-bold ${template === t.id ? "text-amber-400" : "text-zinc-300"}`}>{t.name}</p><p className="text-xs text-zinc-400">{t.desc}</p></button>))}</div></div>
        <CharField label="Headline" value={headline} onChange={setHeadline} max={80} placeholder="Your main ad headline" />
        <CharField label="Body / Subtext" multiline value={subtext} onChange={setSubtext} max={200} placeholder="Supporting copy or quote" />
        <CharField label="CTA Button" value={cta} onChange={setCta} max={40} placeholder="e.g. Learn More" />
        <div className="mb-4"><label className="label-base">Colours</label><div className="flex gap-4">{[["Background",bgColor,setBgColor],["Accent",accentColor,setAccentColor],["Text",textColor,setTextColor]].map(([l,v,fn]) => (<div key={l as string} className="flex items-center gap-1.5"><input type="color" value={v as string} onChange={(e) => (fn as (v:string)=>void)(e.target.value)} className="w-8 h-8 rounded cursor-pointer" /><label className="text-xs text-zinc-500">{l as string}</label></div>))}</div></div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🎨 AI Images</p>
          <div className="mb-3"><label className="label-base">Style</label><div className="grid grid-cols-3 gap-1.5">{IMG_STYLES_LIST.map((st) => (<button key={st.id} onClick={() => setImgStyle(st.id)} className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${imgStyle === st.id ? "bg-amber-500/10 border-amber-500 text-amber-300" : "border-zinc-600 text-zinc-300"}`}>{st.label}</button>))}</div></div>
          <textarea rows={2} className="input-base text-xs mb-3" value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Leave blank to auto-generate from your client..." />
          <Btn onClick={generateImages} disabled={imgLoading} full>{imgLoading ? "Generating…" : "✨ Generate 4 AI Images"}</Btn>
          {imgError && <p className="text-red-400 text-xs mt-2">{imgError}</p>}
          {imgLoading && <div className="mt-3 grid grid-cols-4 gap-1.5">{[0,1,2,3].map(i => (<div key={i} className="aspect-square bg-zinc-800 rounded-lg animate-pulse" />))}</div>}
          {generatedImages.length > 0 && !imgLoading && (
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-1.5">{generatedImages.map((url, i) => (<button key={i} onClick={() => setSelectedImg(selectedImg === url ? null : url)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImg === url ? "border-amber-500" : "border-transparent hover:border-zinc-500"}`}><img src={url} alt={`${i+1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /></button>))}</div>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-4"><h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Live Preview</h3><span className="text-xs text-zinc-400">1:1 Square</span></div>
        <div className="w-full max-w-xs mx-auto shadow-2xl rounded-xl overflow-hidden">{renderPreview(selectedImg)}</div>
        <p className="text-center text-xs text-zinc-400 mt-3">Updates in real-time</p>
      </div>
    </div>
  );
}
