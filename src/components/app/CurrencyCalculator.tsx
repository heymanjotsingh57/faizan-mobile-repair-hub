import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, RefreshCw, WifiOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CURRENCIES = [
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
] as const;

const CACHE_KEY = "repairdesk-fx-rates";
const API_URL = "https://open.er-api.com/v6/latest/USD";

type RatesCache = { base: "USD"; rates: Record<string, number>; fetchedAt: number };

function readCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as RatesCache) : null;
  } catch {
    return null;
  }
}

function formatAge(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)} day(s) ago`;
}

export function CurrencyCalculator() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [amount, setAmount] = useState("1");
  const [cache, setCache] = useState<RatesCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  async function loadRates() {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Bad response");
      const json = (await res.json()) as { result: string; rates: Record<string, number> };
      if (json.result !== "success") throw new Error("API error");
      const next: RatesCache = { base: "USD", rates: json.rates, fetchedAt: Date.now() };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      setCache(next);
      setOffline(false);
    } catch {
      const cached = readCache();
      setCache(cached);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCache(readCache());
    loadRates();
  }, []);

  const converted = useMemo(() => {
    if (!cache) return null;
    const value = parseFloat(amount);
    if (!Number.isFinite(value)) return null;
    const rFrom = cache.rates[from];
    const rTo = cache.rates[to];
    if (!rFrom || !rTo) return null;
    // base is USD: amount in `from` -> USD -> `to`
    return (value / rFrom) * rTo;
  }, [cache, amount, from, to]);

  const unitRate = useMemo(() => {
    if (!cache) return null;
    const rFrom = cache.rates[from];
    const rTo = cache.rates[to];
    if (!rFrom || !rTo) return null;
    return rTo / rFrom;
  }, [cache, from, to]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const selectCls =
    "h-12 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-ring";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-foreground">Currency Calculator</h2>
          <p className="text-xs text-muted-foreground">Convert between major currencies</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadRates}
          disabled={loading}
          aria-label="Refresh rates"
          className="h-10 w-10 rounded-xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {offline && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-status-progress px-3 py-2 text-xs font-medium text-status-progress-foreground">
          <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Offline — showing last saved rates
            {cache ? ` (${formatAge(cache.fetchedAt)})` : ". No cached rates available yet."}
          </span>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        <label htmlFor="fx-amount" className="text-xs font-semibold text-muted-foreground">
          Amount
        </label>
        <Input
          id="fx-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          className="h-12 rounded-xl text-base"
        />
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="space-y-1.5">
          <label htmlFor="fx-from" className="text-xs font-semibold text-muted-foreground">
            From
          </label>
          <select id="fx-from" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap currencies"
          className="mb-0.5 h-12 w-12 rounded-xl"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <div className="space-y-1.5">
          <label htmlFor="fx-to" className="text-xs font-semibold text-muted-foreground">
            To
          </label>
          <select id="fx-to" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-4 text-primary-foreground">
        <p className="text-xs font-medium opacity-90">Converted amount</p>
        {converted == null ? (
          <p className="mt-1 text-2xl font-extrabold">
            {loading && !cache ? "…" : "—"}
          </p>
        ) : (
          <>
            <p className="mt-1 text-3xl font-extrabold">
              {fmt(converted)} <span className="text-lg font-bold opacity-90">{to}</span>
            </p>
            {unitRate != null && (
              <p className="mt-1 text-xs opacity-90">
                1 {from} = {fmt(unitRate)} {to}
              </p>
            )}
          </>
        )}
      </div>

      {cache && !offline && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Live rates · updated {formatAge(cache.fetchedAt)}
        </p>
      )}
    </div>
  );
}