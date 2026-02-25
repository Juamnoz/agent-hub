"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Globe,
  Hotel,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  Store,
  Star,
  Building2,
  Crown,
  Bot,
  Sparkles,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Send,
  PhoneCall,
  BrainCircuit,
  GraduationCap,
  Mic,
  FileImage,
  CreditCard,
  Database,
  Calculator,
} from "lucide-react";
import { IconWhatsApp } from "@/components/icons/brand-icons";
import { useLocaleStore } from "@/stores/locale-store";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* ─────────────────────────────────────────────
   Animated counter
───────────────────────────────────────────── */
function CountUp({
  end,
  suffix = "",
  duration = 1800,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString("es-CO")}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Scroll-triggered fade-up wrapper
───────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 280, damping: 28, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Animated WhatsApp chat mockup
───────────────────────────────────────────── */
const CHAT_MESSAGES = [
  {
    type: "user",
    text: "Hola! 👋 ¿Tienen disponibilidad para este fin de semana?",
    time: "9:40",
  },
  {
    type: "lisa",
    text: "¡Hola! Soy Lisa, asistente del Hotel Vista ✨\nTenemos disponibilidad. ¿Para cuántas personas?",
    time: "9:40",
  },
  {
    type: "user",
    text: "Para 2 adultos, una noche el sábado.",
    time: "9:41",
  },
  {
    type: "lisa",
    text: "Perfecto! 🌅 Tenemos:\n• Doble Estándar — $320.000/noche\n• Suite Junior — $540.000/noche\nAmbas incluyen desayuno. ¿Cuál prefieres?",
    time: "9:41",
  },
];

function ChatMockup() {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;

    const show = (idx: number) => {
      if (cancelled || idx >= CHAT_MESSAGES.length) return;
      const isLisa = CHAT_MESSAGES[idx].type === "lisa";
      if (isLisa) {
        setTyping(true);
        setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setVisible(idx + 1);
          setTimeout(() => show(idx + 1), 1600);
        }, 1100);
      } else {
        setVisible(idx + 1);
        setTimeout(() => show(idx + 1), 900);
      }
    };

    const t = setTimeout(() => show(0), 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [inView]);

  return (
    <div ref={ref} className="relative w-full max-w-[300px] mx-auto select-none">
      {/* Phone shell */}
      <div className="relative rounded-[2.25rem] overflow-hidden border-[6px] border-gray-800 dark:border-gray-700 shadow-2xl bg-gray-900">
        {/* Status bar */}
        <div className="bg-gray-900 px-5 pt-2 pb-1 flex items-center justify-between">
          <span className="text-white text-[11px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/70" />
            <div className="w-4 h-1.5 rounded-sm bg-white/70" />
            <div className="w-3 h-2.5 rounded-sm border border-white/70 relative">
              <div className="absolute inset-[2px] bg-white/70 rounded-[2px]" />
            </div>
          </div>
        </div>

        {/* WhatsApp top bar */}
        <div className="bg-[#1FAD5B] px-3 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold leading-tight truncate">
              Lisa — Hotel Vista
            </p>
            <p className="text-green-100 text-[10px]">en línea</p>
          </div>
          <PhoneCall className="w-4 h-4 text-white/70 flex-shrink-0" />
        </div>

        {/* Messages */}
        <div className="chat-messages-bg min-h-[280px] p-2.5 flex flex-col gap-2 relative overflow-hidden">
          {/* Subtle tiled pattern */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[Bot, MessageCircle, Sparkles].flatMap((Icon, gi) =>
              [...Array(4)].map((_, i) => (
                <Icon
                  key={`${gi}-${i}`}
                  className="absolute text-gray-400/[0.06]"
                  style={{
                    width: 20,
                    height: 20,
                    top: `${8 + ((gi * 33 + i * 24) % 82)}%`,
                    left: `${6 + ((gi * 29 + i * 21) % 82)}%`,
                    transform: `rotate(${gi * 20 + i * 12}deg)`,
                  }}
                />
              ))
            )}
          </div>

          {CHAT_MESSAGES.slice(0, visible).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.82, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-xl px-2.5 py-1.5 text-[10.5px] leading-relaxed shadow-sm ${
                  msg.type === "user"
                    ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-800 dark:text-gray-100 rounded-tr-[4px]"
                    : "bg-white dark:bg-[#1F2C33] text-gray-800 dark:text-gray-100 rounded-tl-[4px]"
                }`}
              >
                {msg.type === "lisa" && (
                  <p className="text-[9px] font-semibold text-orange-500 mb-0.5">Lisa</p>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
                <p className="text-[8.5px] text-gray-400 text-right mt-0.5 leading-none">
                  {msg.time}
                  {msg.type === "user" && (
                    <span className="text-blue-400 ml-0.5">✓✓</span>
                  )}
                </p>
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.82 }}
                className="flex justify-start"
              >
                <div className="bg-white dark:bg-[#1F2C33] rounded-xl rounded-tl-[4px] px-3 py-2 shadow-sm flex items-center gap-1">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${j * 0.14}s` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="bg-[#F0F2F5] dark:bg-[#1A2028] px-2.5 py-2 flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-3 py-1.5 text-[10px] text-gray-400">
            Escribe un mensaje…
          </div>
          <div className="w-7 h-7 rounded-full bg-[#1FAD5B] flex items-center justify-center flex-shrink-0">
            <Send className="w-3 h-3 text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Floating badge — IA activa */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3 -right-4 bg-orange-500 text-white text-[9.5px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 z-10"
      >
        <span className="relative flex h-2 w-2">
          <span className="ping-orange absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        IA activa
      </motion.div>

      {/* Floating stat — response time */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="absolute -bottom-4 -left-6 bg-card border border-border rounded-2xl px-3 py-2 shadow-xl z-10"
      >
        <p className="text-[9px] text-muted-foreground leading-none mb-0.5">Respuesta en</p>
        <p className="text-xl font-bold text-emerald-500 leading-none">&lt; 1 min</p>
      </motion.div>

      {/* Floating stat — messages */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-12 -left-8 bg-card border border-border rounded-2xl px-3 py-2 shadow-xl z-10"
      >
        <p className="text-[9px] text-muted-foreground leading-none mb-0.5">Mensajes hoy</p>
        <p className="text-xl font-bold text-orange-500 leading-none">2.4k</p>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Agent capabilities flow diagram
───────────────────────────────────────────── */
const FLOW_INPUTS = [
  {
    label: "Texto",
    Icon: MessageSquare,
    color: "#3b82f6",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Audio",
    Icon: Mic,
    color: "#8b5cf6",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    label: "Imágenes",
    Icon: FileImage,
    color: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
  },
];

const FLOW_OUTPUTS = [
  {
    label: "Links de pago",
    Icon: CreditCard,
    color: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Bases de datos",
    Icon: Database,
    color: "#06b6d4",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-800",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  {
    label: "Shopify",
    Icon: ShoppingBag,
    color: "#22c55e",
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-600 dark:text-green-400",
  },
  {
    label: "WordPress",
    Icon: Globe,
    color: "#3b82f6",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Contabilidad",
    Icon: Calculator,
    color: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-600 dark:text-amber-400",
  },
];

type FlowPath = { d: string; color: string; id: string; dur: number };

function AgentFlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [svgData, setSvgData] = useState<{
    w: number;
    h: number;
    paths: FlowPath[];
  } | null>(null);
  const inView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (!inView) return;
    const DURS = [2.4, 3.2, 2.8, 3.6, 2.6, 3.0, 2.2, 3.4];
    const compute = () => {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;
      const cRect = container.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const cx = centerRect.left - cRect.left;
      const cy = centerRect.top - cRect.top;
      const cw = centerRect.width;
      const ch = centerRect.height;
      const cMidY = cy + ch / 2;
      const paths: FlowPath[] = [];

      inputRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x1 = r.right - cRect.left;
        const y1 = r.top - cRect.top + r.height / 2;
        const x4 = cx;
        const y4 = cMidY;
        const ctrl = (x4 - x1) * 0.5;
        const d = `M ${x1} ${y1} C ${x1 + ctrl} ${y1} ${x4 - ctrl} ${y4} ${x4} ${y4}`;
        paths.push({ d, color: FLOW_INPUTS[i].color, id: `in-${i}`, dur: DURS[i] });
      });

      outputRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x1 = cx + cw;
        const y1 = cMidY;
        const x4 = r.left - cRect.left;
        const y4 = r.top - cRect.top + r.height / 2;
        const ctrl = (x4 - x1) * 0.5;
        const d = `M ${x1} ${y1} C ${x1 + ctrl} ${y1} ${x4 - ctrl} ${y4} ${x4} ${y4}`;
        paths.push({ d, color: FLOW_OUTPUTS[i].color, id: `out-${i}`, dur: DURS[i + 3] });
      });

      setSvgData({ w: cRect.width, h: cRect.height, paths });
    };
    /* Wait for FadeUp spring to settle before measuring */
    const t = setTimeout(compute, 600);
    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", compute);
    };
  }, [inView]);

  return (
    <>
      {/* ── Desktop: n8n-style flow diagram ── */}
      <div ref={containerRef} className="relative hidden md:block">
        {svgData && (
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            width={svgData.w}
            height={svgData.h}
            style={{ overflow: "visible" }}
          >
            {svgData.paths.map(({ d, color, id, dur }) => (
              <g key={id}>
                {/* Glow trace */}
                <path
                  d={d}
                  stroke={color}
                  strokeWidth="3"
                  fill="none"
                  strokeOpacity="0.12"
                />
                {/* Main line */}
                <path
                  d={d}
                  stroke={color}
                  strokeWidth="1.5"
                  fill="none"
                  strokeOpacity="0.45"
                  strokeDasharray="4 3"
                />
                {/* Traveling dot */}
                <circle r="3.5" fill={color} fillOpacity="0.95">
                  <animateMotion
                    dur={`${dur}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              </g>
            ))}
          </svg>
        )}

        <div className="relative z-10 flex items-center justify-between py-6">
          {/* Inputs column */}
          <div className="flex flex-col gap-4 w-[22%]">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1 text-center">
              Entiende
            </p>
            {FLOW_INPUTS.map((node, i) => (
              <div
                key={node.label}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${node.bg} ${node.border} shadow-sm`}
              >
                <node.Icon className={`h-5 w-5 flex-shrink-0 ${node.text}`} />
                <span className="text-sm font-medium">{node.label}</span>
              </div>
            ))}
          </div>

          {/* Left spacer */}
          <div className="flex-1" />

          {/* Lisa center node */}
          <div
            ref={centerRef}
            className="relative flex flex-col items-center gap-3 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-8 py-7 shadow-2xl shadow-black/20 flex-shrink-0"
          >
            {/* Orange ripple waves */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-2xl border-2 border-orange-500/70"
                animate={{ scale: [1, 1.28], opacity: [0.3, 0] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.6, 1],
                  delay: i * 1.2,
                }}
              />
            ))}
            <motion.img
              src="/lisa-isologo-orange.png"
              alt="Lisa"
              className="h-20 w-20 drop-shadow-lg relative z-10"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="text-center relative z-10">
              <p className="text-foreground font-bold text-xl leading-none">Lisa</p>
              <p className="text-muted-foreground text-xs mt-0.5">IA Agent</p>
            </div>
          </div>

          {/* Right spacer */}
          <div className="flex-1" />

          {/* Outputs column */}
          <div className="flex flex-col gap-3 w-[25%]">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1 text-center">
              Ejecuta
            </p>
            {FLOW_OUTPUTS.map((node, i) => (
              <div
                key={node.label}
                ref={(el) => {
                  outputRefs.current[i] = el;
                }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${node.bg} ${node.border} shadow-sm`}
              >
                <node.Icon className={`h-5 w-5 flex-shrink-0 ${node.text}`} />
                <span className="text-sm font-medium">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MobileFlowDiagram />
    </>
  );
}

function MobileFlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [svgData, setSvgData] = useState<{
    w: number;
    h: number;
    paths: FlowPath[];
  } | null>(null);
  const inView = useInView(containerRef, { once: true });

  useEffect(() => {
    if (!inView) return;
    const DURS = [2.4, 3.2, 2.8, 3.6, 2.6, 3.0, 2.2, 3.4];
    const compute = () => {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;
      const cRect = container.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const cMidX = centerRect.left - cRect.left + centerRect.width / 2;
      const cTop = centerRect.top - cRect.top;
      const cBottom = centerRect.top - cRect.top + centerRect.height;
      const paths: FlowPath[] = [];

      // Inputs: bottom-center of chip → top-center of Lisa
      inputRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x1 = r.left - cRect.left + r.width / 2;
        const y1 = r.bottom - cRect.top;
        const x4 = cMidX;
        const y4 = cTop;
        const ctrl = (y4 - y1) * 0.55;
        const d = `M ${x1} ${y1} C ${x1} ${y1 + ctrl} ${x4} ${y4 - ctrl} ${x4} ${y4}`;
        paths.push({ d, color: FLOW_INPUTS[i].color, id: `min-${i}`, dur: DURS[i] });
      });

      // Outputs: bottom-center of Lisa → top-center of chip
      outputRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x1 = cMidX;
        const y1 = cBottom;
        const x4 = r.left - cRect.left + r.width / 2;
        const y4 = r.top - cRect.top;
        const ctrl = (y4 - y1) * 0.55;
        const d = `M ${x1} ${y1} C ${x1} ${y1 + ctrl} ${x4} ${y4 - ctrl} ${x4} ${y4}`;
        paths.push({ d, color: FLOW_OUTPUTS[i].color, id: `mout-${i}`, dur: DURS[i + 3] });
      });

      setSvgData({ w: cRect.width, h: cRect.height, paths });
    };
    const t = setTimeout(compute, 600);
    window.addEventListener("resize", compute);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", compute);
    };
  }, [inView]);

  return (
    <div ref={containerRef} className="relative md:hidden">
      {svgData && (
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width={svgData.w}
          height={svgData.h}
          style={{ overflow: "visible" }}
        >
          {svgData.paths.map(({ d, color, id, dur }) => (
            <g key={id}>
              <path d={d} stroke={color} strokeWidth="3" fill="none" strokeOpacity="0.12" />
              <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeOpacity="0.45" strokeDasharray="4 3" />
              <circle r="3" fill={color} fillOpacity="0.95">
                <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
              </circle>
            </g>
          ))}
        </svg>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 py-2">
        {/* Inputs row */}
        <div className="w-full grid grid-cols-3 gap-2">
          {FLOW_INPUTS.map((node, i) => (
            <div
              key={node.label}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${node.bg} ${node.border} shadow-sm`}
            >
              <node.Icon className={`h-5 w-5 ${node.text}`} />
              <span className="text-xs font-medium text-center">{node.label}</span>
            </div>
          ))}
        </div>

        {/* Lisa center */}
        <div
          ref={centerRef}
          className="relative flex flex-col items-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-10 py-6 shadow-lg shadow-black/20"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border-2 border-orange-500/70"
              animate={{ scale: [1, 1.28], opacity: [0.3, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: [0.4, 0, 0.6, 1], delay: i * 1.2 }}
            />
          ))}
          <motion.img
            src="/lisa-isologo-orange.png"
            alt="Lisa"
            className="h-16 w-16 relative z-10"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="text-center relative z-10">
            <p className="text-foreground font-bold text-lg">Lisa</p>
            <p className="text-muted-foreground text-xs">IA Agent</p>
          </div>
        </div>

        {/* Outputs grid */}
        <div className="w-full grid grid-cols-2 gap-2">
          {FLOW_OUTPUTS.map((node, i) => (
            <div
              key={node.label}
              ref={(el) => { outputRefs.current[i] = el; }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${node.bg} ${node.border} shadow-sm`}
            >
              <node.Icon className={`h-4 w-4 flex-shrink-0 ${node.text}`} />
              <span className="text-xs font-medium">{node.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function LandingPage() {
  const { t } = useLocaleStore();

  const features = [
    {
      icon: MessageSquare,
      title: "Integración WhatsApp",
      description:
        "Conecta tu WhatsApp Business y responde automáticamente las 24/7.",
    },
    {
      icon: GraduationCap,
      title: "Entrena desde el chat",
      description:
        "Educa a Lisa conversando. Enséñale precios, horarios y menús en lenguaje natural.",
    },
    {
      icon: Zap,
      title: "Respuestas instantáneas",
      description:
        "Tus clientes reciben respuestas al momento, sin importar la hora del día.",
    },
    {
      icon: Globe,
      title: "Soporte multilingüe",
      description:
        "Atiende en español, inglés, portugués y francés sin esfuerzo adicional.",
    },
    {
      icon: Shield,
      title: "Datos seguros",
      description:
        "Control total de tus datos con una solución segura y confiable.",
    },
    {
      icon: TrendingUp,
      title: "Analíticas en tiempo real",
      description:
        "Monitorea conversaciones, calidad de respuesta y métricas de tu agente.",
    },
  ];

  const industries = [
    {
      icon: Hotel,
      name: "Hoteles",
      description: "Reservas, check-in, servicios del hotel, información turística.",
      circleBg: "bg-violet-100 dark:bg-violet-500/15",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: UtensilsCrossed,
      name: "Restaurantes",
      description: "Menús, reservaciones, horarios, pedidos a domicilio.",
      circleBg: "bg-red-100 dark:bg-red-500/15",
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      icon: ShoppingBag,
      name: "E-commerce",
      description: "Catálogo, estado de pedidos, devoluciones, soporte postventa.",
      circleBg: "bg-orange-100 dark:bg-orange-500/15",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: Calendar,
      name: "Agendamiento",
      description: "Citas, disponibilidad, confirmaciones y recordatorios.",
      circleBg: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Store,
      name: "Tienda WhatsApp",
      description: "Catálogo digital, pedidos y pagos directos por WhatsApp.",
      circleBg: "bg-emerald-100 dark:bg-emerald-500/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const steps = [
    {
      icon: Bot,
      iconClass: "w-9 h-9 text-orange-500",
      bgClass: "bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/40",
      title: "Crea tu agente",
      desc: "Elige la industria de tu negocio y personaliza el nombre y perfil de Lisa en minutos.",
    },
    {
      icon: BrainCircuit,
      iconClass: "w-9 h-9 text-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40",
      title: "Entrénala conversando",
      desc: "Chatea con Lisa y enséñale sobre tu empresa: precios, horarios y preguntas frecuentes.",
    },
    {
      icon: IconWhatsApp,
      iconClass: "w-9 h-9 text-[#25D366]",
      bgClass: "bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900/40",
      title: "Conéctala a WhatsApp",
      desc: "Vincula tu WhatsApp Business y Lisa empieza a atender a tus clientes de inmediato.",
    },
  ];

  const plans = [
    {
      icon: Zap,
      name: "Starter",
      price: "$30",
      features: [
        "1 agente",
        "1,000 mensajes/mes",
        "WhatsApp Business",
        "2 integraciones",
        "Entrenamiento por chat",
      ],
      cta: "Comenzar",
      primary: false,
    },
    {
      icon: Star,
      name: "Pro",
      price: "$80",
      popular: true,
      features: [
        "3 agentes",
        "3,000 mensajes/mes",
        "WhatsApp Business",
        "5 integraciones",
        "Entrenamiento por chat",
        "Analíticas avanzadas",
      ],
      cta: "Prueba gratis",
      primary: true,
    },
    {
      icon: Building2,
      name: "Business",
      price: "$200",
      features: [
        "5 agentes",
        "15,000 mensajes/mes",
        "WhatsApp Business",
        "Integraciones ilimitadas",
        "Entrenamiento por chat",
        "Analíticas avanzadas",
        "Soporte prioritario",
      ],
      cta: "Comenzar",
      primary: false,
    },
    {
      icon: Crown,
      name: "Enterprise",
      price: "$500",
      features: [
        "Agentes ilimitados",
        "Mensajes ilimitados",
        "WhatsApp Business",
        "Integraciones ilimitadas",
        "Entrenamiento por chat",
        "Analíticas avanzadas",
        "Soporte dedicado",
        "SLA garantizado",
      ],
      cta: "Contactar ventas",
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ── Navbar ─────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0 select-none">
            {/* Light mode */}
            <img
              src="/lisa-logo-orange.png"
              alt="Lisa"
              className="h-16 dark:hidden"
            />
            {/* Dark mode */}
            <img
              src="/lisa-logo-white.png"
              alt="Lisa"
              className="h-16 hidden dark:block"
            />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground font-medium">
            <a
              href="#how"
              className="hover:text-foreground transition-colors"
            >
              Cómo funciona
            </a>
            <a
              href="#industries"
              className="hover:text-foreground transition-colors"
            >
              Industrias
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Precios
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              {t.common.signIn}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm"
            >
              {t.common.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────── */}
      <section className="relative overflow-hidden chat-messages-bg">
        {/* Animated floating icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {(
            [
              { Icon: Bot,           top: 5,  left: 8,  size: 26, dur: 9,  delay: 0.0 },
              { Icon: MessageCircle, top: 5,  left: 38, size: 32, dur: 8,  delay: 0.8 },
              { Icon: Sparkles,      top: 5,  left: 68, size: 20, dur: 10, delay: 1.6 },
              { Icon: Zap,           top: 5,  left: 88, size: 38, dur: 7,  delay: 2.4 },
              { Icon: BrainCircuit,  top: 28, left: 15, size: 22, dur: 11, delay: 0.3 },
              { Icon: Shield,        top: 28, left: 50, size: 40, dur: 9,  delay: 1.1 },
              { Icon: Globe,         top: 28, left: 82, size: 28, dur: 8,  delay: 2.0 },
              { Icon: GraduationCap, top: 55, left: 5,  size: 36, dur: 10, delay: 0.6 },
              { Icon: MessageSquare, top: 55, left: 35, size: 18, dur: 12, delay: 1.4 },
              { Icon: Bot,           top: 55, left: 62, size: 30, dur: 8,  delay: 2.2 },
              { Icon: Sparkles,      top: 55, left: 90, size: 24, dur: 9,  delay: 0.1 },
              { Icon: BrainCircuit,  top: 78, left: 20, size: 40, dur: 11, delay: 0.9 },
              { Icon: MessageCircle, top: 78, left: 55, size: 22, dur: 7,  delay: 1.7 },
              { Icon: Zap,           top: 78, left: 80, size: 34, dur: 10, delay: 2.5 },
              { Icon: Shield,        top: 90, left: 10, size: 28, dur: 8,  delay: 0.4 },
              { Icon: Globe,         top: 90, left: 45, size: 38, dur: 9,  delay: 1.2 },
              { Icon: GraduationCap, top: 90, left: 75, size: 20, dur: 11, delay: 2.0 },
            ] as { Icon: React.ElementType; top: number; left: number; size: number; dur: number; delay: number }[]
          ).map(({ Icon, top, left, size, dur, delay }, idx) => (
            <motion.span
              key={idx}
              className="absolute"
              style={{ top: `${top}%`, left: `${left}%` }}
              animate={{ y: [0, -18, 0], x: [0, 8, 0], rotate: [0, 12, 0] }}
              transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
            >
              <Icon
                className="text-orange-500/[0.05] dark:text-orange-400/[0.06]"
                style={{ width: size, height: size }}
              />
            </motion.span>
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-900/70 bg-orange-50 dark:bg-orange-950/50 px-3.5 py-1 text-xs font-semibold text-orange-700 dark:text-orange-400 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Agente de IA para WhatsApp
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.08 }}
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.4rem] leading-[1.07] mb-6"
              >
                Tu negocio,{" "}
                <span className="text-orange-500">atendiendo</span> clientes
                las 24 horas con{" "}
                {/* Isologo + "Lisa" shimmer — inline, proporcional al texto */}
                <span className="inline-flex items-center gap-2 align-middle">
                  <motion.span
                    className="relative inline-flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.65 }}
                  >
                    {/* Glow halo */}
                    <motion.span
                      animate={{ opacity: [0.4, 0.1, 0.4], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-orange-400/50 blur-sm pointer-events-none"
                    />
                    <motion.img
                      src="/lisa-isologo-orange.png"
                      alt=""
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative h-[1.2em] w-[1.2em] drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]"
                    />
                  </motion.span>
                  <span className="text-shimmer">Lisa</span>
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                  delay: 0.18,
                }}
                className="text-[1.05rem] text-muted-foreground max-w-lg leading-relaxed mb-9"
              >
                Crea agentes de IA que responden por WhatsApp al instante.
                Entrena a Lisa conversando — ella aprende sobre tu empresa y
                atiende a tus clientes mejor que nadie.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                  delay: 0.26,
                }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 items-center justify-center rounded-xl bg-orange-500 px-7 text-sm font-semibold text-white hover:bg-orange-600 transition-all shadow-[0_4px_18px_rgba(249,115,22,0.38)] hover:shadow-[0_6px_24px_rgba(249,115,22,0.48)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Chatea con Lisa
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#industries"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background/60 dark:bg-background/50 px-7 text-sm font-medium hover:bg-accent transition-all hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm"
                >
                  Ver industrias
                </a>
              </motion.div>

              {/* Social proof avatars */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="flex -space-x-2">
                  {[
                    "from-orange-400 to-orange-500",
                    "from-violet-400 to-violet-500",
                    "from-emerald-400 to-emerald-500",
                    "from-amber-400 to-amber-500",
                    "from-rose-400 to-rose-500",
                  ].map((g, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2 border-background flex items-center justify-center text-white text-[9px] font-bold shadow-sm`}
                    >
                      {["H", "R", "T", "C", "M"][i]}
                    </div>
                  ))}
                </div>
                <span>
                  Más de{" "}
                  <strong className="text-foreground">200+ negocios</strong>{" "}
                  confían en Lisa
                </span>
              </motion.div>
            </div>

            {/* Right: Chat mockup */}
            <motion.div
              initial={{ opacity: 0, x: 36, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 28,
                delay: 0.22,
              }}
              className="flex justify-center lg:justify-end pr-0 lg:pr-8"
            >
              <ChatMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────── */}
      <section className="border-y border-border bg-card/40 dark:bg-card/20">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { end: 500000, suffix: "+", label: "Mensajes procesados" },
              { end: 200, suffix: "+", label: "Negocios activos" },
              { end: 99, suffix: "%", label: "Disponibilidad" },
              { end: 1, suffix: " min", label: "Tiempo de respuesta" },
            ].map((stat, i) => (
              <FadeUp key={i} delay={i * 0.1} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {stat.label}
                </p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Capabilities Flow ────────────── */}
      <section className="py-20 md:py-24 border-t border-border bg-card/20 dark:bg-muted/5">
        <div className="mx-auto max-w-6xl px-4">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-semibold text-orange-500 mb-3 tracking-widest uppercase">
              Capacidades
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lisa entiende, conecta y actúa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Procesa texto, audio e imágenes, y se conecta a tus sistemas:
              plataformas de pago, bases de datos, e-commerce y software
              contable — todo desde WhatsApp.
            </p>
          </FadeUp>
          <AgentFlowDiagram />
        </div>
      </section>

      {/* ── How it works ───────────────────────── */}
      <section id="how" className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold text-orange-500 mb-3 tracking-widest uppercase">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              En 3 pasos, Lisa está lista
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Sin configuraciones técnicas. En minutos tu agente de IA estará
              respondiendo clientes en WhatsApp.
            </p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+2.5rem)] right-[calc(16.66%+2.5rem)] h-px bg-gradient-to-r from-orange-300/60 via-orange-400/80 to-orange-300/60 dark:from-orange-800/60 dark:via-orange-700/80 dark:to-orange-800/60" />

            {steps.map((step, i) => (
              <FadeUp key={i} delay={i * 0.14}>
                <div className="text-center relative">
                  <div className="relative inline-flex mb-5">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm border ${step.bgClass}`}>
                      <step.icon className={step.iconClass} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                      <span className="text-[10px] font-bold text-white leading-none">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ─────────────────────────── */}
      <section
        id="industries"
        className="py-20 md:py-24 border-t border-border bg-card/30 dark:bg-muted/10"
      >
        <div className="mx-auto max-w-6xl px-4">
          <FadeUp className="text-center mb-12">
            <p className="text-xs font-semibold text-orange-500 mb-3 tracking-widest uppercase">
              Industrias
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Un agente para cada negocio
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Lisa viene preconfigurada con algoritmos especializados por
              industria. Selecciona la tuya y empieza a operar en minutos.
            </p>
          </FadeUp>

          {/* Mobile: icon grid 2-col compact */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {industries.map((ind, i) => (
              <FadeUp key={ind.name + "-m"} delay={i * 0.08}>
                <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ind.circleBg}`}>
                    <ind.icon className={`h-6 w-6 ${ind.iconColor}`} />
                  </div>
                  <span className="text-sm font-semibold leading-tight">{ind.name}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{ind.description}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Desktop: full cards */}
          <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind, i) => (
              <FadeUp key={ind.name} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 380, damping: 24 } }}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 cursor-pointer group hover:shadow-md transition-shadow"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${ind.circleBg}`}>
                    <ind.icon className={`h-6 w-6 ${ind.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1 flex items-center gap-1.5">
                      {ind.name}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ind.description}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────── */}
      <section id="features" className="py-20 md:py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4">
          <FadeUp className="text-center mb-12">
            <p className="text-xs font-semibold text-orange-500 mb-3 tracking-widest uppercase">
              Funciones
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Herramientas potentes para automatizar la comunicación con tus
              clientes desde el primer día.
            </p>
          </FadeUp>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <FadeUp key={feat.title} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                  className="rounded-2xl border border-border bg-card p-6 group hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md transition-shadow"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/60 dark:from-orange-950/60 dark:to-orange-900/30 mb-4 group-hover:from-orange-100 transition-colors">
                    <feat.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Train CTA banner ───────────────────── */}
      <section className="relative overflow-hidden border-t border-border chat-messages-bg py-16 md:py-20">
        {/* Animated floating icons — same pattern as chat bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[Bot, MessageCircle, Sparkles, BrainCircuit, MessageSquare, GraduationCap].flatMap(
            (Icon, gi) =>
              [...Array(4)].map((_, i) => {
                const top = `${6 + ((gi * 17 + i * 23) % 82)}%`;
                const left = `${4 + ((gi * 23 + i * 19) % 88)}%`;
                const dur = 6 + ((gi * 3 + i * 2) % 8);
                const delay = (gi * 0.7 + i * 1.1) % 5;
                return (
                  <motion.span
                    key={`${gi}-${i}`}
                    className="absolute"
                    style={{ top, left }}
                    animate={{ y: [0, -14, 0], x: [0, 6, 0], rotate: [0, 8, 0] }}
                    transition={{
                      duration: dur,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay,
                    }}
                  >
                    <Icon
                      className="text-orange-500/[0.07] dark:text-orange-400/[0.08]"
                      style={{ width: 22 + (i * 7), height: 22 + (i * 7) }}
                    />
                  </motion.span>
                );
              })
          )}
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <FadeUp>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 backdrop-blur-sm mb-6 border border-orange-400/20">
              <GraduationCap className="w-7 h-7 text-orange-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Entrena a Lisa conversando
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Sin archivos complicados ni configuraciones técnicas. Solo chatea
              con Lisa y enséñale sobre tu negocio. Precios, horarios, menús —
              ella aprende y responde por ti.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-500 px-8 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-[0_4px_18px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Comenzar a entrenar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-24 border-t border-border">
        <div className="mx-auto max-w-6xl px-4">
          <FadeUp className="text-center mb-12">
            <p className="text-xs font-semibold text-orange-500 mb-3 tracking-widest uppercase">
              Precios
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planes y precios
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Escala a tu ritmo. Todos los planes incluyen entrenamiento por
              chat con Lisa.
            </p>
          </FadeUp>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <FadeUp key={plan.name} delay={i * 0.09}>
                <div
                  className={`relative rounded-2xl border p-6 h-full flex flex-col transition-all ${
                    plan.popular
                      ? "border-orange-500 bg-card glow-border"
                      : "border-border bg-card hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-md"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-semibold text-white shadow-sm whitespace-nowrap">
                      Popular
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <plan.icon
                      className={`h-5 w-5 ${
                        plan.popular
                          ? "text-orange-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <h3 className="font-semibold">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                      plan.primary
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "border border-border hover:bg-accent"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="border-t border-border py-10 bg-card/20 dark:bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="select-none">
              <img src="/lisa-logo-orange.png" alt="Lisa" className="h-12 dark:hidden" />
              <img src="/lisa-logo-white.png" alt="Lisa" className="h-12 hidden dark:block" />
            </Link>
            <p className="text-sm text-muted-foreground text-center">
              Learning Intelligence Service Automatization
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
