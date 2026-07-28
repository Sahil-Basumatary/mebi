"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import {
  Check,
  ChevronLeft,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
  Smartphone,
  SquareAsterisk,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useReverificationHandler } from "./reverification";

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type TOTPResource = Awaited<ReturnType<ClerkUser["createTOTP"]>>;
type PhoneResource = ClerkUser["phoneNumbers"][number];

type Step = "menu" | "totp" | "phone-add" | "phone-verify" | "backup" | "success" | "manage";

const blueButton =
  "flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#2783de] text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const outlineRowButton =
  "border-app-border text-app-fg hover:bg-app-hover flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errors" in error) {
    const list = (error as { errors?: { message?: string }[] }).errors;
    if (list?.[0]?.message) return list[0].message;
  }
  return "Something went wrong. Please try again.";
}

function CodeInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, index) => value[index] ?? "");

  function setChar(index: number, char: string) {
    const next = value.split("");
    next[index] = char;
    onChange(next.join("").slice(0, length));
  }

  return (
    <div className="flex justify-center gap-2">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={char}
          inputMode="numeric"
          maxLength={1}
          autoFocus={index === 0}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, "").slice(-1);
            setChar(index, digit);
            if (digit && index < length - 1) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !char && index > 0) refs.current[index - 1]?.focus();
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (pasted) {
              event.preventDefault();
              onChange(pasted);
              refs.current[Math.min(pasted.length, length - 1)]?.focus();
            }
          }}
          className="border-app-border bg-app-surface text-app-fg focus:border-[#2783de] h-12 w-11 rounded-md border text-center text-lg outline-none transition-colors"
        />
      ))}
    </div>
  );
}

function OptionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof Smartphone;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-app-border hover:bg-app-hover flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
    >
      <Icon size={18} strokeWidth={1.75} className="text-app-fg mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="text-app-fg block text-sm font-medium">{title}</span>
        <span className="text-app-muted block text-[13px] leading-[18px]">{subtitle}</span>
      </span>
    </button>
  );
}

