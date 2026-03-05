"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ChevronRight,
  Lock,
  LogOut,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface AgentDef {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  webhook_url?: string;
}

const colorMap = {
  enabled: {
    circle: "bg-gradient-to-br from-orange-400 to-orange-600",
    badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  },
  disabled: {
    circle: "bg-white/8",
    badge: "bg-white/6 text-white/30 ring-white/10",
  },
};

export default function SetupHomePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/setup/agents")
      .then((r) => {
        if (r.status === 401) { router.replace("/setup/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setAgencyName(data.agencyName ?? "");
        setAgents(data.agents ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/setup/auth", { method: "DELETE" });
    router.replace("/setup/login");
  }

  const enabledCount = agents.filter((a) => a.enabled).length;

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo-laagencia.png"
              alt="LaAgencia"
              className="h-11 w-auto object-contain"
            />
            <div>
              <h1 className="text-[20px] font-bold text-white leading-tight">
                {agencyName || "Panel de agentes"}
              </h1>
              <p className="text-[13px] text-white/40">Algoritmos de IA</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 rounded-xl bg-white/6 px-3 py-2 text-[13px] font-medium text-white/40 transition-all hover:bg-white/10 hover:text-white/60 active:scale-[0.96]"
          >
            {loggingOut
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <LogOut className="h-3.5 w-3.5" />
            }
            Salir
          </button>
        </motion.div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.05 }}
          className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 px-4 py-3.5"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-white/30" />
              <span className="text-[14px] text-white/30">Cargando agentes…</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-white">Tus agentes de IA</p>
                  <p className="text-[13px] text-white/35 mt-0.5">
                    {enabledCount} de {agents.length} habilitados
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[13px] text-emerald-400 font-medium">Sistema activo</span>
                </div>
              </div>
              {agents.length > 0 && (
                <div className="mt-3 h-[3px] rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
                    style={{ width: `${(enabledCount / agents.length) * 100}%` }}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Agents list */}
        {!loading && (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-white/30 px-0.5 uppercase tracking-wider">
              Algoritmos disponibles
            </p>

            {agents.map((agent, i) => {
              const colors = agent.enabled ? colorMap.enabled : colorMap.disabled;
              return (
                <motion.div
                  key={agent.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.1 + i * 0.06 }}
                >
                  <div
                    className={`rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 overflow-hidden ${
                      !agent.enabled ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 px-4 py-4">
                      {/* Avatar */}
                      <div className="relative h-14 w-14 shrink-0">
                        <div className={`h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center ${agent.enabled ? "bg-white/8 ring-1 ring-white/10" : "bg-white/4"}`}>
                          <img
                            src={`/logo-${agent.slug}.png`}
                            alt={agent.name}
                            className={`h-full w-full object-contain p-1.5 transition-all ${!agent.enabled ? "grayscale opacity-30" : ""}`}
                          />
                        </div>
                        {!agent.enabled && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30">
                            <Lock className="h-5 w-5 text-white/40" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h2 className="text-[18px] font-bold text-white leading-tight">
                            {agent.name}
                          </h2>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${colors.badge}`}>
                            {agent.enabled ? "Habilitado" : "Desactivado"}
                          </span>
                        </div>
                        <p className="text-[13px] text-white/40">{agent.description}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="border-t border-white/6 px-4 py-3">
                      {agent.enabled ? (
                        <button
                          onClick={() => router.push(`/setup/${agent.slug}`)}
                          className="flex w-full items-center justify-between rounded-xl bg-orange-500/12 px-4 py-2.5 text-[15px] font-semibold text-orange-400 transition-all hover:bg-orange-500/20 active:scale-[0.98] ring-1 ring-orange-500/20"
                        >
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Configurar algoritmo
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-60" />
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 rounded-xl bg-white/4 px-4 py-2.5 ring-1 ring-white/8">
                          <Lock className="h-4 w-4 text-white/20" />
                          <span className="text-[14px] text-white/25 font-medium">
                            No disponible — contacta al equipo LISA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col items-center gap-2 pb-2 pt-2"
        >
          <img src="/lisa-isologo-naranja.png" alt="LISA" className="h-7 w-7 object-contain opacity-60" />
          <p className="text-center text-[12px] text-white/25">
            Para habilitar más agentes contacta al equipo de{" "}
            <span className="text-white/40 font-medium">LISA</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
