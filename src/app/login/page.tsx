"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loginSchema, passwordlessSchema, type LoginValues, type PasswordlessValues } from "@/lib/schemas";
import type { AuthComplete, Challenge, Channel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, PasswordField, SubmitButton } from "@/components/common/fields";
import { AuthCard } from "@/components/features/auth-card";
import { CodeEntry } from "@/components/features/code-entry";

type Mode = "password" | "passwordless";
type Stage = "credentials" | "channel" | "code";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [mode, setMode] = React.useState<Mode>("password");
  const [stage, setStage] = React.useState<Stage>("credentials");
  const [userId, setUserId] = React.useState<number | null>(null);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [challenge, setChallenge] = React.useState<Challenge | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const purpose = mode === "password" ? "LOGIN_2FA" : "LOGIN_PASSWORDLESS";

  const pwForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });
  const plForm = useForm<PasswordlessValues>({
    resolver: zodResolver(passwordlessSchema),
    defaultValues: { identifier: "" },
  });

  const startChallenge = async (uid: number, channel: Channel) => {
    const ch = await apiPost<Challenge>(
      "/auth/challenge",
      { user_id: uid, channel, purpose },
      false,
    );
    setChallenge(ch);
    setStage("code");
  };

  const afterIdentify = async (uid: number, chans: Channel[]) => {
    setUserId(uid);
    setChannels(chans);
    if (chans.length === 1) {
      await startChallenge(uid, chans[0]);
    } else {
      setStage("channel");
    }
  };

  const onPassword = async (values: LoginValues) => {
    try {
      const res = await apiPost<{ user_id: number; channels: { channel: Channel }[] }>(
        "/auth/login",
        values,
        false,
      );
      await afterIdentify(res.user_id, res.channels.map((c) => c.channel));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Login failed";
      toast.error(msg);
    }
  };

  const onPasswordless = async (values: PasswordlessValues) => {
    try {
      const res = await apiPost<{ user_id: number; channels: { channel: Channel }[] }>(
        "/auth/login/code",
        values,
        false,
      );
      await afterIdentify(res.user_id, res.channels.map((c) => c.channel));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not send a code";
      toast.error(msg);
    }
  };

  const onVerify = async (code: string, challengeId: number) => {
    setSubmitting(true);
    try {
      const res = await apiPost<AuthComplete>("/auth/verify", { challenge_id: challengeId, code }, false);
      await setSession(res.access, res.refresh);
      toast.success("Welcome back!");
      router.replace("/");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Verification failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- render per stage ----
  if (stage === "code" && challenge) {
    return (
      <AuthCard title="Enter your code" description="Two-factor verification keeps your account secure.">
        <CodeEntry
          challengeId={challenge.challenge_id}
          channel={challenge.channel}
          destination={challenge.destination}
          onSubmit={onVerify}
          submitting={submitting}
        />
        <Button variant="link" className="mt-4 w-full" onClick={() => { setStage("credentials"); setChallenge(null); }}>
          Start over
        </Button>
      </AuthCard>
    );
  }

  if (stage === "channel" && userId) {
    return (
      <AuthCard title="Where should we send your code?">
        <div className="space-y-2">
          {channels.map((c) => (
            <Button key={c} variant="outline" className="w-full justify-start" onClick={() => startChallenge(userId, c)}>
              {c === "EMAIL" ? "Email me a code" : "Text me a code"}
            </Button>
          ))}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Log in" description="Welcome back to Sigmagram.">
      {mode === "password" ? (
        <Form {...pwForm}>
          <form onSubmit={pwForm.handleSubmit(onPassword)} className="space-y-4">
            <TextField control={pwForm.control} name="identifier" label="Username, email, or phone" autoComplete="username" />
            <PasswordField control={pwForm.control} name="password" label="Password" autoComplete="current-password" />
            <SubmitButton className="w-full" loading={pwForm.formState.isSubmitting}>Continue</SubmitButton>
          </form>
        </Form>
      ) : (
        <Form {...plForm}>
          <form onSubmit={plForm.handleSubmit(onPasswordless)} className="space-y-4">
            <TextField
              control={plForm.control}
              name="identifier"
              label="Verified email or phone"
              description="We'll send a one-time login code."
            />
            <SubmitButton className="w-full" loading={plForm.formState.isSubmitting}>Send me a code</SubmitButton>
          </form>
        </Form>
      )}

      <div className="mt-4 text-center text-sm">
        <Button
          variant="link"
          className="h-auto p-0"
          onClick={() => setMode(mode === "password" ? "passwordless" : "password")}
        >
          {mode === "password" ? "Log in with a code instead" : "Use your password instead"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