export function TwoFactorControl() {
  const { user, isLoaded } = useUser();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [totp, setTotp] = useState<TOTPResource | null>(null);
  const [phone, setPhone] = useState<PhoneResource | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [successMethod, setSuccessMethod] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { onNeedsReverification } = useReverificationHandler();
  const createTOTP = useReverification(() => user!.createTOTP(), { onNeedsReverification });
  const verifyTOTP = useReverification((value: string) => user!.verifyTOTP({ code: value }), {
    onNeedsReverification,
  });
  const createPhone = useReverification(
    (value: string) => user!.createPhoneNumber({ phoneNumber: value }),
    { onNeedsReverification },
  );
  const reservePhone = useReverification(
    (resource: PhoneResource) => resource.setReservedForSecondFactor({ reserved: true }),
    { onNeedsReverification },
  );
  const unreservePhone = useReverification(
    (resource: PhoneResource) => resource.setReservedForSecondFactor({ reserved: false }),
    { onNeedsReverification },
  );
  const createBackup = useReverification(() => user!.createBackupCode(), { onNeedsReverification });
  const disableTOTP = useReverification(() => user!.disableTOTP(), { onNeedsReverification });

  const cancel = useCallback(() => {
    setBusy((current) => {
      if (current) return current;
      setOpen(false);
      setStep("menu");
      setTotp(null);
      setPhone(null);
      setPhoneNumber("");
      setCode("");
      setBackupCodes([]);
      setError(null);
      setMenuFor(null);
      return current;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        cancel();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, cancel]);

  if (!isLoaded || !user) {
    return (
      <button type="button" disabled className={outlineRowButton}>
        Add verification method
      </button>
    );
  }

  const twoFactorEnabled = user.twoFactorEnabled;

  function launch() {
    setError(null);
    setCode("");
    setStep(user!.twoFactorEnabled ? "manage" : "menu");
    setOpen(true);
  }

  // Backup codes are only surfaced the first time a second factor is added.
  async function afterFactorAdded(method: string) {
    setSuccessMethod(method);
    const firstFactor = !user!.twoFactorEnabled;
    await user!.reload();
    if (firstFactor) {
      const created = await createBackup();
      setBackupCodes(created.codes);
      setStep("backup");
    } else {
      setStep("success");
    }
    refresh();
  }

  async function startTOTP() {
    setBusy(true);
    setError(null);
    try {
      const created = await createTOTP();
      setTotp(created);
      setCode("");
      setStep("totp");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function confirmTOTP() {
    if (code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTOTP(code);
      await afterFactorAdded("authenticator app");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function startPhone() {
    if (!phoneNumber.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createPhone(phoneNumber.trim());
      await created.prepareVerification();
      setPhone(created);
      setCode("");
      setStep("phone-verify");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function confirmPhone() {
    if (!phone || code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      await phone.attemptVerification({ code });
      await reservePhone(phone);
      await afterFactorAdded("phone number");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function resendPhone() {
    if (!phone) return;
    setError(null);
    try {
      await phone.prepareVerification();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function regenerateBackup() {
    setBusy(true);
    setError(null);
    try {
      const created = await createBackup();
      setBackupCodes(created.codes);
      setStep("backup");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function deleteMethod(action: () => Promise<unknown>) {
    setMenuFor(null);
    setError(null);
    try {
      await action();
      await user!.reload();
      refresh();
      if (!user!.twoFactorEnabled) cancel();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function turnOff() {
    setError(null);
    try {
      if (user!.totpEnabled) await disableTOTP();
      for (const item of user!.phoneNumbers.filter((entry) => entry.reservedForSecondFactor)) {
        await unreservePhone(item);
      }
      await user!.reload();
      refresh();
      cancel();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  function downloadBackup() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mebi-backup-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const reservedPhones = user.phoneNumbers.filter((item) => item.reservedForSecondFactor);

  return (
    <>
      <button type="button" onClick={launch} className={outlineRowButton}>
        Add verification method
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-[#0f0f0f]/50 backdrop-blur-[2px]"
                onClick={cancel}
              />
              <ModalCard
                onClose={cancel}
                onBack={step === "phone-verify" ? () => setStep("phone-add") : undefined}
              >
                {step === "menu" ? (
                  <div className="flex flex-col items-center text-center">
                    <ShieldCheck size={28} strokeWidth={1.75} className="text-app-fg" />
                    <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                      Turn on 2-step verification
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      Confirm it&apos;s you when you use a password with a verification code
                    </p>
                    <div className="mt-5 w-full space-y-2">
                      <OptionRow
                        icon={SquareAsterisk}
                        title="Code from authenticator"
                        subtitle="Generate a one-time code in your authenticator app"
                        onClick={startTOTP}
                      />
                      <OptionRow
                        icon={Smartphone}
                        title="Text me a code"
                        subtitle="Add and verify your phone number"
                        onClick={() => setStep("phone-add")}
                      />
                    </div>
                  </div>
                ) : null}

                {step === "totp" ? (
                  <div className="flex flex-col items-center text-center">
                    <h2 className="text-app-fg text-[17px] leading-[22px] font-semibold">
                      Add authenticator
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      Scan the QR code with your authenticator app, then enter the code it generates.
                    </p>
                    {totp ? (
                      <div className="mt-4 rounded-lg bg-white p-3">
                        <QRCodeSVG value={totp.uri ?? ""} size={140} />
                      </div>
                    ) : null}
                    {totp?.secret ? (
                      <p className="text-app-muted mt-3 font-mono text-[12px] break-all">
                        {totp.secret}
                      </p>
                    ) : null}
                    <div className="mt-4 w-full">
                      <CodeInput value={code} onChange={setCode} />
                    </div>
                    {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}
                    <button
                      type="button"
                      onClick={confirmTOTP}
                      disabled={busy || code.length < 6}
                      className={`${blueButton} mt-4`}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                      Verify code
                    </button>
                  </div>
                ) : null}

                {step === "phone-add" ? (
                  <div className="flex flex-col items-center text-center">
                    <Smartphone size={28} strokeWidth={1.75} className="text-app-fg" />
                    <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                      Add phone number
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      We&apos;ll text a verification code to this number.
                    </p>
                    <input
                      type="tel"
                      autoComplete="tel"
                      autoFocus
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="+44 7700 900000"
                      className="border-app-border bg-app-surface text-app-fg placeholder:text-app-muted-2 focus:border-[#2783de] mt-4 h-9 w-full rounded-md border px-2.5 text-sm outline-none transition-colors"
                    />
                    {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}
                    <button
                      type="button"
                      onClick={startPhone}
                      disabled={busy || !phoneNumber.trim()}
                      className={`${blueButton} mt-4`}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                      Send code
                    </button>
                  </div>
                ) : null}

                {step === "phone-verify" ? (
                  <div className="flex flex-col items-center text-center">
                    <h2 className="text-app-fg text-[17px] leading-[22px] font-semibold">
                      Verify phone number
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      Enter the code sent to <span className="text-app-fg">{phone?.phoneNumber}</span>{" "}
                      to complete setup.{" "}
                      <button
                        type="button"
                        onClick={resendPhone}
                        className="text-[#2783de] hover:opacity-80"
                      >
                        Resend
                      </button>
                    </p>
                    <div className="mt-5 w-full">
                      <CodeInput value={code} onChange={setCode} />
                    </div>
                    {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}
                    <button
                      type="button"
                      onClick={confirmPhone}
                      disabled={busy || code.length < 6}
                      className={`${blueButton} mt-5`}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                      Verify code
                    </button>
                  </div>
                ) : null}

                {step === "backup" ? (
                  <div className="flex flex-col items-center text-center">
                    <ShieldCheck size={28} strokeWidth={1.75} className="text-app-fg" />
                    <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                      Save your backup codes
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      You can only see this once, so be sure to keep them to avoid getting locked out
                      of your account.
                    </p>
                    <div className="bg-app-surface mt-4 grid w-full grid-cols-2 gap-x-8 gap-y-2 rounded-lg p-4 font-mono text-[13px] text-[#c98a3a]">
                      {backupCodes.map((backupCode) => (
                        <span key={backupCode}>{backupCode}</span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("success")}
                      className={`${blueButton} mt-4`}
                    >
                      I&apos;ve saved them
                    </button>
                    <button
                      type="button"
                      onClick={downloadBackup}
                      className="border-app-border text-app-fg hover:bg-app-hover mt-2 flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors"
                    >
                      Download as text file
                    </button>
                  </div>
                ) : null}

                {step === "success" ? (
                  <div className="flex flex-col items-center text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#37a169]/15 text-[#37a169]">
                      <Check size={20} strokeWidth={2.5} />
                    </span>
                    <h2 className="text-app-fg mt-3 text-[17px] leading-[22px] font-semibold">
                      2-step verification with {successMethod} is turned on
                    </h2>
                    <p className="text-app-muted mt-2 text-[14px] leading-5">
                      Every time you enter your password, mebi will ask you for a verification code
                      to confirm your identity.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep("manage")}
                      className="border-app-border text-app-fg hover:bg-app-hover mt-5 flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors"
                    >
                      View 2-step methods
                    </button>
                  </div>
                ) : null}

                {step === "manage" ? (
                  <div>
                    <div className="flex flex-col items-center text-center">
                      <ShieldCheck size={28} strokeWidth={1.75} className="text-app-fg" />
                      <h2 className="text-app-fg mt-2 text-[17px] leading-[22px] font-semibold">
                        2-step verification
                      </h2>
                      <p className="text-app-muted mt-2 text-[14px] leading-5">
                        Confirm it&apos;s you after using a password by providing a verification code.
                      </p>
                    </div>

                    {twoFactorEnabled ? (
                      <>
                        <p className="text-app-muted-2 mt-5 text-xs font-medium">Active</p>
                        <div className="mt-2 space-y-1">
                          {user.totpEnabled ? (
                            <MethodRow
                              icon={SquareAsterisk}
                              label="Authenticator app"
                              menuOpen={menuFor === "totp"}
                              onMenu={() => setMenuFor(menuFor === "totp" ? null : "totp")}
                              onDelete={() => deleteMethod(() => disableTOTP())}
                            />
                          ) : null}
                          {reservedPhones.map((item) => (
                            <MethodRow
                              key={item.id}
                              icon={Smartphone}
                              label={item.phoneNumber}
                              menuOpen={menuFor === item.id}
                              onMenu={() => setMenuFor(menuFor === item.id ? null : item.id)}
                              onDelete={() => deleteMethod(() => unreservePhone(item))}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}

                    <p className="text-app-muted-2 mt-5 text-xs font-medium">Add more methods</p>
                    <div className="mt-2 space-y-2">
                      {!user.totpEnabled ? (
                        <OptionRow
                          icon={SquareAsterisk}
                          title="Add authenticator"
                          subtitle="Generate a one-time code in your authenticator app"
                          onClick={startTOTP}
                        />
                      ) : null}
                      <OptionRow
                        icon={Smartphone}
                        title="Add phone number"
                        subtitle="Add and verify your phone number"
                        onClick={() => setStep("phone-add")}
                      />
                      <OptionRow
                        icon={ShieldCheck}
                        title="Regenerate backup codes"
                        subtitle="Use for account recovery when other methods don't work"
                        onClick={regenerateBackup}
                      />
                    </div>

                    {error ? <p className="mt-3 text-[13px] text-[#e56458]">{error}</p> : null}

                    {twoFactorEnabled ? (
                      <button
                        type="button"
                        onClick={turnOff}
                        className="mt-5 flex h-9 w-full items-center justify-center rounded-md text-sm font-medium text-[#e56458] transition-colors hover:bg-[#e56458]/10"
                      >
                        Turn off 2-step verification
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </ModalCard>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ModalCard({
  children,
  onClose,
  onBack,
}: {
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Two-step verification"
      className="border-app-border bg-app-canvas relative z-10 w-[400px] max-w-[92vw] rounded-xl border p-6 shadow-[0_24px_48px_rgba(25,25,25,0.24),0_4px_12px_rgba(25,25,25,0.14)]"
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="text-app-muted hover:bg-app-hover hover:text-app-fg absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="text-app-muted hover:bg-app-hover hover:text-app-fg absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
      {children}
    </div>
  );
}

function MethodRow({
  icon: Icon,
  label,
  menuOpen,
  onMenu,
  onDelete,
}: {
  icon: typeof Smartphone;
  label: string;
  menuOpen: boolean;
  onMenu: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-app-border flex items-center justify-between gap-3 rounded-lg border p-3">
      <span className="flex min-w-0 items-center gap-3">
        <Icon size={18} strokeWidth={1.75} className="text-app-fg shrink-0" />
        <span className="text-app-fg truncate text-sm font-medium">{label}</span>
      </span>
      <span className="relative">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Method options"
          className="text-app-muted hover:bg-app-hover hover:text-app-fg flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        >
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </button>
        {menuOpen ? (
          <>
            <div className="fixed inset-0 z-10" onClick={onMenu} />
            <div className="border-app-border bg-app-canvas absolute top-8 right-0 z-20 w-32 rounded-lg border p-1 shadow-[0_3px_6px_rgba(0,0,0,0.08),0_9px_24px_rgba(0,0,0,0.14)]">
              <button
                type="button"
                onClick={onDelete}
                className="hover:bg-app-hover flex h-7 w-full items-center rounded-md px-2 text-sm text-[#e56458] transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        ) : null}
      </span>
    </div>
  );
}
