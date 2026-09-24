"use client";

// src/app/(dashboard)/dashboard/playground/components/MarkdownMessage.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

/**
 * MarkdownMessage — renders markdown safely in the Playground chat.
 *
 * Security notes:
 * - react-markdown does NOT render raw HTML by default, so <script> and other
 *   dangerous tags appear as literal text — no XSS possible via markdown content.
 * - Code blocks are rendered as <pre><code> (no syntax highlighter — react-syntax-highlighter
 *   is not installed; install it if needed in a future iteration).
 * - remark-gfm enables tables, strikethrough, task lists (GFM extensions).
 */
export default function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const components: Components = {
    // Code blocks and inline code — rendered as <pre><code> without syntax highlighting
    code({ className: codeClassName, children, ...props }) {
      // Extract language from className (e.g., "language-js" → "js")
      const match = /language-(\w+)/.exec(codeClassName ?? "");
      const language = match ? match[1] : undefined;
      const isBlock = codeClassName != null;

      if (isBlock) {
        return (
          <pre
            className="overflow-x-auto rounded-lg border border-border bg-bg-subtle p-3 font-mono text-[13px] text-text-main my-2"
            data-language={language}
          >
            <code className={codeClassName ?? ""} {...props}>
              {children}
            </code>
          </pre>
        );
      }

      // Inline code
      return (
        <code
          className="rounded-md bg-bg-subtle px-1 py-0.5 text-[13px] font-mono text-text-main"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Tables (GFM)
    table({ children }) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full border-collapse text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-bg-subtle">{children}</thead>;
    },
    th({ children }) {
      return (
        <th className="border border-border px-3 py-1.5 text-left text-xs font-medium text-text-muted">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="border border-border px-3 py-1.5">{children}</td>;
    },

    // Links — open in new tab with rel noopener for security
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:no-underline"
        >
          {children}
        </a>
      );
    },

    // Lists
    ul({ children }) {
      return <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },

    // Paragraphs
    p({ children }) {
      return <p className="my-1 leading-relaxed">{children}</p>;
    },

    // Headings
    h1({ children }) {
      return <h1 className="text-xl font-semibold tracking-tight my-2">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-lg font-semibold tracking-tight my-2">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-base font-semibold my-1.5">{children}</h3>;
    },
    h4({ children }) {
      return <h4 className="text-sm font-semibold my-1">{children}</h4>;
    },

    // Blockquotes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-2 border-border-strong pl-3 text-text-muted my-2">
          {children}
        </blockquote>
      );
    },

    // Horizontal rule
    hr() {
      return <hr className="my-3 border-border" />;
    },

    // Strong / emphasis
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
  };

  return (
    // break-words: long unspaced runs (raw JSON, ids, tokens) have no natural
    // wrap point, so without it they overflow their container instead of
    // wrapping — invisible in a wide full-page layout, glaring in a narrower
    // one (e.g. the conversation tree modal).
    <div className={`break-words ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
