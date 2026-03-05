"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Bot,
  BrainCircuit,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Upload,
} from "lucide-react";

async function parseDocument(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/setup/parse-doc", { method: "POST", body: form });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Error al procesar el documento");
  }
  const { text } = await res.json();
  return text as string;
}

function parseFaqsFromText(text: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  // Intenta detectar pares P:/R: o Q:/A: o Pregunta:/Respuesta:
  const pairRegex = /(?:P|Q|Pregunta)[:\.\-]\s*(.+?)\n(?:R|A|Respuesta)[:\.\-]\s*([\s\S]+?)(?=\n(?:P|Q|Pregunta)[:\.\-]|$)/gi;
  let match;
  while ((match = pairRegex.exec(text)) !== null) {
    faqs.push({ question: match[1].trim(), answer: match[2].trim() });
  }
  if (faqs.length > 0) return faqs;

  // Fallback: líneas con "?" son preguntas, la siguiente línea es la respuesta
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].endsWith("?") && i + 1 < lines.length) {
      faqs.push({ question: lines[i], answer: lines[i + 1] });
      i++;
    }
  }
  if (faqs.length > 0) return faqs;

  // Último fallback: cada párrafo como una FAQ sin respuesta
  return text.split(/\n\n+/).filter(Boolean).slice(0, 30).map((p) => ({
    question: p.split("\n")[0].trim(),
    answer: p.split("\n").slice(1).join(" ").trim(),
  }));
}

const AGENT_LABELS: Record<string, { name: string; color: string }> = {
  omghat: { name: "omghat", color: "orange" },
  max: { name: "max", color: "slate" },
};

interface Faq {
  id: string;
  question: string;
  answer: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function AgentSetupPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = use(params);
  const router = useRouter();

  const agentMeta = AGENT_LABELS[agentSlug] ?? { name: agentSlug, color: "orange" };

