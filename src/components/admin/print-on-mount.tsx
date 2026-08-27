"use client";

import { useEffect } from "react";

/**
 * Opens the browser print dialog once the sticker SVGs have painted.
 * Headless runs (e2e) make window.print() a no-op, so this stays safe there.
 */
export function PrintOnMount() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
