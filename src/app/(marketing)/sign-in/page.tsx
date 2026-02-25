"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* ── Brand-quality provider icons ─────────────────── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        fill="#4285F4"
      />
      <path
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
        fill="#34A853"
      />
      <path
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

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
  const [loading, setLoading] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  const handleProvider = (provider: string) => {
    setLoading(provider);
    setTimeout(() => setLoading(null), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setTimeout(() => setLoading(null), 2000);
  };

  const providers = [
    {
      id: "google",
      label: "Continuar con Google",
      icon: <GoogleIcon size={18} />,
    },
    {
      id: "apple",
      label: "Continuar con Apple",
      icon: <AppleIcon size={18} />,
    },
    {
      id: "github",
      label: "Continuar con GitHub",
      icon: <GitHubIcon size={18} />,
    },
  ];

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
                      : "Inicia sesión en tu cuenta de Lisa"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Social providers */}
            <div className="flex flex-col gap-2.5 mb-5">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProvider(p.id)}
                  disabled={loading !== null}
                  className="relative flex h-10 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {p.icon}
                      <span>{p.label}</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                o con correo
              </span>
              <div className="flex-1 h-px bg-border" />
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
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
              />

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Contraseña"
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

              {/* Forgot password — only on signin */}
              <AnimatePresence>
                {!isSignUp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-end -mt-1"
                  >
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading !== null}
                whileTap={{ scale: 0.98 }}
                className="group relative h-10 w-full rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:shadow-[0_4px_18px_rgba(249,115,22,0.45)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {loading === "email" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isSignUp ? "signin" : "signup")}
                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                {isSignUp ? "Inicia sesión" : "Regístrate gratis"}
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-[11px] text-muted-foreground/70 mt-4 px-4">
            Al continuar, aceptas nuestros{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Términos de uso
            </Link>{" "}
            y{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Política de privacidad
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
