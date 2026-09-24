"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Handle, Position, type Node, type Edge, type NodeTypes } from "@xyflow/react";
import { AI_PROVIDERS } from "@/shared/constants/providers";
import ProviderIcon from "@/shared/components/ProviderIcon";
import { BrandMark } from "@/shared/components/BrandLogo";
import { BRAND } from "@/shared/constants/appConfig";
import { FlowCanvas } from "@/shared/components/flow/FlowCanvas";
import { StatusDot } from "@/shared/components/flow/StatusDot";
import { FLOW_EDGE_COLORS, flowColorAlpha } from "@/shared/components/flow/edgeStyles";
import { cn } from "@/shared/utils/cn";
import { getFallbackProviderColor } from "@/shared/utils/providerFallbackColor";
import { resolveTopologyNodeLabel } from "./topologyLabel";

// Rings: [capacity, rx, ry]. Each successive ring fits ~6 more nodes.
const RINGS: [number, number, number][] = [
  [8, 210, 132],
  [14, 370, 233],
  [20, 530, 334],
  [26, 690, 435],
  [32, 850, 536],
  [38, 1010, 637],
];

type ProviderConfig = { color?: string; name?: string; textIcon?: string };

function getProviderConfig(providerId: string): ProviderConfig {
  // Predefined providers keep their registry color/name untouched. Anything else (custom
  // openai-compatible-*/anthropic-compatible-* provider_nodes) gets a deterministic,
  // per-id fallback color instead of one shared gray — see #8328.
  return (
    (AI_PROVIDERS as Record<string, ProviderConfig>)[providerId] || {
      color: getFallbackProviderColor(providerId),
      name: providerId,
    }
  );
}

type ProviderNodeData = {
  label: string;
  color: string;
  providerId: string;
  active: boolean;
  error: boolean;
  /** Connection-health base state: a healthy connection with no in-flight traffic. */
  healthy: boolean;
  /** Most recently routed provider. Orthogonal to health — it can be last *and* healthy. */
  last: boolean;
};

/**
 * The topology's edge palette. Connections read as thin neutral lines; only live traffic
 * (green, animated), errors (red, dashed) and the last-routed provider (amber) add color.
 * The other flow graphs keep the shared `edgeStyle` palette.
 */
export function topologyEdgeStyle(
  active: boolean,
  last: boolean,
  error: boolean,
  healthy: boolean
): { stroke: string; strokeWidth: number; opacity: number; strokeDasharray?: string } {
  if (error)
    return {
      stroke: FLOW_EDGE_COLORS.error,
      strokeWidth: 1.25,
      opacity: 0.9,
      strokeDasharray: "4 4",
    };
  if (active) return { stroke: FLOW_EDGE_COLORS.active, strokeWidth: 1.5, opacity: 1 };
  if (last) return { stroke: FLOW_EDGE_COLORS.last, strokeWidth: 1.25, opacity: 0.9 };
  if (healthy) return { stroke: "var(--color-text-subtle)", strokeWidth: 1, opacity: 0.45 };
  return {
    stroke: "var(--color-text-subtle)",
    strokeWidth: 1,
    opacity: 0.25,
    strokeDasharray: "3 4",
  };
}

