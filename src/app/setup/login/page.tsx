"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Lock, Loader2, Eye, EyeOff, User } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/setup";

  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !passcode.trim() || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/setup/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), passcode: passcode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Error de autenticación");
      }
      router.replace(from);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Credenciales incorrectas");
      setStatus("error");
      setPasscode("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-between px-4 py-10 md:py-16">

      {/* Top — logos */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="flex items-center gap-4"
      >
        <img src="/lisa-isologo-naranja.png" alt="LISA" className="h-8 md:h-10 object-contain" />
        <div className="w-px h-5 bg-white/15" />
        <img src="/logo-laagencia.png" alt="LaAgencia" className="h-6 md:h-7 object-contain opacity-80" />
      </motion.div>

      {/* Center */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30, delay: 0.06 }}
        className="w-full max-w-sm space-y-5"
      >
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              {/* Logo principal: LISA naranja script */}
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-xl flex items-center justify-center p-3">
                <img src="/lisa-logo-naranaj.png" alt="LISA" className="h-full w-full object-contain" />
              </div>
              {/* Badge secundario: LaAgencia */}
              <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-[#1a1a1a] ring-1 ring-white/15 flex items-center justify-center p-1.5 shadow-lg">
                <img src="/logo-laagencia.png" alt="LaAgencia" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-[22px] md:text-[26px] font-bold text-white leading-tight">
              Bienvenido
            </h1>
            <p className="text-[14px] text-white/40 mt-1">
              Ingresa tus credenciales para configurar tus agentes de IA
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/10 overflow-hidden">
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div className="space-y-3">
              {/* Usuario */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if (status === "error") setStatus("idle"); }}
                    placeholder="tu usuario"
                    autoFocus
                    autoComplete="username"
                    className={`w-full rounded-xl bg-white/6 pl-10 py-3.5 text-[16px] text-white placeholder-white/20 outline-none ring-1 transition-all ${
                      status === "error" ? "ring-red-500/40 bg-red-500/5" : "ring-white/10 focus:ring-orange-500/50"
                    }`}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => { setPasscode(e.target.value); if (status === "error") setStatus("idle"); }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full rounded-xl bg-white/6 pl-10 pr-10 py-3.5 text-[16px] text-white placeholder-white/20 outline-none ring-1 transition-all ${
                      status === "error" ? "ring-red-500/40 bg-red-500/5" : "ring-white/10 focus:ring-orange-500/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                    tabIndex={-1}
                  >
                    {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[13px] text-red-400 pt-0.5"
                >
                  {errorMsg}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={!username.trim() || !passcode.trim() || status === "loading"}
              className={`w-full rounded-xl py-3.5 text-[16px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                username.trim() && passcode.trim() && status !== "loading"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25 active:scale-[0.98]"
                  : "bg-white/6 text-white/20 cursor-not-allowed shadow-none"
              }`}
            >
              {status === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Verificando…</>
              ) : "Acceder"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Bottom — branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-3 opacity-30">
          <img src="/lisa-isologo-naranja.png" alt="LISA" className="h-4 object-contain" />
          <span className="text-white/30 text-[10px]">·</span>
          <img src="/logo-laagencia.png" alt="LaAgencia" className="h-4 object-contain" />
        </div>
        <p className="text-[11px] text-white/20 text-center">
          Acceso exclusivo para clientes · Powered by AIC Studio
        </p>
      </motion.div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
