import { useMemo, useState, type ChangeEvent } from "react";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Clock, ChevronDown, ChevronRight, Filter, Globe, Server, Search } from "lucide-react";
import clsx from "clsx";

// Minimal HAR types we use
interface HarHeader { name: string; value: string }
interface HarCookie { name: string; value: string }
interface HarContent { size?: number; mimeType?: string; text?: string }
interface HarRequest {
  method: string;
  url: string;
  httpVersion?: string;
  cookies?: HarCookie[];
  headers?: HarHeader[];
  queryString?: { name: string; value: string }[];
  headersSize?: number;
  bodySize?: number;
  postData?: { mimeType?: string; text?: string };
}
interface HarResponse {
  status: number;
  statusText?: string;
  httpVersion?: string;
  cookies?: HarCookie[];
  headers?: HarHeader[];
  content?: HarContent;
  headersSize?: number;
  bodySize?: number;
  redirectURL?: string;
}
interface HarEntry {
  startedDateTime: string;
  time?: number; // total time (ms)
  request: HarRequest;
  response: HarResponse;
  cache?: unknown;
  timings?: { send?: number; wait?: number; receive?: number };
}
interface HarLog {
  version?: string;
  creator?: { name: string; version: string };
  browser?: { name: string; version: string };
  entries: HarEntry[];
}
interface HarRoot { log?: HarLog }