function ProviderNode({ data }: { data: ProviderNodeData }) {
  const { label, color, providerId, active, error, healthy, last } = data;
  const GREEN = FLOW_EDGE_COLORS.active;
  const AMBER = FLOW_EDGE_COLORS.last;
  // Neutral cards; the state lives on the dot. Green = connected (pulsing while a request is
  // in flight), amber = last routed (recency only, health unchanged), red = error. Only
  // errors and live traffic tint the outline; an idle provider recedes to muted text.
  const state = error ? "error" : active ? "active" : healthy ? "healthy" : "idle";
  const dotColor = last && !active ? AMBER : GREEN;

  return (
    <div
      data-state={state}
      data-last={last ? "true" : undefined}
      className="flex h-9 items-center gap-2 rounded-lg border bg-surface ps-1.5 pe-2.5 transition-colors duration-150 cursor-pointer hover:bg-bg-subtle"
      style={{
        borderColor: error
          ? flowColorAlpha(FLOW_EDGE_COLORS.error, 55)
          : active
            ? flowColorAlpha(GREEN, 55)
            : "var(--color-border-strong)",
        minWidth: "136px",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <div
        className="size-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: flowColorAlpha(color, 12) }}
      >
        <ProviderIcon providerId={providerId} size={16} type="color" />
      </div>

      <span
        className={cn(
          "text-xs font-medium truncate flex-1",
          state === "idle" ? "text-text-muted" : "text-text-main"
        )}
      >
        {label}
      </span>

      {(active || error || healthy || last) && (
        <StatusDot color={dotColor} error={error} pulse={active || error} />
      )}
    </div>
  );
}

type RouterNodeData = { activeCount: number };

function RouterNode({ data }: { data: RouterNodeData }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 rounded-card border border-border-strong bg-surface min-w-[140px] justify-center">
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-transparent !border-0 !w-0 !h-0"
      />

      <BrandMark size={28} className="rounded-md" />
      <span className="text-sm font-semibold tracking-tight text-text-main">{BRAND.shortName}</span>
      {data.activeCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold tabular-nums leading-none">
          {data.activeCount}
        </span>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  provider: ProviderNode as any,
  router: RouterNode as any,
};

type ProviderHealth = "active" | "error" | "idle";
type ProviderEntry = { id?: string; provider: string; name?: string; status?: ProviderHealth };

function getHandles(angle: number, cx: number): { sourceHandle: string; targetHandle: string } {
  const rel = (((angle + Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (rel < Math.PI / 4 || rel > (7 * Math.PI) / 4)
    return { sourceHandle: "top", targetHandle: "bottom" };
  if (rel > (3 * Math.PI) / 4 && rel < (5 * Math.PI) / 4)
    return { sourceHandle: "bottom", targetHandle: "top" };
  return cx > 0
    ? { sourceHandle: "right", targetHandle: "left" }
    : { sourceHandle: "left", targetHandle: "right" };
}

function buildLayout(
  providers: ProviderEntry[],
  activeSet: Set<string>,
  lastSet: Set<string>,
  errorSet: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const nodeW = 156;
  const nodeH = 36;
  const routerW = 148;
  const routerH = 44;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "router",
    type: "router",
    position: { x: -routerW / 2, y: -routerH / 2 },
    data: { activeCount: activeSet.size },
    draggable: false,
  });

  if (providers.length === 0) return { nodes, edges };

  // Sort: active → error → last-used → healthy(connected) → rest (alpha within groups)
  const sorted = [...providers].sort((a, b) => {
    const rank = (p: ProviderEntry) => {
      const id = p.provider.toLowerCase();
      if (activeSet.has(id)) return 0;
      if (errorSet.has(id) || p.status === "error") return 1;
      if (lastSet.has(id)) return 2;
      if (p.status === "active") return 3;
      return 4;
    };
    const d = rank(a) - rank(b);
    return d !== 0 ? d : a.provider.toLowerCase().localeCompare(b.provider.toLowerCase()); // ASCII kasıtlı
  });

  let provIdx = 0;
  for (let ri = 0; ri < RINGS.length && provIdx < sorted.length; ri++) {
    const [cap, rx, ry] = RINGS[ri];
    const count = Math.min(cap, sorted.length - provIdx);

    for (let i = 0; i < count; i++) {
      const p = sorted[provIdx++];
      const pid = p.provider.toLowerCase();
      const active = activeSet.has(pid);
      // Traffic signals (live/recent request) take precedence; connection health is the
      // base state shown when a provider has no in-flight or recent traffic, so the map
      // still reflects "what is connected" at rest instead of going blank after a restart.
      const trafficError = !active && errorSet.has(pid);
      const last = !active && !trafficError && lastSet.has(pid);
      // Health is orthogonal to recency: having just served a request does not make a
      // connection any less connected. `last` used to suppress `healthy`/`healthError`,
      // and because the node had no `last` visual it fell all the way through to the idle
      // grey — so the provider you had just used rendered *less* connected than an idle
      // peer, while its edge was amber. Health drives the border, `last` only the dot.
      const healthError = !active && !trafficError && p.status === "error";
      const healthy = !active && !trafficError && !healthError && p.status === "active";
      const error = trafficError || healthError;
      const config = getProviderConfig(p.provider);
      const nodeId = `provider-${p.provider}`;

      const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
      const cx = rx * Math.cos(angle);
      const cy = ry * Math.sin(angle);
      const { sourceHandle, targetHandle } = getHandles(angle, cx);

      nodes.push({
        id: nodeId,
        type: "provider",
        position: { x: cx - nodeW / 2, y: cy - nodeH / 2 },
        data: {
          label: resolveTopologyNodeLabel(p.name, config.name, p.provider),
          color: config.color || "#6b7280",
          providerId: p.provider,
          active,
          error,
          healthy,
          last,
        } satisfies ProviderNodeData,
        draggable: false,
      });

      edges.push({
        id: `e-${nodeId}`,
        source: "router",
        sourceHandle,
        target: nodeId,
        targetHandle,
        animated: active,
        style: topologyEdgeStyle(active, last, error, healthy),
      });
    }
  }

  return { nodes, edges };
}

type Props = {
  providers?: ProviderEntry[];
  activeRequests?: Array<{ provider?: string; model?: string }>;
  lastProvider?: string;
  errorProvider?: string;
};

export default function ProviderTopology({
  providers = [],
  activeRequests = [],
  lastProvider = "",
  errorProvider = "",
}: Props) {
  const t = useTranslations("common");
  const activeKey = useMemo(
    () =>
      activeRequests
        .map((r) => r.provider?.toLowerCase())
        .filter(Boolean)
        .sort()
        .join(","),
    [activeRequests]
  );
  const lastKey = lastProvider.toLowerCase();
  const errorKey = errorProvider.toLowerCase();

  const activeSet = useMemo(
    () => new Set<string>(activeKey ? activeKey.split(",") : []),
    [activeKey]
  );
  const lastSet = useMemo(() => new Set<string>(lastKey ? [lastKey] : []), [lastKey]);
  const errorSet = useMemo(() => new Set<string>(errorKey ? [errorKey] : []), [errorKey]);

  const { nodes, edges } = useMemo(
    () => buildLayout(providers, activeSet, lastSet, errorSet),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [providers, activeSet, lastKey, errorKey]
  );

  const providersKey = useMemo(
    () =>
      providers
        .map((p) => p.provider)
        .sort()
        .join(","),
    [providers]
  );

  const router = useRouter();

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type !== "provider") return;
      const providerId =
        (node.data as ProviderNodeData | undefined)?.providerId ||
        node.id.replace(/^provider-/, "");
      if (providerId) {
        router.push(`/dashboard/providers/${providerId}`);
      }
    },
    [router]
  );

  const containerClass =
    "h-[300px] w-full min-w-0 rounded-card border border-border bg-surface overflow-hidden sm:h-[420px]";

  if (providers.length === 0) {
    return (
      <div
        className={`${containerClass} flex flex-col items-center justify-center gap-2 text-text-muted`}
      >
        <span className="material-symbols-outlined text-[32px]">device_hub</span>
        <p className="text-sm">{t("providerTopologyEmpty")}</p>
      </div>
    );
  }

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitKey={providersKey}
      className={containerClass}
      onNodeClick={handleNodeClick}
    />
  );
}
