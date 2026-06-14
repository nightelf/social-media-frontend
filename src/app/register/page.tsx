"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ApiError, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { registerSchema, type RegisterValues } from "@/lib/schemas";
import type { Challenge, VerifyResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField, PasswordField, SubmitButton } from "@/components/common/fields";
import { AuthCard } from "@/components/features/auth-card";
import { CodeEntry } from "@/components/features/code-entry";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [doneIds, setDoneIds] = React.useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", phone: "", password: "" },
  });

  const onRegister = async (values: RegisterValues) => {
    const body: Record<string, string> = { username: values.username, password: values.password };
    if (values.email) body.email = values.email;
    if (values.phone) body.phone = values.phone;
    try {
      const res = await apiPost<{ user_id: number; challenges: Challenge[] }>(
        "/auth/register",
        body,
        false,
      );
      setChallenges(res.challenges);
      setCurrentIdx(0);
    } catch (e) {
      if (e instanceof ApiError && e.fields) {
        Object.entries(e.fields).forEach(([k, msg]) =>
          form.setError(k as keyof RegisterValues, { message: msg }),
        );
      }
      toast.error(e instanceof ApiError ? e.message : "Sign-up failed");
    }
  };

  const onVerify = async (code: string, cid: number) => {
    setSubmitting(true);
    try {
      const res = await apiPost<VerifyResult>("/auth/verify", { challenge_id: cid, code }, false);
      if (res.status === "complete") {
        await setSession(res.access, res.refresh);
        toast.success("Account verified — welcome!");
        router.replace("/");
        return;
      }
      const remainingIds = new Set(res.remaining.map((r) => r.challenge_id));
      setDoneIds(new Set(challenges.map((c) => c.challenge_id).filter((id) => !remainingIds.has(id))));
      setCurrentIdx(challenges.findIndex((c) => remainingIds.has(c.challenge_id)));
      toast.success("Contact verified — one more to go.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  // verification checklist stage
  if (challenges.length > 0) {
    const current = challenges[currentIdx];
    return (
      <AuthCard
        title="Verify your contacts"
        description="Confirm every contact you signed up with to activate your account."
      >
        <ul className="mb-6 space-y-2">
          {challenges.map((c, i) => {
            const done = doneIds.has(c.challenge_id);
            const active = i === currentIdx && !done;
            return (
              <li
                key={c.challenge_id}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                  active && "border-primary",
                )}
              >
                <span>
                  {c.channel === "EMAIL" ? "Email" : "Phone"}{" "}
                  <span className="text-muted-foreground">{c.destination}</span>
                </span>
                {done ? (
                  <span className="flex items-center gap-1 text-success">
                    <Check className="h-4 w-4" /> Verified
                  </span>
                ) : active ? (
                  <span className="text-primary">In progress</span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </li>
            );
          })}
        </ul>

        {current ? (
          <CodeEntry
            key={current.challenge_id}
            challengeId={current.challenge_id}
            channel={current.channel}
            destination={current.destination}
            onSubmit={onVerify}
            submitting={submitting}
          />
        ) : (
          <div className="flex justify-center py-4 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" description="Sign up with an email, a phone, or both.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
          <TextField control={form.control} name="username" label="Username" autoComplete="username" />
          <TextField control={form.control} name="email" label="Email" placeholder="you@example.com (optional)" autoComplete="email" />
          <TextField control={form.control} name="phone" label="Phone" placeholder="+15555550123 (optional)" autoComplete="tel" />
          <PasswordField control={form.control} name="password" label="Password" autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">
            You&apos;ll verify each contact with a code before your account activates.
          </p>
          <SubmitButton className="w-full" loading={form.formState.isSubmitting}>Sign up</SubmitButton>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
