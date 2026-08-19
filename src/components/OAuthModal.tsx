"use client";

import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck, Loader2, Check, AlertTriangle } from "lucide-react";
import ConnectorLogo from "@/components/ConnectorLogo";
import type { Connector } from "@/config/connectors";
import {
  checkConnectorStatus,
  clearPendingConnector,
  setPendingConnector,
  startConnectorLogin,
} from "@/lib/connector-api";

type OAuthModalProps = {
  connector: Connector | null;
  onClose: () => void;
  onSuccess: (connector: Connector) => void;
  onFailed: (connector: Connector) => void;
};

const POLL_MS = 3000;
const MAX_WAIT_MS = 180000;
const POPUP_CLOSED_GRACE_TICKS = 5;

export default function OAuthModal({ connector, onClose, onSuccess, onFailed }: OAuthModalProps) {
  const [step, setStep] = useState<"confirm" | "authorizing" | "done">("confirm");
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);
  const connectorRef = useRef<Connector | null>(null);

  useEffect(() => {
    if (connector) {
      setStep("confirm");
      setStatusText("");
      setErrorMsg("");
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [connector]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      popupRef.current?.close();
      clearPendingConnector();
    };
  }, []);

  if (!connector) return null;

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    clearPendingConnector();
  };

  const handleAuthorize = async () => {
    if (!connector) return;
    connectorRef.current = connector;
    setStep("authorizing");
    setErrorMsg("");
    setStatusText(`Contacting ${connector.name}...`);

    const login = await startConnectorLogin(connector.id);
    if (!login.ok) {
      setStep("confirm");
      setErrorMsg(login.error);
      return;
    }

    setStatusText(`Waiting for ${connector.name} authorization...`);
    setPendingConnector(connector.id);

    const popup = window.open(
      login.authUrl,
      "vedaapex-connector-oauth",
      "width=600,height=680,left=200,top=120"
    );
    popupRef.current = popup;

    const startedAt = Date.now();
    let popupClosedTicks = 0;

    pollRef.current = setInterval(async () => {
      const active = connectorRef.current;
      if (!active || !pollRef.current) return;

      if (Date.now() - startedAt > MAX_WAIT_MS) {
        stopPolling();
        popupRef.current?.close();
        onFailed(active);
        return;
      }

      const connected = await checkConnectorStatus(active.id);
      if (connected) {
        stopPolling();
        popupRef.current?.close();
        setStep("done");
        setTimeout(() => onSuccess(active), 600);
        return;
      }

      if (popupRef.current?.closed) {
        popupClosedTicks += 1;
        if (popupClosedTicks >= POPUP_CLOSED_GRACE_TICKS) {
          stopPolling();
          onFailed(active);
        }
      } else {
        setStatusText(`Waiting for ${active.name} authorization...`);
      }
    }, POLL_MS);
  };

  const handleCancel = () => {
    if (step === "authorizing") return;
    onFailed(connector);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={step === "authorizing" ? undefined : handleCancel} />

      <div className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white dark:bg-[#1a1b18] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleCancel}
          disabled={step === "authorizing"}
          className="absolute right-4 top-4 rounded-md p-1 text-foreground/40 hover:text-foreground hover:bg-black/5 disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <ConnectorLogo connector={connector} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">Connect to {connector.name}</h3>
            <p className="text-xs text-foreground/50">{connector.url}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {step === "confirm" && (
            <>
              <div className="rounded-xl border border-black/5 bg-[#fafafa] dark:bg-black/10 p-3.5">
                <p className="text-[13px] leading-5 text-foreground/70">
                  <span className="font-semibold text-foreground">{connector.name}</span> wants to connect
                  to <span className="font-semibold text-foreground">VedaApex</span> so you can use its
                  services inside your workspace.
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/45">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  This is a secure connection. We never store your passwords.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <p className="text-xs leading-5 text-red-600 dark:text-red-400">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorize}
                  className="flex-1 rounded-lg bg-[#3b3b3b] dark:bg-white dark:text-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-85 transition-opacity"
                >
                  Authorize
                </button>
              </div>
            </>
          )}

          {step === "authorizing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-7 w-7 animate-spin text-foreground/60" />
              <p className="text-sm text-foreground/60">
                {statusText}
              </p>
              <p className="text-xs text-foreground/40">
                Complete the login in the new window, then wait here
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {connector.name} connected successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
