import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Sparkles, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/recommendations")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Healthcare Ops Advisor — KPI Recommendations" },
      {
        name: "description",
        content:
          "Turn cost, utilization, and throughput KPIs into prioritized executive recommendations.",
      },
    ],
  }),
});

type MetricRow = {
  id: string;
  name: string;
  current: string;
  target: string;
  unit: string;
};

const newRow = (): MetricRow => ({
  id: crypto.randomUUID(),
  name: "",
  current: "",
  target: "",
  unit: "",
});

const SAMPLE: MetricRow[] = [
  { id: crypto.randomUUID(), name: "OR Utilization", current: "68", target: "82", unit: "%" },
  { id: crypto.randomUUID(), name: "Avg Length of Stay", current: "5.4", target: "4.2", unit: "days" },
  { id: crypto.randomUUID(), name: "Cost per Discharge", current: "12450", target: "10800", unit: "USD" },
  { id: crypto.randomUUID(), name: "ED Throughput", current: "2.1", target: "3.0", unit: "pts/hr" },
];

function Index() {
  const [timePeriod, setTimePeriod] = useState("Q3 2026");
  const [metrics, setMetrics] = useState<MetricRow[]>([newRow(), newRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const updateMetric = (id: string, field: keyof MetricRow, value: string) => {
    setMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const addRow = () => setMetrics((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setMetrics((prev) => (prev.length <= 2 ? prev : prev.filter((m) => m.id !== id)));

  const loadSample = () => {
    setMetrics(SAMPLE.map((m) => ({ ...m, id: crypto.randomUUID() })));
    setTimePeriod("Q3 2026");
    setError(null);
    setResult(null);
  };

  const validate = (): { ok: true; payload: { timePeriod: string; metrics: { name: string; current: number; target: number; unit?: string }[] } } | { ok: false; error: string } => {
    if (!timePeriod.trim()) return { ok: false, error: "Time period is required." };
    const filled = metrics.filter(
      (m) => m.name.trim() !== "" || m.current !== "" || m.target !== "",
    );
    if (filled.length < 2) return { ok: false, error: "Provide at least 2 metrics with current values and targets." };

    const out: { name: string; current: number; target: number; unit?: string }[] = [];
    for (const m of filled) {
      if (!m.name.trim()) return { ok: false, error: "Every metric needs a name." };
      if (m.current === "" || m.target === "") {
        return { ok: false, error: `Metric "${m.name}" is missing current value or target.` };
      }
      const c = Number(m.current);
      const t = Number(m.target);
      if (!Number.isFinite(c)) return { ok: false, error: `Metric "${m.name}" current value must be a number.` };
      if (!Number.isFinite(t)) return { ok: false, error: `Metric "${m.name}" target must be a number.` };
      out.push({ name: m.name.trim(), current: c, target: t, unit: m.unit.trim() || undefined });
    }
    return { ok: true, payload: { timePeriod: timePeriod.trim(), metrics: out } };
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    const v = validate();
    if (!v.ok) {
      setError(v.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v.payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Request failed.");
      } else {
        setResult(data.result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Healthcare Ops Advisor
              </h1>
              <p className="text-sm text-muted-foreground">
                KPI-driven recommendations for cost, utilization, and throughput.
              </p>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Operational KPIs</CardTitle>
                <CardDescription>
                  Enter at least 2 metrics with current values and targets. Numeric only.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadSample}>
                Load sample
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="period">Time period</Label>
              <Input
                id="period"
                placeholder="e.g. Q3 2026"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="hidden grid-cols-12 gap-3 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                <div className="col-span-4">Metric</div>
                <div className="col-span-3">Current</div>
                <div className="col-span-3">Target</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-1" />
              </div>

              {metrics.map((m, idx) => (
                <div key={m.id} className="grid grid-cols-12 gap-3">
                  <Input
                    className="col-span-12 sm:col-span-4"
                    placeholder={`Metric ${idx + 1} name`}
                    value={m.name}
                    onChange={(e) => updateMetric(m.id, "name", e.target.value)}
                  />
                  <Input
                    className="col-span-6 sm:col-span-3"
                    type="number"
                    placeholder="Current"
                    value={m.current}
                    onChange={(e) => updateMetric(m.id, "current", e.target.value)}
                  />
                  <Input
                    className="col-span-6 sm:col-span-3"
                    type="number"
                    placeholder="Target"
                    value={m.target}
                    onChange={(e) => updateMetric(m.id, "target", e.target.value)}
                  />
                  <Input
                    className="col-span-10 sm:col-span-1"
                    placeholder="Unit"
                    value={m.unit}
                    onChange={(e) => updateMetric(m.id, "unit", e.target.value)}
                  />
                  <div className="col-span-2 flex items-center justify-end sm:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(m.id)}
                      disabled={metrics.length <= 2}
                      aria-label="Remove metric"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1 h-4 w-4" />
                Add metric
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cannot generate</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? "Analyzing…" : "Generate recommendations"}
              </Button>
              <span className="text-xs text-muted-foreground">
                Validation runs before any AI call.
              </span>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Recommendations</CardTitle>
                <Badge variant="secondary">{timePeriod}</Badge>
              </div>
              <CardDescription>Prioritized by potential impact.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {result
                  .split("\n")
                  .map((l) => l.trim())
                  .filter((l) => /^\d+\./.test(l))
                  .map((line, i) => {
                    const text = line.replace(/^\d+\.\s*/, "");
                    return (
                      <li key={i} className="flex gap-3 rounded-md border border-border bg-card p-4">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{text}</p>
                      </li>
                    );
                  })}
              </ol>
              {!/^\d+\./m.test(result) && (
                <p className="text-sm text-muted-foreground">{result}</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
