import { buildCommand, buildRouteMap } from "@stricli/core";
import asciichart from "asciichart";
import pc from "picocolors";
import type { GetEmailResponseSuccess } from "resend";
import { ResendClient } from "../lib/api.js";
import { stdout } from "../lib/logger.js";
import { formatError } from "../lib/output.js";
import { createSpinner } from "../lib/ui.js";
import { parseDays } from "../lib/validators/index.js";

type MetricsEmail = Pick<
  GetEmailResponseSuccess,
  "id" | "created_at" | "last_event"
>;

interface DailyBucket {
  date: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
}

interface WindowInfo {
  days: number;
  from: string;
  to: string;
}

interface MetricsJson {
  window: WindowInfo;
  totals: {
    sent: number;
    delivered: number;
    bounced: number;
    complained: number;
    deliverability_rate: number;
    bounce_rate: number;
    complain_rate: number;
  };
  by_day: DailyBucket[];
}

interface AudienceBucket {
  date: string;
  subscribed: number;
}

interface BroadcastBucket {
  date: string;
  sent: number;
}

const toDateKey = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const fmtPct = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value >= 0.995) return "100%";
  const pct = value * 100;
  return `${pct.toFixed(pct < 1 ? 2 : 1)}%`;
};

const buildWindow = (days: number): WindowInfo => {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));
  return {
    days,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

/** Wrap asciichart output in a rounded box. Uses visible width (strips ANSI) so border aligns. */
const boxChart = (chart: string): string => {
  const lines = chart.split("\n");
  const innerWidth = lines.reduce(
    (w, line) => Math.max(w, stripAnsi(line).length),
    0,
  );
  const topBorder = `╭${"─".repeat(innerWidth + 2)}╮`;
  const bottomBorder = `╰${"─".repeat(innerWidth + 2)}╯`;
  return [
    topBorder,
    ...lines.map((line) => {
      const pad = Math.max(0, innerWidth - stripAnsi(line).length);
      return `│ ${line}${" ".repeat(pad)} │`;
    }),
    bottomBorder,
  ].join("\n");
};

const CHART_CONFIG_BASE = {
  height: 8,
  format: (x: number): string => {
    const v = Math.max(0, x);
    return `${Math.round(v)}`.padStart(4, " ");
  },
} as const;

const compactDateLabels = (
  byDay: { date: string }[],
  maxLabels = 12,
): string[] => {
  const labels = byDay.map((d) => d.date.slice(5));
  const step = Math.max(1, Math.ceil(labels.length / maxLabels));
  return labels.map((label, idx) => (idx % step === 0 ? label : "  "));
};

/** Max data points for chart; axis + plot fits in ~140 cols. JSON still has full resolution. */
const MAX_CHART_POINTS = 125;

/** Downsample series for display (bucket by index, take max per bucket). Same bucket boundaries for all series.
 * When there are fewer days than maxPoints, expands (repeats) each day so the chart is wider and x-axis dates fit. */
function downsampleForChart(
  byDay: { date: string }[],
  series: number[][],
  maxPoints: number,
): { series: number[][]; labels: string[] } {
  const n = byDay.length;
  if (n === 0) return { series: [], labels: [] };
  if (n <= maxPoints) {
    const pointsPerDay = Math.floor(maxPoints / n);
    const expandedLength = pointsPerDay * n;
    const newSeries: number[][] = series.map((s) => []);
    for (let i = 0; i < expandedLength; i++) {
      const dayIdx = Math.min(Math.floor(i / pointsPerDay), n - 1);
      for (let s = 0; s < series.length; s++) {
        newSeries[s].push(series[s]?.[dayIdx] ?? 0);
      }
    }
    return {
      series: newSeries,
      labels: byDay.map((d) => d.date.slice(5)),
    };
  }
  const step = n / maxPoints;
  const newSeries: number[][] = series.map(() => []);
  const labels: string[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const start = Math.floor(i * step);
    const end = i === maxPoints - 1 ? n : Math.floor((i + 1) * step);
    for (let s = 0; s < series.length; s++) {
      let max = 0;
      for (let j = start; j < end; j++) {
        const v = series[s]?.[j] ?? 0;
        if (v > max) max = v;
      }
      newSeries[s].push(max);
    }
    labels.push(byDay[end - 1]?.date.slice(5) ?? "");
  }
  return { series: newSeries, labels };
}

/** Strip ANSI escape codes for width measurement so box aligns. */
function stripAnsi(s: string): string {
  const esc = "\u001b";
  return s.replace(new RegExp(`${esc}\\[[0-9;]*m`, "g"), "");
}

/** Build a date line that aligns with the chart's x-axis (plot area). Chart is raw asciichart output (before box). */
function formatAlignedDateLine(chart: string, chartLabels: string[]): string {
  const lines = chart
    .split("\n")
    .map(stripAnsi)
    .filter((l) => l.length > 0);
  if (!lines.length) return `Dates: ${chartLabels.join(" ")}`;
  const firstLine = lines[0] ?? "";
  const axisIdx = firstLine.search(/┼|┤/);
  const plotStart = axisIdx >= 0 ? axisIdx + 1 : 10;
  const innerWidth = lines.reduce((w, l) => Math.max(w, l.length), 0);
  const plotWidth = innerWidth - plotStart;
  const n = chartLabels.length;
  if (plotWidth <= 0 || n === 0) return `Dates: ${chartLabels.join(" ")}`;

  const slotWidth = Math.floor(plotWidth / n);
  const prefix = "  "; // align with box left padding "│ "
  const yAxisPadding = " ".repeat(plotStart);

  if (slotWidth >= 5) {
    const labelPart = chartLabels
      .map((l) => l.slice(0, slotWidth).padEnd(slotWidth))
      .join("")
      .slice(0, plotWidth);
    return prefix + yAxisPadding + labelPart;
  }

  const nShow = Math.min(5, n);
  const step = nShow > 1 ? Math.floor((n - 1) / (nShow - 1)) : 0;
  const indices = Array.from({ length: nShow }, (_, i) =>
    i === nShow - 1 ? n - 1 : i * step,
  );
  const w = Math.floor(plotWidth / nShow);
  let labelPart = "";
  for (let i = 0; i < nShow; i++) {
    const idx = indices[i] ?? 0;
    const label = (chartLabels[idx] ?? "").slice(0, w).padEnd(w);
    labelPart += label;
  }
  labelPart = labelPart.slice(0, plotWidth);
  return prefix + yAxisPadding + labelPart;
}

export const metricsRouteMap = buildRouteMap({
  routes: {
    emails: buildCommand({
      parameters: {
        flags: {
          days: {
            kind: "parsed",
            parse: parseDays,
            brief: "Time window in days (1-30, default 15)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON (for agents/scripts)",
            optional: true,
          },
        },
        aliases: { d: "days" },
      },
      docs: {
        brief:
          "Email metrics dashboard: totals + per-day graph (approximate dashboard view)",
      },
      func: async (flags: {
        days?: number;
        json?: boolean;
      }) => {
        const days = flags.days ?? 15;
        const window = buildWindow(days);
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching emails for metrics...");
        try {
          const resend = ResendClient.getInstance();
          const buckets = new Map<string, DailyBucket>();

          const dateInWindow = (dateKey: string): boolean =>
            dateKey >= window.from && dateKey <= window.to;

          const ensureBucket = (dateKey: string): DailyBucket => {
            const existing = buckets.get(dateKey);
            if (existing) return existing;
            const bucket: DailyBucket = {
              date: dateKey,
              sent: 0,
              delivered: 0,
              bounced: 0,
              complained: 0,
            };
            buckets.set(dateKey, bucket);
            return bucket;
          };

          const maxPages = 20;
          let page = 0;
          let after: string | undefined;
          // Fetch newest first and stop once we are past the window or hit max pages.
          while (page < maxPages) {
            page++;
            const params: { limit: number; after?: string } = { limit: 100 };
            if (after) params.after = after;
            const { data, error } = await resend.emails.list(params);
            if (error) {
              s.stop(formatError(error.message));
              if (flags.json) {
                stdout(JSON.stringify({ error }, null, 2));
              }
              return;
            }
            if (!data?.data?.length) break;

            const items = data.data as MetricsEmail[];
            for (const e of items) {
              const dateKey = toDateKey(e.created_at);
              if (!dateKey) continue;
              if (!dateInWindow(dateKey)) {
                // Since list is newest first, once we are before the window we can stop completely.
                if (dateKey < window.from) {
                  page = maxPages;
                  break;
                }
                continue;
              }
              const bucket = ensureBucket(dateKey);
              bucket.sent += 1;
              const ev = e.last_event ?? "";
              if (ev === "delivered") bucket.delivered += 1;
              else if (ev === "bounced") bucket.bounced += 1;
              else if (ev === "complained") bucket.complained += 1;
            }

            if (!data.has_more || items.length < params.limit) break;
            after = items[items.length - 1]?.id;
          }

          const by_day: DailyBucket[] = [];
          {
            const start = new Date(window.from);
            const end = new Date(window.to);
            for (
              let d = new Date(start);
              d <= end;
              d.setUTCDate(d.getUTCDate() + 1)
            ) {
              const key = d.toISOString().slice(0, 10);
              const b =
                buckets.get(key) ??
                ({
                  date: key,
                  sent: 0,
                  delivered: 0,
                  bounced: 0,
                  complained: 0,
                } satisfies DailyBucket);
              by_day.push(b);
            }
          }

          const totals = by_day.reduce(
            (acc, d) => {
              acc.sent += d.sent;
              acc.delivered += d.delivered;
              acc.bounced += d.bounced;
              acc.complained += d.complained;
              return acc;
            },
            {
              sent: 0,
              delivered: 0,
              bounced: 0,
              complained: 0,
            },
          );

          const base = totals.sent || 1;
          const jsonPayload: MetricsJson = {
            window,
            totals: {
              ...totals,
              deliverability_rate: totals.delivered / base,
              bounce_rate: totals.bounced / base,
              complain_rate: totals.complained / base,
            },
            by_day,
          };

          s.stop("Metrics ready");
          if (flags.json) {
            stdout(JSON.stringify(jsonPayload, null, 2));
            return;
          }

          stdout(pc.cyan(`Email metrics (last ${window.days} days)`));
          stdout(`Window: ${window.from} → ${window.to}`);
          stdout(
            `Total: ${totals.sent}   Deliverability: ${fmtPct(
              jsonPayload.totals.deliverability_rate,
            )}   Bounce: ${fmtPct(
              jsonPayload.totals.bounce_rate,
            )}   Complaints: ${fmtPct(jsonPayload.totals.complain_rate)}`,
          );
          stdout("");

          const sentValues = by_day.map((d) => d.sent);
          const deliveredValues = by_day.map((d) => d.delivered);
          const bouncedValues = by_day.map((d) => d.bounced);
          const complainedValues = by_day.map((d) => d.complained);

          const anyActivity =
            sentValues.some((v) => v > 0) ||
            deliveredValues.some((v) => v > 0) ||
            bouncedValues.some((v) => v > 0) ||
            complainedValues.some((v) => v > 0);

          if (!anyActivity) {
            stdout(pc.dim("No email activity in this window."));
            stdout(
              pc.dim(
                "Tip: Try a larger --days window if you recently started sending.",
              ),
            );
            return;
          }

          const series: number[][] = [];
          const legends: string[] = [];
          const colors: asciichart.Color[] = [];

          series.push(sentValues);
          legends.push(pc.green("● Sent"));
          colors.push(asciichart.green);

          series.push(deliveredValues);
          legends.push(pc.cyan("● Delivered"));
          colors.push(asciichart.blue);

          if (bouncedValues.some((v) => v > 0)) {
            series.push(bouncedValues);
            legends.push(pc.red("● Bounced"));
            colors.push(asciichart.red);
          }

          if (complainedValues.some((v) => v > 0)) {
            series.push(complainedValues);
            legends.push(pc.yellow("● Complained"));
            colors.push(asciichart.yellow);
          }

          const maxDaily = Math.max(
            ...sentValues,
            ...deliveredValues,
            ...bouncedValues,
            ...complainedValues,
          );

          const { series: chartSeries, labels: chartLabels } =
            downsampleForChart(by_day, series, MAX_CHART_POINTS);

          const config: asciichart.PlotConfig = {
            ...CHART_CONFIG_BASE,
            colors,
          };

          const chart = asciichart.plot(chartSeries, config);
          stdout("");
          stdout(boxChart(chart));

          stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
          stdout(pc.dim(`Range: 0 – ${maxDaily} emails/day`));
          stdout(`Legend: ${legends.join("  ")}`);
          stdout(
            pc.dim(
              "Tip: For best viewing, use a terminal at least ~140x24 characters.",
            ),
          );
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    audience: buildCommand({
      parameters: {
        flags: {
          days: {
            kind: "parsed",
            parse: parseDays,
            brief: "Time window in days (1-30, default 15)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { d: "days" },
      },
      docs: {
        brief: "Audience metrics: new contacts (subscribed) per day",
      },
      func: async (flags: { days?: number; json?: boolean }) => {
        const days = flags.days ?? 15;
        const window = buildWindow(days);
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching contacts for audience metrics...");
        try {
          const resend = ResendClient.getInstance();
          const buckets = new Map<string, number>();
          const dateInWindow = (key: string) =>
            key >= window.from && key <= window.to;

          let after: string | undefined;
          for (let p = 0; p < 20; p++) {
            const params: { limit: number; after?: string } = { limit: 100 };
            if (after) params.after = after;
            const { data, error } = await resend.contacts.list(params);
            if (error) {
              s.stop(formatError(error.message));
              if (flags.json) stdout(JSON.stringify({ error }, null, 2));
              return;
            }
            if (!data?.data?.length) break;
            const items = data.data as { id: string; created_at?: string }[];
            for (const c of items) {
              const key = toDateKey(c.created_at ?? "");
              if (!key || !dateInWindow(key)) {
                if (key && key < window.from) {
                  p = 20;
                  break;
                }
                continue;
              }
              buckets.set(key, (buckets.get(key) ?? 0) + 1);
            }
            if (!data.has_more || items.length < 100) break;
            after = items[items.length - 1]?.id;
          }

          const by_day: AudienceBucket[] = [];
          const start = new Date(window.from);
          const end = new Date(window.to);
          for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
          ) {
            const key = d.toISOString().slice(0, 10);
            by_day.push({
              date: key,
              subscribed: buckets.get(key) ?? 0,
            });
          }
          const totalSubscribed = by_day.reduce((s, d) => s + d.subscribed, 0);

          s.stop("Audience metrics ready");
          if (flags.json) {
            stdout(
              JSON.stringify(
                { window, totals: { subscribed: totalSubscribed }, by_day },
                null,
                2,
              ),
            );
            return;
          }

          stdout(pc.cyan(`Audience metrics (last ${window.days} days)`));
          stdout(`Window: ${window.from} → ${window.to}`);
          stdout(`Total new contacts: ${totalSubscribed}`);
          stdout("");

          const values = by_day.map((d) => d.subscribed);
          const hasActivity = values.some((v) => v > 0);
          if (!hasActivity) {
            stdout(pc.dim("No new contacts in this window."));
            return;
          }

          const { series: chartSeries, labels: chartLabels } =
            downsampleForChart(by_day, [values], MAX_CHART_POINTS);
          const config: asciichart.PlotConfig = {
            ...CHART_CONFIG_BASE,
            colors: [asciichart.green],
          };
          const chart = asciichart.plot(chartSeries, config);
          stdout(boxChart(chart));
          stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
          stdout(pc.dim(`Range: 0 – ${Math.max(...values)} contacts/day`));
          stdout(`Legend: ${pc.green("● Subscribed")}`);
          stdout(
            pc.dim("Tip: For best viewing, use a terminal at least ~140x24."),
          );
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    broadcasts: buildCommand({
      parameters: {
        flags: {
          days: {
            kind: "parsed",
            parse: parseDays,
            brief: "Time window in days (1-30, default 15)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON",
            optional: true,
          },
        },
        aliases: { d: "days" },
      },
      docs: {
        brief: "Broadcast metrics: broadcasts sent per day",
      },
      func: async (flags: { days?: number; json?: boolean }) => {
        const days = flags.days ?? 15;
        const window = buildWindow(days);
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching broadcasts for metrics...");
        try {
          const resend = ResendClient.getInstance();
          const buckets = new Map<string, number>();
          const dateInWindow = (key: string) =>
            key >= window.from && key <= window.to;

          let after: string | undefined;
          for (let p = 0; p < 20; p++) {
            const params: { limit: number; after?: string } = { limit: 100 };
            if (after) params.after = after;
            const { data, error } = await resend.broadcasts.list(params);
            if (error) {
              s.stop(formatError(error.message));
              if (flags.json) stdout(JSON.stringify({ error }, null, 2));
              return;
            }
            if (!data?.data?.length) break;
            const items = data.data as {
              id: string;
              sent_at?: string | null;
              created_at?: string;
            }[];
            for (const b of items) {
              const dateStr = b.sent_at ?? b.created_at ?? "";
              const key = toDateKey(dateStr);
              if (!key || !dateInWindow(key)) {
                if (key && key < window.from) {
                  p = 20;
                  break;
                }
                continue;
              }
              buckets.set(key, (buckets.get(key) ?? 0) + 1);
            }
            if (!data.has_more || items.length < 100) break;
            after = items[items.length - 1]?.id;
          }

          const by_day: BroadcastBucket[] = [];
          const start = new Date(window.from);
          const end = new Date(window.to);
          for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
          ) {
            const key = d.toISOString().slice(0, 10);
            by_day.push({ date: key, sent: buckets.get(key) ?? 0 });
          }
          const totalSent = by_day.reduce((s, d) => s + d.sent, 0);

          s.stop("Broadcast metrics ready");
          if (flags.json) {
            stdout(
              JSON.stringify(
                { window, totals: { sent: totalSent }, by_day },
                null,
                2,
              ),
            );
            return;
          }

          stdout(pc.cyan(`Broadcast metrics (last ${window.days} days)`));
          stdout(`Window: ${window.from} → ${window.to}`);
          stdout(`Total broadcasts sent: ${totalSent}`);
          stdout("");

          const values = by_day.map((d) => d.sent);
          const hasActivity = values.some((v) => v > 0);
          if (!hasActivity) {
            stdout(pc.dim("No broadcasts sent in this window."));
            return;
          }

          const { series: chartSeries, labels: chartLabels } =
            downsampleForChart(by_day, [values], MAX_CHART_POINTS);
          const config: asciichart.PlotConfig = {
            ...CHART_CONFIG_BASE,
            colors: [asciichart.blue],
          };
          const chart = asciichart.plot(chartSeries, config);
          stdout(boxChart(chart));
          stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
          stdout(pc.dim(`Range: 0 – ${Math.max(...values)} broadcasts/day`));
          stdout(`Legend: ${pc.cyan("● Sent")}`);
          stdout(
            pc.dim("Tip: For best viewing, use a terminal at least ~140x24."),
          );
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
    dashboard: buildCommand({
      parameters: {
        flags: {
          days: {
            kind: "parsed",
            parse: parseDays,
            brief: "Time window in days (1-30, default 15)",
            optional: true,
          },
          json: {
            kind: "boolean",
            brief: "Output results as JSON (emails + audience + broadcasts)",
            optional: true,
          },
        },
        aliases: { d: "days" },
      },
      docs: {
        brief: "Show 2–3 metrics charts: emails, audience, broadcasts",
      },
      func: async (flags: { days?: number; json?: boolean }) => {
        const days = flags.days ?? 15;
        const window = buildWindow(days);
        const s = createSpinner({ enabled: !flags.json });
        s.start("Fetching metrics for dashboard...");
        try {
          const resend = ResendClient.getInstance();

          // --- Emails ---
          const emailBuckets = new Map<string, DailyBucket>();
          const dateInWindow = (key: string) =>
            key >= window.from && key <= window.to;
          const ensureEmailBucket = (dateKey: string): DailyBucket => {
            let b = emailBuckets.get(dateKey);
            if (!b) {
              b = {
                date: dateKey,
                sent: 0,
                delivered: 0,
                bounced: 0,
                complained: 0,
              };
              emailBuckets.set(dateKey, b);
            }
            return b;
          };
          let after: string | undefined;
          for (let page = 0; page < 20; page++) {
            const params: { limit: number; after?: string } = { limit: 100 };
            if (after) params.after = after;
            const { data, error } = await resend.emails.list(params);
            if (error) throw error;
            if (!data?.data?.length) break;
            const items = data.data as MetricsEmail[];
            for (const e of items) {
              const key = toDateKey(e.created_at);
              if (!key || !dateInWindow(key)) {
                if (key && key < window.from) {
                  page = 20;
                  break;
                }
                continue;
              }
              const b = ensureEmailBucket(key);
              b.sent += 1;
              const ev = e.last_event ?? "";
              if (ev === "delivered") b.delivered += 1;
              else if (ev === "bounced") b.bounced += 1;
              else if (ev === "complained") b.complained += 1;
            }
            if (!data.has_more || items.length < 100) break;
            after = items[items.length - 1]?.id;
          }

          const emailByDay: DailyBucket[] = [];
          for (
            let d = new Date(window.from);
            d <= new Date(window.to);
            d.setUTCDate(d.getUTCDate() + 1)
          ) {
            const key = d.toISOString().slice(0, 10);
            emailByDay.push(
              emailBuckets.get(key) ?? {
                date: key,
                sent: 0,
                delivered: 0,
                bounced: 0,
                complained: 0,
              },
            );
          }
          const emailTotals = emailByDay.reduce(
            (acc, x) => ({
              sent: acc.sent + x.sent,
              delivered: acc.delivered + x.delivered,
              bounced: acc.bounced + x.bounced,
              complained: acc.complained + x.complained,
            }),
            { sent: 0, delivered: 0, bounced: 0, complained: 0 },
          );
          const base = emailTotals.sent || 1;

          // --- Audience ---
          const audBuckets = new Map<string, number>();
          let audAfter: string | undefined;
          for (let p = 0; p < 20; p++) {
            const params: { limit: number; after?: string } = { limit: 100 };
            if (audAfter) params.after = audAfter;
            const { data, error } = await resend.contacts.list(params);
            if (error) throw error;
            if (!data?.data?.length) break;
            const items = data.data as { id: string; created_at?: string }[];
            for (const c of items) {
              const key = toDateKey(c.created_at ?? "");
              if (!key || !dateInWindow(key)) {
                if (key && key < window.from) {
                  p = 20;
                  break;
                }
                continue;
              }
              audBuckets.set(key, (audBuckets.get(key) ?? 0) + 1);
            }
            if (!data.has_more || items.length < 100) break;
            audAfter = items[items.length - 1]?.id;
          }
          const audienceByDay: AudienceBucket[] = [];
          for (
            let d = new Date(window.from);
            d <= new Date(window.to);
            d.setUTCDate(d.getUTCDate() + 1)
          ) {
            const key = d.toISOString().slice(0, 10);
            audienceByDay.push({
              date: key,
              subscribed: audBuckets.get(key) ?? 0,
            });
          }
          const audienceTotal = audienceByDay.reduce(
            (s, x) => s + x.subscribed,
            0,
          );

          // --- Broadcasts ---
          const bcBuckets = new Map<string, number>();
          let bcAfter: string | undefined;
          for (let p = 0; p < 20; p++) {
            const params: { limit: number; after?: string } = { limit: 100 };
            if (bcAfter) params.after = bcAfter;
            const { data, error } = await resend.broadcasts.list(params);
            if (error) throw error;
            if (!data?.data?.length) break;
            const items = data.data as {
              id: string;
              sent_at?: string | null;
              created_at?: string;
            }[];
            for (const b of items) {
              const key = toDateKey(b.sent_at ?? b.created_at ?? "");
              if (!key || !dateInWindow(key)) {
                if (key && key < window.from) {
                  p = 20;
                  break;
                }
                continue;
              }
              bcBuckets.set(key, (bcBuckets.get(key) ?? 0) + 1);
            }
            if (!data.has_more || items.length < 100) break;
            bcAfter = items[items.length - 1]?.id;
          }
          const broadcastsByDay: BroadcastBucket[] = [];
          for (
            let d = new Date(window.from);
            d <= new Date(window.to);
            d.setUTCDate(d.getUTCDate() + 1)
          ) {
            const key = d.toISOString().slice(0, 10);
            broadcastsByDay.push({
              date: key,
              sent: bcBuckets.get(key) ?? 0,
            });
          }
          const broadcastsTotal = broadcastsByDay.reduce(
            (s, x) => s + x.sent,
            0,
          );

          s.stop("Dashboard ready");
          if (flags.json) {
            stdout(
              JSON.stringify(
                {
                  window,
                  emails: {
                    totals: {
                      ...emailTotals,
                      deliverability_rate: emailTotals.delivered / base,
                      bounce_rate: emailTotals.bounced / base,
                      complain_rate: emailTotals.complained / base,
                    },
                    by_day: emailByDay,
                  },
                  audience: {
                    totals: { subscribed: audienceTotal },
                    by_day: audienceByDay,
                  },
                  broadcasts: {
                    totals: { sent: broadcastsTotal },
                    by_day: broadcastsByDay,
                  },
                },
                null,
                2,
              ),
            );
            return;
          }

          stdout(
            `${pc.bold(pc.cyan("Metrics dashboard"))} (last ${window.days} days)`,
          );
          stdout(`Window: ${window.from} → ${window.to}`);
          stdout("");

          // Chart 1: Emails
          const sentV = emailByDay.map((d) => d.sent);
          const delV = emailByDay.map((d) => d.delivered);
          const hasEmail = sentV.some((v) => v > 0) || delV.some((v) => v > 0);
          if (hasEmail) {
            stdout(pc.cyan("Emails"));
            const { series: chartSeries, labels: chartLabels } =
              downsampleForChart(emailByDay, [sentV, delV], MAX_CHART_POINTS);
            const cfg: asciichart.PlotConfig = {
              ...CHART_CONFIG_BASE,
              colors: [asciichart.green, asciichart.blue],
            };
            const chart = asciichart.plot(chartSeries, cfg);
            stdout(boxChart(chart));
            stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
            stdout(`Legend: ${pc.green("● Sent")}  ${pc.cyan("● Delivered")}`);
            stdout("");
          } else {
            stdout(`${pc.cyan("Emails")}${pc.dim(" — No activity in window")}`);
            stdout("");
          }

          // Chart 2: Audience
          const subV = audienceByDay.map((d) => d.subscribed);
          const hasAudience = subV.some((v) => v > 0);
          if (hasAudience) {
            stdout(pc.cyan("Audience (new contacts)"));
            const { series: chartSeries, labels: chartLabels } =
              downsampleForChart(audienceByDay, [subV], MAX_CHART_POINTS);
            const cfg: asciichart.PlotConfig = {
              ...CHART_CONFIG_BASE,
              colors: [asciichart.green],
            };
            const chart = asciichart.plot(chartSeries, cfg);
            stdout(boxChart(chart));
            stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
            stdout(`Legend: ${pc.green("● Subscribed")}`);
            stdout("");
          } else {
            stdout(
              `${pc.cyan("Audience")}${pc.dim(" — No new contacts in window")}`,
            );
            stdout("");
          }

          // Chart 3: Broadcasts
          const bcV = broadcastsByDay.map((d) => d.sent);
          const hasBroadcasts = bcV.some((v) => v > 0);
          if (hasBroadcasts) {
            stdout(pc.cyan("Broadcasts"));
            const { series: chartSeries, labels: chartLabels } =
              downsampleForChart(broadcastsByDay, [bcV], MAX_CHART_POINTS);
            const cfg: asciichart.PlotConfig = {
              ...CHART_CONFIG_BASE,
              colors: [asciichart.blue],
            };
            const chart = asciichart.plot(chartSeries, cfg);
            stdout(boxChart(chart));
            stdout(pc.dim(formatAlignedDateLine(chart, chartLabels)));
            stdout(`Legend: ${pc.cyan("● Sent")}`);
            stdout("");
          } else {
            stdout(
              `${pc.cyan("Broadcasts")}${pc.dim(" — No broadcasts sent in window")}`,
            );
            stdout("");
          }

          stdout(
            pc.dim("Tip: For best viewing, use a terminal at least ~140x24."),
          );
        } catch (err: unknown) {
          s.stop(formatError((err as Error).message));
          throw err;
        }
      },
    }),
  },
  docs: {
    brief: "Metrics dashboard (emails, audience, broadcasts)",
  },
});
