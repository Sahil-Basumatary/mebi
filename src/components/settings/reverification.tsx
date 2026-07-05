"use client";

import { useSession, useUser } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ReverificationRequest = {
  complete: () => void;
  cancel: () => void;
  level: string | undefined;
};

type ReverificationContextValue = {
  onNeedsReverification: (request: ReverificationRequest) => void;
};

const ReverificationContext = createContext<ReverificationContextValue | null>(null);

export function useReverificationHandler(): ReverificationContextValue {
  const value = useContext(ReverificationContext);
  if (!value) {
    throw new Error("useReverificationHandler must be used within a ReverificationProvider");
  }
  return value;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const list = (error as { errors?: { message?: string }[] }).errors;
    if (list?.[0]?.message) return list[0].message;
  }
  return "That password doesn't look right. Try again.";
}

export function ReverificationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ReverificationRequest | null>(null);

  const onNeedsReverification = useCallback((next: ReverificationRequest) => {
    setRequest(next);
  }, []);

  const value = useMemo(() => ({ onNeedsReverification }), [onNeedsReverification]);

  return (
    <ReverificationContext.Provider value={value}>
      {children}
      {request ? (
        <ReverificationModal request={request} onDone={() => setRequest(null)} />
      ) : null}
    </ReverificationContext.Provider>
  );
}

function ReverificationModal({
  request,
  onDone,
}: {
  request: ReverificationRequest;
  onDone: () => void;
}) {
  const { session } = useSession();
  const { user } = useUser();
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = useCallback(() => {
    if (busy) return;
    request.cancel();
    onDone();
  }, [busy, request, onDone]);

  // Capture Escape before the settings modal behind this one can react to it.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        dismiss();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [dismiss]);

  async function submit() {
    if (!password || !session || busy) return;
    setBusy(true);
    setError(null);
    try {
      await session.startVerification({
        level: (request.level ?? "first_factor") as "first_factor",
      });
      await session.attemptFirstFactorVerification({ strategy: "password", password });
      request.complete();
      onDone();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  if (typeof document === "undefined") return null;

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f0f0f]/50 backdrop-blur-[2px]" onClick={dismiss} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Verify your identity"
        className="border-app-border bg-app-canvas relative z-10 w-[400px] max-w-[92vw] rounded-xl border p-6 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14)]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="text-app-muted hover:bg-app-hover hover:text-app-fg absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="bg-app-surface flex h-14 w-14 items-center justify-center overflow-hidden rounded-full">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <h2 className="text-app-fg mt-3 text-[17px] leading-[22px] font-semibold">
            Verify it&apos;s you
          </h2>
          <p className="text-app-muted mt-2 text-[14px] leading-5">
            Enter your password to continue{email ? ` as ${email}` : ""}.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-app-muted block text-[12px] leading-4">Password</label>
          <div className="relative mt-1">
            <input
              type={reveal ? "text" : "password"}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Enter your password"
              className="bg-app-surface text-app-fg placeholder:text-app-muted-2 h-8 w-full rounded-md border border-transparent px-2.5 pr-8 text-sm outline-none transition-colors focus:border-[#2783de]"
            />
            <button
              type="button"
              onClick={() => setReveal((current) => !current)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="text-app-muted hover:text-app-fg absolute top-1/2 right-2 flex -translate-y-1/2 items-center"
            >
              {reveal ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={!password || busy}
          className="mt-5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#2783de] text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          Continue
        </button>
      </div>
    </div>,
    document.body,
  );
}
