"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, Button, Field, Input } from "@/components/ui";
import { useStore, type AppUser } from "@/components/providers";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useStore();

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }

        if (!phone.trim()) {
          throw new Error("Please enter your phone number.");
        }

        if (!email.trim()) {
          throw new Error("Please enter your email.");
        }

        if (password.length < 6) {
          throw new Error(
            "Password must be at least 6 characters.",
          );
        }

        const { error: signupError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                name: name.trim(),
                phone: phone.trim(),
              },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          });

        if (signupError) {
          throw signupError;
        }

        setMessage(
          "Account created! Please check your email and click the verification link before logging in.",
        );

        setPassword("");
        return;
      }

      if (!email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (!password) {
        throw new Error("Please enter your password.");
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Unable to sign in.");
      }

      const { data: customer } = await supabase
        .from("customers")
        .select("name, email, phone")
        .eq("id", data.user.id)
        .maybeSingle();

      const nextUser: AppUser = {
        id: data.user.id,
        name:
          customer?.name ||
          data.user.user_metadata?.name ||
          "Nexora Customer",
        email:
          customer?.email ||
          data.user.email ||
          email.trim(),
        phone:
          customer?.phone ||
          data.user.user_metadata?.phone ||
          "",
        role: "customer",
      };

      login(nextUser);

      const next = params.get("next");
      router.replace(next || "/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
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
            {isSignup
              ? "Create your Nexora account"
              : "Welcome to Nexora"}
          </h1>

          <p className="mt-2 text-muted">
            {isSignup
              ? "Create an account to shop fresh groceries."
              : "Log in to shop fresh groceries at everyday low prices."}
          </p>
        </div>

        <Card className="p-6 shadow-[var(--shadow)]">
          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <>
                <Field label="Name">
                  <Input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    required
                  />
                </Field>

                <Field label="Phone number">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Your phone number"
                    required
                  />
                </Field>
              </>
            )}

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 6 characters"
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
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignup((value) => !value);
                setError("");
                setMessage("");
              }}
              className="font-semibold text-brand hover:underline"
            >
              {isSignup ? "Log in" : "Create one"}
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
            <span>🥬 Fresh groceries</span>
            <span>•</span>
            <span>🚚 1-day delivery</span>
            <span>•</span>
            <span>💵 COD</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] grid place-items-center">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}