function formatBytes(bytes?: number) {
  if (bytes == null || bytes < 0) return "-";
  const sizes = ["B", "KB", "MB", "GB"]; let i = 0;
  let v = bytes;
  while (v >= 1024 && i < sizes.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${sizes[i]}`;
}

function statusTone(status: number) {
  if (status >= 200 && status < 300) return "text-success";
  if (status >= 400) return "text-danger";
  return "text-warning";
}

function tryParseUrl(raw: string): URL | null {
  try { return new URL(raw); } catch { return null; }
}

function unique<T>(arr: T[]) { return Array.from(new Set(arr)); }

function toBadgeVariant(method: string): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'AUTH' | 'default' {
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE') return m;
  return 'default';
}

export function HarViewer({ har, sourcePath }: { har: HarRoot | string; sourcePath?: string }) {
  const harObj: HarRoot = useMemo(() => {
    if (typeof har === "string") {
      try {
        return JSON.parse(har) as HarRoot;
      } catch {
        return {} as HarRoot;
      }
    } else {
      return har;
    }
  }, [har]);

  const entries: HarEntry[] = harObj?.log?.entries ?? [];

  const domains = useMemo(() => unique(entries.map(e => tryParseUrl(e.request.url)?.host).filter(Boolean) as string[]), [entries]);
  const methods = useMemo(() => unique(entries.map(e => e.request.method.toUpperCase())), [entries]);

  const times = entries.map(e => new Date(e.startedDateTime).getTime());
  const startTs = times.length ? Math.min(...times) : undefined;
  const endTs = times.length ? Math.max(...times) : undefined;

  const [query, setQuery] = useState<string>("");
  const [domain, setDomain] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<Record<string, boolean>>(
    () => Object.fromEntries(methods.map(m => [m, true]))
  );
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // ensure newly seen methods are toggled on by default
  methods.forEach((m) => { if (!(m in methodFilter)) methodFilter[m] = true; });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const u = tryParseUrl(e.request.url);
      if (domain !== "ALL" && u?.host !== domain) return false;
      const m = e.request.method.toUpperCase();
      if (!methodFilter[m]) return false;
      if (query && !e.request.url.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [entries, domain, methodFilter, query]);

  const maxTime = useMemo(() => Math.max(1, ...filtered.map(e => e.time ?? 0)), [filtered]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-small text-text-secondary mb-1 flex items-center gap-2"><Server size={14}/> Total Requests</div>
          <div className="text-h3 font-semibold">{entries.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-small text-text-secondary mb-1 flex items-center gap-2"><Globe size={14}/> Domains</div>
          <div className="text-h3 font-semibold">{domains.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-small text-text-secondary mb-1 flex items-center gap-2"><Filter size={14}/> Methods</div>
          <div className="text-h3 font-semibold">{methods.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-small text-text-secondary mb-1 flex items-center gap-2"><Clock size={14}/> Time Span</div>
          <div className="text-h3 font-semibold">
            {startTs && endTs ? `${new Date(startTs).toLocaleTimeString()} - ${new Date(endTs).toLocaleTimeString()}` : "-"}
          </div>
        </Card>
      </div>

      {sourcePath && (
        <Card className="p-3">
          <div className="text-code-sm text-text-secondary truncate">
            <span className="text-text-muted">Source HAR:</span> {sourcePath}
          </div>
        </Card>
      )}

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <Search size={16} className="text-text-muted"/>
            <Input
              placeholder="Search URL, path, or query..."
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 bg-bg-base border border-border-subtle rounded-card text-text-primary"
              value={domain}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDomain(e.target.value)}
            >
              <option value="ALL">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Method toggles */}
        <div className="mt-3 flex flex-wrap gap-2">
          {methods.map((m) => (
            <Button
              key={m}
              variant={methodFilter[m] ? "secondary" : "ghost"}
              size="sm"
              className={clsx(
                methodFilter[m] ? "" : "opacity-60",
              )}
              onClick={() => setMethodFilter({ ...methodFilter, [m]: !methodFilter[m] })}
            >
              <Badge variant={toBadgeVariant(m)}>{m}</Badge>
            </Button>
          ))}
        </div>
      </Card>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-text-muted py-12">No requests match your filters</div>
        )}
        {filtered.map((e, idx) => {
          const url = tryParseUrl(e.request.url);
          const path = url ? `${url.pathname}${url.search}` : e.request.url;
          const host = url?.host || "";
          const isOpen = !!expanded[idx];
          const t = e.time ?? (e.timings?.send ?? 0) + (e.timings?.wait ?? 0) + (e.timings?.receive ?? 0);
          const pct = Math.min(100, Math.round(((t || 0) / maxTime) * 100));
          const mime = e.response.content?.mimeType || e.request.postData?.mimeType;
          const size = (e.response.bodySize ?? e.response.headersSize ?? -1);

          return (
            <Card key={`${e.startedDateTime}:${e.request.method}:${e.request.url}`} className="p-3">
              <div className="flex items-center gap-3">
                <button
                  className="text-text-muted hover:text-text-primary"
                  type="button"
                  onClick={() => setExpanded({ ...expanded, [idx]: !isOpen })}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
                <Badge variant={toBadgeVariant(e.request.method)}>{e.request.method}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-code-sm text-text-primary" title={e.request.url}>{path}</span>
                    {host && <span className="text-code-xs text-text-muted">· {host}</span>}
                  </div>
                  <div className="mt-2 h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-2 bg-accent-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className={clsx("text-code-sm font-mono", statusTone(e.response.status))}>{e.response.status}</div>
                <div className="text-code-sm font-mono text-text-secondary w-20 text-right">{t ? `${t.toFixed(0)} ms` : "-"}</div>
                <div className="text-code-sm font-mono text-text-secondary w-24 text-right">{formatBytes(size)}</div>
              </div>

              {isOpen && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="text-small font-medium text-text-primary mb-2">Request</div>
                    <div className="text-code-sm text-text-secondary break-all"><span className="text-text-muted">URL:</span> {e.request.url}</div>
                    <div className="text-code-sm text-text-secondary"><span className="text-text-muted">HTTP:</span> {e.request.httpVersion || "-"}</div>
                    {e.request.queryString && e.request.queryString.length > 0 && (
                      <div className="mt-2">
                        <div className="text-small text-text-muted mb-1">Query</div>
                        <div className="bg-bg-base rounded-card p-2 text-code-sm overflow-auto">
                          {e.request.queryString.map((q, i) => (
                            <div key={`${q.name}:${q.value}:${i}`}><span className="text-text-muted">{q.name}:</span> {q.value}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.request.headers && e.request.headers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-small text-text-muted mb-1">Headers</div>
                        <div className="bg-bg-base rounded-card p-2 text-code-sm overflow-auto max-h-40">
                          {e.request.headers.map((h, i) => (
                            <div key={`${h.name}:${h.value}:${i}`}><span className="text-text-muted">{h.name}:</span> {h.value}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.request.postData?.text && (
                      <div className="mt-2">
                        <div className="text-small text-text-muted mb-1">Body</div>
                        <pre className="bg-bg-base rounded-card p-2 text-code-sm overflow-auto max-h-40 whitespace-pre-wrap">{e.request.postData.text}</pre>
                      </div>
                    )}
                  </Card>

                  <Card className="p-3">
                    <div className="text-small font-medium text-text-primary mb-2">Response</div>
                    <div className="text-code-sm text-text-secondary"><span className="text-text-muted">Status:</span> {e.response.status} {e.response.statusText || ""}</div>
                    <div className="text-code-sm text-text-secondary"><span className="text-text-muted">HTTP:</span> {e.response.httpVersion || "-"}</div>
                    <div className="text-code-sm text-text-secondary"><span className="text-text-muted">MIME:</span> {mime || "-"}</div>
                    <div className="text-code-sm text-text-secondary"><span className="text-text-muted">Size:</span> {formatBytes(e.response.bodySize)}</div>
                    {e.response.headers && e.response.headers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-small text-text-muted mb-1">Headers</div>
                        <div className="bg-bg-base rounded-card p-2 text-code-sm overflow-auto max-h-40">
                          {e.response.headers.map((h, i) => (
                            <div key={`${h.name}:${h.value}:${i}`}><span className="text-text-muted">{h.name}:</span> {h.value}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.response.content?.text && (
                      <div className="mt-2">
                        <div className="text-small text-text-muted mb-1">Body</div>
                        <pre className="bg-bg-base rounded-card p-2 text-code-sm overflow-auto max-h-40 whitespace-pre-wrap">{e.response.content.text}</pre>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default HarViewer;
