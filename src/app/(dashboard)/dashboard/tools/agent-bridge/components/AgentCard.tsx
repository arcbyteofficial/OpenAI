"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AgentIcon } from "./shared/AgentIcon";
import { DnsStatusBadge } from "./shared/DnsStatusBadge";
import { ModelMappingTable } from "./ModelMappingTable";
import { SetupWizard } from "./SetupWizard";
import { RiskNoticeModal } from "@/shared/components/RiskNoticeModal";
import type { MitmTargetView } from "@/mitm/types";
import type { AgentStateEntry, AgentBridgeServerState } from "../AgentBridgePageClient";
import type { MappingRow } from "./ModelMappingTable";

const RISK_STORAGE_KEY_PREFIX = "omniroute-agentbridge-risk-dismissed-";

function hasAcceptedRisk(agentId: string): boolean {
  try {
    return localStorage.getItem(RISK_STORAGE_KEY_PREFIX + agentId) === "true";
  } catch {
    return false;
  }
}

interface AgentCardProps {
  target: MitmTargetView;
  agentState: AgentStateEntry | undefined;
  serverRunning: boolean;
  serverState: AgentBridgeServerState;
  mappings: MappingRow[];
  onDnsToggle: (agentId: string, enabled: boolean) => Promise<void>;
  onMappingsSave: (agentId: string, mappings: MappingRow[]) => Promise<void>;
}

/**
 * Expandable card for a single IDE agent.
 */
export function AgentCard({
  target,
  agentState,
  serverRunning,
  serverState,
  mappings,
  onDnsToggle,
  onMappingsSave,
}: AgentCardProps) {
  const t = useTranslations("agentBridge");
  const [expanded, setExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);

  const dnsEnabled = agentState?.dns_enabled ?? false;
  const setupCompleted = agentState?.setup_completed ?? false;
  // Fix #8656 Issue A: Use server-level cert trust as fallback
  // (one server cert applies to all agents; agentState.cert_trusted is never written to DB)
  const certTrusted = agentState?.cert_trusted ?? serverState.certTrusted ?? false;
  const isInvestigating = target.viability === "investigating";

  const getStatusBadge = () => {
    if (isInvestigating) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-subtle text-text-muted text-xs font-medium">
          <span className="material-symbols-outlined text-[12px]">search</span>
          {t("statusInvestigating") || "Investigating"}
        </span>
      );
    }
    if (setupCompleted && dnsEnabled) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {t("statusActive") || "Active"}
        </span>
      );
    }
    if (!setupCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-subtle text-text-muted text-xs font-medium">
          <span className="material-symbols-outlined text-[12px]">settings</span>
          {t("statusSetupRequired") || "Setup required"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
        <span className="material-symbols-outlined text-[12px]">warning</span>
        {t("statusDnsOff") || "DNS off"}
      </span>
    );
  };

  const reallyToggleDns = async (enabled: boolean) => {
    setDnsLoading(true);
    try {
      await onDnsToggle(target.id, enabled);
    } finally {
      setDnsLoading(false);
    }
  };

  const handleDnsToggle = async () => {
    const enabling = !dnsEnabled;
    if (enabling && !hasAcceptedRisk(target.id)) {
      setRiskModalOpen(true);
      return;
    }
    await reallyToggleDns(enabling);
  };

  const handleRiskAccept = async () => {
    setRiskModalOpen(false);
    await reallyToggleDns(true);
  };

  return (
    <>
      <div
        className="rounded-card border border-border bg-surface overflow-hidden transition-colors hover:border-border-strong"
        style={{ borderLeftWidth: 3, borderLeftColor: target.color }}
      >
        {/* Card header */}
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-subtle transition-colors"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3 min-w-0">
            <AgentIcon icon={target.icon} color={target.color} size={18} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-main truncate">{target.name}</p>
              <p className="text-xs text-text-muted truncate">
                {target.hosts.slice(0, 2).join(", ")}
                {target.hosts.length > 2 && ` +${target.hosts.length - 2}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge()}
            <DnsStatusBadge enabled={dnsEnabled} />
            <span className="material-symbols-outlined text-[16px] text-text-muted">
              {expanded ? "expand_less" : "expand_more"}
            </span>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-4 flex flex-col gap-4">
            {/* Hosts */}
            <div>
              <p className="text-xs font-medium text-text-muted mb-1.5">
                {t("agentHosts") || "Intercepted hosts"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {target.hosts.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-bg-subtle text-xs font-mono text-text-muted border border-border"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Cert status */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span
                className={`material-symbols-outlined text-[14px] ${certTrusted ? "text-success" : "text-text-subtle"}`}
              >
                {certTrusted ? "verified_user" : "lock_open"}
              </span>
              {certTrusted
                ? t("certTrusted") || "Certificate trusted"
                : t("certNotTrusted") || "Certificate not trusted"}
            </div>

            {/* Investigating notice */}
            {isInvestigating && (
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="text-xs text-text-muted">
                  {t("investigatingNotice") ||
                    "This agent is under investigation. Hosts and API surface are still being confirmed. Setup will be available once the upstream API is documented."}
                </p>
              </div>
            )}

            {/* Model mappings */}
            {!isInvestigating && (
              <div>
                <p className="text-xs font-medium text-text-muted mb-2">
                  {t("modelMappingsLabel") || "Model mappings"}
                </p>
                <ModelMappingTable
                  agentId={target.id}
                  mappings={mappings}
                  onSave={onMappingsSave}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {!isInvestigating && (
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-control border border-transparent bg-contrast text-contrast-fg px-3 py-1.5 text-xs font-medium hover:bg-contrast-hover transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                  {t("setupWizard") || "Setup wizard"}
                </button>
              )}

              {!isInvestigating && (
                <button
                  type="button"
                  onClick={handleDnsToggle}
                  disabled={dnsLoading}
                  className={`inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    dnsEnabled
                      ? "border-error/30 bg-error/5 text-error hover:bg-error/10"
                      : "border-border-strong bg-surface text-text-main hover:bg-bg-subtle"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {dnsEnabled ? "stop" : "play_arrow"}
                  </span>
                  {dnsLoading
                    ? t("toggling") || "Toggling…"
                    : dnsEnabled
                      ? t("stopDns") || "Stop DNS"
                      : t("startDns") || "Start DNS"}
                </button>
              )}

              <a
                href={`/dashboard/tools/traffic-inspector?agent=${target.id}`}
                className="inline-flex items-center gap-1.5 rounded-control border border-border-strong bg-surface text-text-main px-3 py-1.5 text-xs font-medium hover:bg-bg-subtle transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">network_check</span>
                {t("viewTraffic") || "View traffic"}
              </a>
            </div>
          </div>
        )}
      </div>

      {wizardOpen && (
        <SetupWizard
          target={target}
          agentState={agentState}
          serverRunning={serverRunning}
          serverState={serverState}
          currentMappings={mappings}
          onClose={() => setWizardOpen(false)}
          onDnsToggle={onDnsToggle}
          onMappingsSave={onMappingsSave}
        />
      )}

      <RiskNoticeModal
        open={riskModalOpen}
        title={t("riskNoticeTitle")}
        body={t("riskNoticeBody")}
        dontShowAgainKey={RISK_STORAGE_KEY_PREFIX + target.id}
        onAccept={handleRiskAccept}
        onCancel={() => setRiskModalOpen(false)}
      />
    </>
  );
}
