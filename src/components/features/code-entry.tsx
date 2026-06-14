"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { apiGet, apiPost } from "@/lib/api";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CodeEntry({
  challengeId,
  channel,
  destination,
  ttlMinutes = 10,
  onSubmit,
  submitting,
}: {
  challengeId: number;
  channel: string;
  destination: string;
  ttlMinutes?: number;
  onSubmit: (code: string, challengeId: number) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [cid, setCid] = React.useState(challengeId);
  const [code, setCode] = React.useState("");
  const [seconds, setSeconds] = React.useState(ttlMinutes * 60);
  const [resending, setResending] = React.useState(false);

  // countdown
  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // dev auto-fill (endpoint 404s outside dev — failures are ignored)
  const autofill = React.useCallback(async (id: number) => {
    try {
      const { code } = await apiGet<{ code: string }>(`/dev/last-code?challenge_id=${id}`, false);
      if (code) setCode(code);
    } catch {
      /* not in dev — ignore */
    }
  }, []);

  React.useEffect(() => {
    void autofill(cid);
  }, [cid, autofill]);

  const expired = seconds <= 0;

  const submit = () => {
    if (code.length === 6 && !submitting && !expired) onSubmit(code, cid);
  };

  const resend = async () => {
    setResending(true);
    setCode("");
    try {
      const ch = await apiPost<Challenge>("/auth/resend", { challenge_id: cid }, false);
      setCid(ch.challenge_id);
      setSeconds(ttlMinutes * 60);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent via {channel === "EMAIL" ? "email" : "text"} to{" "}
        <span className="font-medium text-foreground">{destination}</span>.
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => setCode(v)}
          onComplete={(v) => !submitting && !expired && onSubmit(v, cid)}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{expired ? "Code expired" : `Expires in ${fmt(seconds)}`}</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={resend} disabled={resending}>
          {resending ? "Sending…" : "Resend code"}
        </Button>
      </div>

      <Button className="w-full" onClick={submit} disabled={code.length !== 6 || submitting || expired}>
        {submitting && <Loader2 className="animate-spin" />}
        Verify
      </Button>
    </div>
  );
}
