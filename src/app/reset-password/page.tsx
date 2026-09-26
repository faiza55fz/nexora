"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { Card, Button, Field, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        setReady(true);
      } else {
        setError(
          "This password reset link is invalid or has expired. Please request a new one.",
        );
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (event === "PASSWORD_RECOVERY" || session) {
          setReady(true);
          setError("");
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(e: FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setPassword("");
      setConfirmPassword("");

      setMessage(
        "Your password has been updated successfully. Redirecting you to login...",
      );

      setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] bg-bg px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
            N
          </div>

          <h1 className="mt-4 text-3xl font-bold">
            Create a new password
          </h1>

          <p className="mt-2 text-muted">
            Choose a new password for your Nexora account.
          </p>
        </div>

        <Card className="p-6 shadow-[var(--shadow)]">
          {!ready ? (
            <div className="text-center">
              {error ? (
                <>
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>

                  <Button
                    type="button"
                    className="mt-5 w-full"
                    size="lg"
                    onClick={() =>
                      router.replace("/login")
                    }
                  >
                    Back to login
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted">
                  Verifying your reset link...
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={updatePassword}
              className="space-y-4"
            >
              <Field label="New password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>

              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Updating..."
                  : "Update password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}