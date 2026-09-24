// @vitest-environment jsdom
//
// The home topology painted the most recently routed provider as an idle grey node with
// no status dot, while its edge was amber — so the provider you had just used looked
// *less* connected than an untouched one. `last` was ANDed into `healthy`, and the node
// component had no `last` state to fall back on. Health owns the node state and recency
// owns the dot; this renders the real ProviderNode and reads its state and dot rather
// than pattern-matching the source. (The cards are neutral since the minimal redesign:
// only errors and live traffic tint the outline.)
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FLOW_EDGE_COLORS } from "../../../src/shared/components/flow/edgeStyles";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
// ProviderTopology navigates on node click; jsdom has no Next router context.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/shared/components/ProviderIcon", () => ({
  default: () => <span data-testid="icon" />,
}));
// Render each node through its registered node type directly: ReactFlow's own layout
// needs real measurement, which jsdom cannot provide, and it is not what we're asserting.
vi.mock("@/shared/components/flow/FlowCanvas", () => ({
  FlowCanvas: ({
    nodes,
    edges,
    nodeTypes,
  }: {
    nodes: Array<{ id: string; type?: string; data: Record<string, unknown> }>;
    edges: Array<{ id: string; target: string; style?: { stroke?: string } }>;
    nodeTypes?: Record<string, React.ComponentType<{ data: Record<string, unknown> }>>;
  }) => (
    <div>
      {nodes.map((n) => {
        const Comp = n.type ? nodeTypes?.[n.type] : undefined;
        const edge = edges.find((e) => e.target === n.id);
        return (
          <div key={n.id} data-testid={n.id} data-edge-stroke={edge?.style?.stroke ?? ""}>
            {Comp ? <Comp data={n.data} /> : null}
          </div>
        );
      })}
    </div>
  ),
}));
vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
}));

const ProviderTopology = (await import("../../../src/app/(dashboard)/home/ProviderTopology"))
  .default;

// The flow palette is theme-aware CSS custom properties (Fase 3 D1). jsdom keeps
// `var(...)` verbatim in inline styles, so compare against the token itself.
const GREEN = FLOW_EDGE_COLORS.active;
const AMBER = FLOW_EDGE_COLORS.last;
const RED = FLOW_EDGE_COLORS.error;

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

type Entry = { id: string; provider: string; name?: string; status?: string };

function render(providers: Entry[], lastProvider = "") {
  act(() => {
    root.render(
      <ProviderTopology
        providers={providers as never}
        activeRequests={[]}
        lastProvider={lastProvider}
        errorProvider=""
      />
    );
  });
}

const node = (provider: string) =>
  container.querySelector(`[data-testid="provider-${provider}"]`) as HTMLElement;
const box = (provider: string) => node(provider).querySelector("[data-state]") as HTMLElement;
const dot = (provider: string) =>
  node(provider).querySelector("span.rounded-full:not(.animate-ping)") as HTMLElement | null;

it("keeps the last-routed provider connected and marks recency on the dot", () => {
  render(
    [
      { id: "a", provider: "devin-cli", name: "Devin CLI", status: "active" },
      { id: "b", provider: "claude", name: "Claude Code", status: "active" },
    ],
    "devin-cli"
  );

  // The just-used provider: still connected, amber dot (most recent).
  expect(box("devin-cli").dataset.state).toBe("healthy");
  expect(box("devin-cli").dataset.last).toBe("true");
  expect(dot("devin-cli")).not.toBeNull();
  expect(dot("devin-cli")!.style.backgroundColor).toBe(AMBER);
  // Its edge keeps the amber last-used stroke (raw attribute, not a normalised style).
  expect(node("devin-cli").dataset.edgeStroke).toBe(FLOW_EDGE_COLORS.last);

  // An untouched but connected peer: connected, green dot, neutral outline.
  expect(box("claude").dataset.state).toBe("healthy");
  expect(box("claude").dataset.last).toBeUndefined();
  expect(dot("claude")!.style.backgroundColor).toBe(GREEN);
  expect(box("claude").style.borderColor).toBe("var(--color-border-strong)");
});

it("still greys out a provider that is genuinely idle", () => {
  render([{ id: "a", provider: "kimi-coding", name: "Kimi", status: "idle" }]);
  expect(box("kimi-coding").dataset.state).toBe("idle");
  expect(box("kimi-coding").querySelector(".text-text-muted")).not.toBeNull();
  expect(dot("kimi-coding")).toBeNull();
});

it("shows an errored connection as red even when it was the last one routed", () => {
  render([{ id: "a", provider: "agy", name: "Antigravity", status: "error" }], "agy");
  expect(box("agy").dataset.state).toBe("error");
  expect(box("agy").style.borderColor).toContain(RED);
  expect(dot("agy")!.style.backgroundColor).toBe(RED);
  expect(node("agy").dataset.edgeStroke).toBe(FLOW_EDGE_COLORS.error);
});
