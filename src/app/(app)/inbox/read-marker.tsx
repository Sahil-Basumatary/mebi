"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "./actions";

// Visiting the inbox is the read signal that clears the red nav dot.
export function ReadMarker() {
  useEffect(() => {
    void markNotificationsRead().catch(() => {});
  }, []);

  return null;
}