  const [agentName, setAgentName] = useState(agentMeta.name);
  const [faqs, setFaqs] = useState<Faq[]>([{ id: genId(), question: "", answer: "" }]);
  const [prompt, setPrompt] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(faqs[0].id);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingPrompt, setUploadingPrompt] = useState(false);
  const [uploadingFaqs, setUploadingFaqs] = useState(false);
  const promptFileRef = useRef<HTMLInputElement>(null);
  const faqsFileRef = useRef<HTMLInputElement>(null);

  async function handlePromptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPrompt(true);
    try {
      const text = await parseDocument(file);
      setPrompt(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al leer el archivo");
    } finally {
      setUploadingPrompt(false);
      e.target.value = "";
    }
  }

  async function handleFaqsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFaqs(true);
    try {
      const text = await parseDocument(file);
      const parsed = parseFaqsFromText(text);
      if (parsed.length === 0) {
        alert("No se encontraron preguntas en el documento. Verifica el formato.");
        return;
      }
      setFaqs(parsed.map((f) => ({ ...f, id: genId() })));
      setExpandedFaq(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al leer el archivo");
    } finally {
      setUploadingFaqs(false);
      e.target.value = "";
    }
  }

  // FAQs
  function addFaq() {
    const id = genId();
    setFaqs((prev) => [...prev, { id, question: "", answer: "" }]);
    setExpandedFaq(id);
  }

  function removeFaq(id: string) {
    setFaqs((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        const newId = genId();
        setExpandedFaq(newId);
        return [{ id: newId, question: "", answer: "" }];
      }
      return next;
    });
  }

  function updateFaq(id: string, field: "question" | "answer", value: string) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  }

  const validFaqs = faqs.filter((f) => f.question.trim() || f.answer.trim());
  const isValid = agentName.trim() && prompt.trim();

  async function handleSubmit() {
    if (!isValid) return;

    setStatus("loading");
    setErrorMsg("");

    const payload = {
      agent_slug: agentSlug,
      agent_name: agentName.trim(),
      prompt: prompt.trim(),
      faqs: validFaqs.map(({ question, answer }) => ({
        question: question.trim(),
        answer: answer.trim(),
      })),
      created_at: new Date().toISOString(),
    };

    try {
      // Llama al proxy server-side para evitar CORS con n8n
      const res = await fetch("/api/setup/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug, payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al enviar. Revisa la URL del webhook."
      );
      setStatus("error");
    }
  }

  // ── Success screen ──
  if (status === "success") {
    const agentLogos: Record<string, string> = {
      omghat: "/logo-omghat.png",
      max: "/logo-max.png",
    };
    const agentLogo = agentLogos[agentSlug];

    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-between px-4 py-10 md:py-16">

        {/* Top: logos */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="flex items-center gap-4"
        >
          <img src="/logo-laagencia.png" alt="LaAgencia" className="h-8 md:h-10 object-contain opacity-90" />
          <div className="w-px h-6 bg-white/15" />
          <img src="/lisa-logo-white.png" alt="LISA" className="h-6 md:h-8 object-contain opacity-80" />
        </motion.div>

        {/* Center: main message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.08 }}
          className="w-full max-w-sm md:max-w-md text-center space-y-6 my-10"
        >
          {/* Agent logo + check */}
          <div className="relative flex justify-center">
            <div className="h-28 w-28 md:h-36 md:w-36 rounded-3xl bg-white/6 ring-1 ring-white/12 flex items-center justify-center overflow-hidden shadow-2xl shadow-black/40">
              {agentLogo
                ? <img src={agentLogo} alt={agentMeta.name} className="h-full w-full object-contain p-3" />
                : <div className="text-[48px] font-black text-white/20">{agentMeta.name[0]}</div>
              }
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 28, delay: 0.3 }}
              className="absolute -bottom-3 -right-3 h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-[#0f0f0f]"
            >
              <CheckCircle2 className="h-5 w-5 text-white" />
            </motion.div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="text-[28px] md:text-[34px] font-bold text-white leading-tight"
            >
              Tu algoritmo está entrenado
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.24 }}
              className="text-[16px] md:text-[18px] text-white/50 leading-snug"
            >
              <span className="text-white font-semibold">{agentName}</span> está listo
              para responder a tus clientes
            </motion.p>
          </div>

          {/* WhatsApp CTA */}
          <motion.a
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full rounded-2xl py-4 text-[17px] font-bold text-white shadow-xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Pruébalo por WhatsApp
          </motion.a>

          {/* Secondary actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <button
              onClick={() => router.push("/setup")}
              className="flex-1 rounded-2xl bg-white/6 py-3 text-[15px] font-medium text-white/50 ring-1 ring-white/10 transition-all active:scale-[0.97] hover:bg-white/10"
            >
              Volver al panel
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setFaqs([{ id: genId(), question: "", answer: "" }]);
                setPrompt("");
              }}
              className="flex-1 rounded-2xl bg-white/6 py-3 text-[15px] font-medium text-white/50 ring-1 ring-white/10 transition-all active:scale-[0.97] hover:bg-white/10"
            >
              Reconfigurar
            </button>
          </motion.div>
        </motion.div>

        {/* Bottom: LISA branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <img src="/lisa-isologo-naranja.png" alt="LISA" className="h-8 w-8 object-contain opacity-70" />
          <p className="text-[13px] text-white/30 text-center">
            Gracias por usar <span className="text-white/50 font-medium">LISA</span>
            <br />
            <span className="text-[11px] text-white/20">Powered by AIC Studio</span>
          </p>
        </motion.div>

      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 pb-12 pt-8">
      <div className="mx-auto max-w-lg space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => router.push("/setup")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/6 text-white/50 transition-all hover:bg-white/12 hover:text-white/80 active:scale-90"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10 overflow-hidden">
              <img src={`/logo-${agentSlug}.png`} alt={agentMeta.name} className="h-full w-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold text-white leading-tight">
                {agentMeta.name}
              </h1>
              <p className="text-[12px] text-white/40">Configurar algoritmo</p>
            </div>
          </div>
        </motion.div>

        {/* Progreso */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.04 }}
          className="flex items-center gap-2 px-0.5"
        >
          {["Nombre", "FAQs", "Prompt"].map((step, i) => {
            const done =
              i === 0 ? !!agentName.trim() : i === 1 ? validFaqs.length > 0 : !!prompt.trim();
            return (
              <div key={step} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    done
                      ? "bg-emerald-500 text-white"
                      : "bg-white/8 text-white/30"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[12px] font-medium ${done ? "text-white/60" : "text-white/25"}`}>
                  {step}
                </span>
                {i < 2 && <div className="flex-1 h-px bg-white/8" />}
              </div>
            );
          })}
        </motion.div>

        {/* 1 — Nombre */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.08 }}
          className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15">
              <Bot className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white leading-tight">
                Nombre del agente
              </p>
              <p className="text-[12px] text-white/35">
                Como se identificara en WhatsApp
              </p>
            </div>
          </div>
          <div className="px-4 py-3">
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder={`ej. ${agentMeta.name} — Asistente de Ventas`}
              className="w-full rounded-xl bg-white/6 px-4 py-3 text-[16px] text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-orange-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* 2 — FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.13 }}
          className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                <HelpCircle className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white leading-tight">
                  Preguntas frecuentes
                </p>
                <p className="text-[12px] text-white/35">
                  {faqs.length} pregunta{faqs.length !== 1 ? "s" : ""} — recomendamos 10+
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input ref={faqsFileRef} type="file" accept=".txt,.pdf,.docx,.md" className="hidden" onChange={handleFaqsFile} />
              <button
                onClick={() => faqsFileRef.current?.click()}
                disabled={uploadingFaqs}
                title="Subir documento con preguntas"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 transition-all active:scale-90 hover:bg-amber-500/25 disabled:opacity-50"
              >
                {uploadingFaqs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </button>
              <button
                onClick={addFaq}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 transition-all active:scale-90 hover:bg-orange-500/25"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/5"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/50">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-[15px] text-white/80 truncate">
                      {faq.question.trim() || (
                        <span className="text-white/30 italic">
                          Pregunta {index + 1}…
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {faqs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFaq(faq.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-white/25 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="h-4 w-4 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/30" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedFaq === faq.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.14 }}
                        className="px-4 pb-3 space-y-2"
                      >
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) =>
                            updateFaq(faq.id, "question", e.target.value)
                          }
                          placeholder="¿Cuales son los horarios de atención?"
                          className="w-full rounded-xl bg-white/6 px-3.5 py-2.5 text-[14px] text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-amber-500/40 transition-all"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) =>
                            updateFaq(faq.id, "answer", e.target.value)
                          }
                          placeholder="Respondemos de lunes a viernes de 8am a 6pm…"
                          rows={3}
                          className="w-full resize-none rounded-xl bg-white/6 px-3.5 py-2.5 text-[14px] text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-amber-500/40 transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="px-4 pb-3 pt-1">
            <button
              onClick={addFaq}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 py-2.5 text-[14px] font-medium text-white/35 transition-all hover:border-orange-500/30 hover:text-orange-400 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Agregar pregunta
            </button>
          </div>
        </motion.div>

        {/* 3 — Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.18 }}
          className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white leading-tight">
                Prompt del agente
              </p>
              <p className="text-[12px] text-white/35">
                Pega el prompt o sube un documento
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] text-white/30 tabular-nums">{prompt.length} car.</span>
              <input ref={promptFileRef} type="file" accept=".txt,.pdf,.docx,.md" className="hidden" onChange={handlePromptFile} />
              <button
                onClick={() => promptFileRef.current?.click()}
                disabled={uploadingPrompt}
                title="Subir documento"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-all active:scale-90 hover:bg-blue-500/25 disabled:opacity-50"
              >
                {uploadingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="px-4 py-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Eres ${agentMeta.name}, el asistente virtual de [Empresa]. Tu misión es ayudar a los clientes con información sobre productos, horarios, precios y resolver dudas frecuentes.\n\nSiempre responde en español, de forma amable y profesional. Nunca inventes precios ni hagas promesas que no puedas cumplir.\n\nContexto del negocio:\n- Nombre: [Empresa]\n- Sector: [Industria]\n- Horario: [Horario de atención]\n\nTono: cercano, profesional, conciso.`}
              rows={16}
              className="w-full resize-none rounded-xl bg-white/5 px-4 py-3 text-[14px] leading-relaxed text-white placeholder-white/18 outline-none ring-1 ring-white/8 focus:ring-blue-500/35 transition-all font-mono"
            />
            <p className="mt-2 text-[12px] text-white/25 leading-relaxed">
              Incluye: rol, tono, contexto del negocio, limites de respuesta y
              ejemplos de conversacion.
            </p>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3"
            >
              <p className="text-[14px] text-red-400">
                {errorMsg || "Error al enviar al webhook. Revisa la URL."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.26 }}
        >
          <button
            onClick={handleSubmit}
            disabled={!isValid || status === "loading"}
            className={`w-full rounded-2xl py-4 text-[17px] font-bold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
              isValid && status !== "loading"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25 active:scale-[0.98] hover:shadow-orange-500/40"
                : "bg-white/6 text-white/25 cursor-not-allowed shadow-none"
            }`}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Entrenando algoritmo…
              </>
            ) : (
              <>
                <BrainCircuit className="h-5 w-5" />
                Entrenar Algoritmo
              </>
            )}
          </button>

          {!isValid && (
            <p className="mt-2 text-center text-[13px] text-white/30">
              {!agentName.trim()
                ? "Escribe el nombre del agente"
                : "Agrega el prompt del agente"}
            </p>
          )}
        </motion.div>

        <div className="h-4" />
      </div>
    </div>
  );
}
