"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "./actions";

export function ReadMarker({ includeForum = false }: { includeForum?: boolean }) {
  useEffect(() => {
    void markNotificationsRead(includeForum).catch(() => {});
  }, [includeForum]);

  return null;
}
