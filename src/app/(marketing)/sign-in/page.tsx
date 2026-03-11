"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";

/* ── Animated background blobs ─────────────────────── */
function Blobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-orange-500/5 dark:bg-orange-500/8 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-400/5 dark:bg-orange-400/6 blur-3xl"
      />
    </div>
  );
}

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const { login, register } = useAuthStore();
  const isSignUp = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.push("/agents");
    } catch (err: any) {
      setFormError(err.message ?? "Error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Blobs />

      {/* ── Topbar ── */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </Link>
        <Link href="/" className="select-none">
          <img src="/lisa-logo-orange.png" alt="Lisa" className="h-12 dark:hidden" />
          <img src="/lisa-logo-white.png" alt="Lisa" className="h-12 hidden dark:block" />
        </Link>
        <ThemeToggle />
      </div>

      {/* ── Main card ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="w-full max-w-sm"
        >
          {/* Card */}
          <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/30 px-7 py-8">

            {/* Logo + heading */}
            <div className="flex flex-col items-center mb-7">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="relative mb-5"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <img src="/lisa-isologo-white.png" alt="Lisa" className="h-13 w-13" />
                </div>
                {/* Glow */}
                <div className="absolute inset-0 rounded-2xl bg-orange-500/20 blur-xl scale-150 pointer-events-none" />
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="text-center"
                >
                  <h1 className="text-xl font-bold text-foreground">
                    {isSignUp ? "Crea tu cuenta" : "Bienvenido de nuevo"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSignUp
                      ? "Empieza a automatizar tu negocio hoy"
                      : "Inicia sesion en tu cuenta"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="text"
                placeholder="Usuario o correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
              />

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-border bg-background px-3.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {formError && (
                <p className="text-xs text-red-500 text-center -mt-1">{formError}</p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="group relative h-10 w-full rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:shadow-[0_4px_18px_rgba(249,115,22,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Crear cuenta" : "Iniciar sesion"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              {isSignUp ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isSignUp ? "signin" : "signup")}
                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                {isSignUp ? "Inicia sesion" : "Registrate gratis"}
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-[11px] text-muted-foreground/70 mt-4 px-4">
            Al continuar, aceptas nuestros{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Terminos de uso
            </Link>{" "}
            y{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Politica de privacidad
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
