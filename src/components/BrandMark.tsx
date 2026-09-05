"use client";

import { useEffect, useState } from "react";
import { cn } from "@/src/lib/cn";
import { LEDGER_LOGO_URL } from "@/src/lib/brand";

/**
 * The Ledger mark, inlined and tinted with the active theme.
 *
 * Same approach as the portfolio's project logos: proxy the SVG through our own
 * origin, parse it, drop the canvas the artwork was drawn on, and repoint every
 * remaining colour at a CSS variable — so one asset works across all seven
 * palettes and both schemes instead of shipping fourteen PNGs.
 *
 * Where this differs from the portfolio: knockouts. This mark draws the hole in
 * the wallet clasp as a small circle filled with the *canvas* colour, and the
 * portfolio's rule ("any filled shape becomes the accent") would paint it gold
 * and collapse the clasp into a solid blob. The canvas fill is captured before
 * the background is removed, and shapes still using it become
 * `--brand-knockout` — which a container sets to whatever it is sitting on.
 */

const ACCENT = "var(--accent)";
const KNOCKOUT = "var(--brand-knockout, var(--bg))";

function isNone(value: string | null | undefined): boolean {
  return value === "none" || value === "transparent";
}

function normaliseColour(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || isNone(trimmed)) return null;
  return trimmed;
}

function fillOf(el: Element): string | null {
  return normaliseColour(
    el.getAttribute("fill") ?? el.getAttribute("style")?.match(/fill:\s*([^;]+)/i)?.[1],
  );
}

/** A full-bleed rect drawn straight onto the root — the artwork's backdrop. */
function isCanvasRect(el: Element, svg: Element): boolean {
  if (el.tagName.toLowerCase() !== "rect") return false;
  if (el.parentElement !== svg) return false;

  const w = Number.parseFloat(el.getAttribute("width") ?? "");
  const h = Number.parseFloat(el.getAttribute("height") ?? "");
  if (el.getAttribute("width") === "100%" || el.getAttribute("height") === "100%") return true;

  const viewBox = svg.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
  if (viewBox && viewBox.length >= 4) {
    const vbW = viewBox[2] ?? 0;
    const vbH = viewBox[3] ?? 0;
    if (w >= vbW * 0.9 && h >= vbH * 0.9) return true;
  }
  return false;
}

function themeSvgMarkup(raw: string): string | null {
  const doc = new DOMParser().parseFromString(raw.trim(), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== "svg") return null;
  if (doc.querySelector("parsererror")) return null;

  // Anything scriptable or externally-fetching is stripped: this markup is
  // going through dangerouslySetInnerHTML.
  svg.querySelectorAll("script,style,foreignObject,image,use").forEach((el) => el.remove());
  svg.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  });

  let canvasFill: string | null = null;
  svg.querySelectorAll("rect").forEach((rect) => {
    if (!isCanvasRect(rect, svg)) return;
    canvasFill ??= fillOf(rect);
    rect.remove();
  });

  const shapes = svg.querySelectorAll("g,path,circle,ellipse,polygon,polyline,rect,line");
  shapes.forEach((el) => {
    el.removeAttribute("class");
    el.removeAttribute("style");

    const fill = fillOf(el);
    const stroke = normaliseColour(el.getAttribute("stroke"));

    if (fill) {
      el.setAttribute("fill", fill === canvasFill ? KNOCKOUT : ACCENT);
    } else {
      // No usable fill of its own. Explicit "none" stays none; an unset fill on
      // a stroked shape must also become none, or SVG's default black fill
      // floods an outline-style icon.
      el.setAttribute("fill", "none");
    }

    if (stroke) el.setAttribute("stroke", ACCENT);
  });

  svg.setAttribute("class", "brand-mark-inline");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  return svg.outerHTML;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "NL").toUpperCase();
}

export interface BrandMarkProps {
  /** Alt-equivalent label. Also the source of the initials fallback. */
  name?: string;
  src?: string;
  className?: string;
}

export function BrandMark({
  name = "Noirly Ledger",
  src = LEDGER_LOGO_URL,
  className,
}: BrandMarkProps) {
  // One piece of state, written only from the async callbacks. Resetting a
  // separate `failed` flag synchronously at the top of the effect would set
  // state during the effect and cascade an extra render on every mount.
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/brand-logo?src=${encodeURIComponent(src)}`)
      .then((res) => {
        if (!res.ok) throw new Error("logo fetch failed");
        return res.text();
      })
      .then((text) => {
        if (!active) return;
        const themed = themeSvgMarkup(text);
        if (!themed) throw new Error("not themeable");
        setMarkup(themed);
      })
      .catch(() => {
        // Nothing to do: `markup` stays null and the initials mark below
        // remains, which is the same thing the pre-load frame renders.
      });

    return () => {
      active = false;
    };
  }, [src]);

  // The initials tile is a fine mark in its own right, so it covers both the
  // pre-load frame and a permanent failure. Nothing ever pops in from empty.
  if (!markup) {
    return (
      <span className={cn("brand-mark brand-mark--fallback h-9 w-9", className)} role="img" aria-label={name}>
        {initials(name)}
      </span>
    );
  }

  return (
    <span className={cn("brand-mark h-9 w-9", className)} role="img" aria-label={name}>
      <span className="brand-mark-inner" dangerouslySetInnerHTML={{ __html: markup }} />
    </span>
  );
}
