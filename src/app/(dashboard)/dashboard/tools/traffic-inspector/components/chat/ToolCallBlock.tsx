"use client";

import { useState } from "react";
import { JsonViewer } from "../shared/JsonViewer";
import { shortCallId } from "@/shared/utils/formatting";

interface ToolCallBlockProps {
  id: string;
  name: string;
  input: unknown;
}

export function ToolCallBlock({ id, name, input }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 text-left focus-ring rounded"
      >
        <span className="material-symbols-outlined text-[14px] text-warning" aria-hidden="true">
          {expanded ? "expand_less" : "expand_more"}
        </span>
        <span className="text-text-main font-mono font-medium">{name}</span>
        <span className="text-text-muted text-xs font-mono ml-auto" title={id}>
          {shortCallId(id)}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 border-t border-warning/20 pt-2">
          <JsonViewer data={input} />
        </div>
      )}
    </div>
  );
}
