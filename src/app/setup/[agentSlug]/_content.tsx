"use client";

import { use, useState, useRef, useEffect } from "react";
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
  Phone,
  ShieldCheck,
  MessageCircle,
  ImagePlus,
  X,
  BookOpen,
  FileCheck,
} from "lucide-react";

async function parseDocument(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }

  if (name.endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pages.push(content.items.map((item: any) => item.str ?? "").join(" "));
    }
    return pages.join("\n");
  }

  if (name.endsWith(".docx")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error("Formato no soportado. Usa .txt, .pdf o .docx");
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

const COUNTRIES = [
  { code: "+57",  flag: "🇨🇴", name: "Colombia",       digits: 10 },
  { code: "+52",  flag: "🇲🇽", name: "México",         digits: 10 },
  { code: "+1",   flag: "🇺🇸", name: "Estados Unidos", digits: 10 },
  { code: "+34",  flag: "🇪🇸", name: "España",         digits: 9  },
  { code: "+54",  flag: "🇦🇷", name: "Argentina",      digits: 10 },
  { code: "+56",  flag: "🇨🇱", name: "Chile",          digits: 9  },
  { code: "+51",  flag: "🇵🇪", name: "Perú",           digits: 9  },
  { code: "+593", flag: "🇪🇨", name: "Ecuador",        digits: 9  },
  { code: "+58",  flag: "🇻🇪", name: "Venezuela",      digits: 10 },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica",     digits: 8  },
  { code: "+507", flag: "🇵🇦", name: "Panamá",         digits: 8  },
  { code: "+502", flag: "🇬🇹", name: "Guatemala",      digits: 8  },
  { code: "+503", flag: "🇸🇻", name: "El Salvador",    digits: 8  },
  { code: "+504", flag: "🇭🇳", name: "Honduras",       digits: 8  },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua",      digits: 8  },
];

function PhoneField({
  value, onChange, placeholder, ringColor,
}: {
  value: string;
  onChange: (full: string) => void;
  placeholder?: string;
  ringColor?: string;
}) {
  const defaultCountry = COUNTRIES[0]; // Colombia
  const [country, setCountry] = useState(defaultCountry);
  const [local, setLocal] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync outward value
  useEffect(() => {
    const digits = local.replace(/\D/g, "");
    onChange(digits ? `${country.code}${digits}` : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, country]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const digits = local.replace(/\D/g, "").length;
  const valid = digits === country.digits;
  const hasInput = local.trim().length > 0;

  const ringClass = hasInput
    ? valid
      ? "ring-emerald-500/50"
      : "ring-red-500/40"
    : `ring-white/10 focus-within:${ringColor ?? "ring-orange-500/50"}`;

  return (
    <div ref={ref} className="relative">
      <div className={`flex rounded-xl bg-white/6 ring-1 transition-all overflow-hidden ${ringClass}`}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-3 border-r border-white/10 shrink-0 hover:bg-white/6 transition-colors"
        >
          <span className="text-[18px] leading-none">{country.flag}</span>
          <span className="text-[13px] text-white/50 font-medium tabular-nums">{country.code}</span>
          <ChevronDown className={`h-3 w-3 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder={placeholder ?? "300 123 4567"}
          className="flex-1 bg-transparent px-3 py-3 text-[16px] text-white placeholder-white/25 outline-none min-w-0"
        />

        {/* Digit counter */}
        <span className={`flex items-center pr-3.5 text-[12px] tabular-nums font-medium shrink-0 ${valid ? "text-emerald-400" : "text-white/25"}`}>
          {digits}/{country.digits}
        </span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-full rounded-2xl bg-[#222] ring-1 ring-white/10 shadow-xl overflow-hidden"
          >
            <div className="max-h-52 overflow-y-auto">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountry(c); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/8 ${
                    c.code === country.code ? "bg-orange-500/10" : ""
                  }`}
                >
                  <span className="text-[18px] leading-none">{c.flag}</span>
                  <span className="flex-1 text-[14px] text-white/80">{c.name}</span>
                  <span className="text-[13px] text-white/35 tabular-nums">{c.code}</span>
                  <span className="text-[11px] text-white/20">{c.digits} díg.</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const AGENT_LABELS: Record<string, { name: string; color: string }> = {
  omghat: { name: "omghat", color: "orange" },
  max: { name: "max", color: "slate" },
};

const TONES = [
  { id: "formal",      label: "Formal",      desc: "Profesional y serio" },
  { id: "friendly",    label: "Amigable",    desc: "Cercano y cálido" },
  { id: "casual",      label: "Casual",      desc: "Relajado y natural" },
  { id: "empathic",    label: "Empático",    desc: "Comprensivo y paciente" },
  { id: "enthusiastic",label: "Entusiasta",  desc: "Dinámico y motivador" },
];

const MAX_IMAGES = 20;
const MAX_CATALOGS = 10;

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface AgentImage {
  id: string;
  title: string;
  url: string;
  preview: string;
  uploading: boolean;
  error: string;
}

interface AgentCatalog {
  id: string;
  title: string;
  fileName: string;
  url: string;
  uploading: boolean;
  error: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function TrainingStep({ label, icon: Icon, delay, index, total }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
  index: number;
  total: number;
}) {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(true), delay * 1000);
    const stepDuration = 20 / total;
    const t2 = setTimeout(() => setDone(true), (delay + stepDuration) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay, total]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={active ? { opacity: 1, x: 0 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`flex items-center gap-3 transition-opacity duration-500 ${!active ? "opacity-0" : ""}`}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-700 ${done ? "bg-emerald-500/20" : "bg-white/8"}`}>
        {done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </motion.div>
        ) : active ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="h-4 w-4 text-white/50" />
          </motion.div>
        ) : (
          <Icon className="h-4 w-4 text-white/20" />
        )}
      </div>
      <span className={`text-sm transition-colors duration-700 ${done ? "text-emerald-400" : active ? "text-white/70" : "text-white/20"}`}>
        {label}
      </span>
    </motion.div>
  );
}

export default function AgentSetupPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = use(params);
  const router = useRouter();

  const agentMeta = AGENT_LABELS[agentSlug] ?? { name: agentSlug, color: "orange" };

  const STORAGE_KEY = `lisa-contacts-${agentSlug}`;

  function loadSavedContacts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { escalationPhone: string; adminPhone: string };
    } catch { return null; }
  }

  const saved = loadSavedContacts();

  const [agentName, setAgentName] = useState(agentMeta.name);
  const [tone, setTone] = useState("friendly");
  const [faqs, setFaqs] = useState<Faq[]>([
    { id: genId(), question: "¿Cuáles son los horarios de atención?", answer: "" },
    { id: genId(), question: "¿Cuáles son los métodos de pago?", answer: "" },
    { id: genId(), question: "¿Hacen envíos? ¿Cuánto demoran?", answer: "" },
    { id: genId(), question: "¿Dónde están ubicados?", answer: "" },
    { id: genId(), question: "¿Tienen garantía o política de devoluciones?", answer: "" },
    { id: genId(), question: "¿Cómo puedo hacer un pedido?", answer: "" },
    { id: genId(), question: "¿Tienen servicio a domicilio?", answer: "" },
    { id: genId(), question: "¿Ofrecen descuentos o promociones?", answer: "" },
  ]);
  const [prompt, setPrompt] = useState("");
  const [escalationPhone, setEscalationPhone] = useState(saved?.escalationPhone ?? "");
  const [adminPhone, setAdminPhone] = useState(saved?.adminPhone ?? "");
  const [contactsCollapsed, setContactsCollapsed] = useState(!!saved);
  const [images, setImages] = useState<AgentImage[]>([]);
  const [draggingImages, setDraggingImages] = useState(false);
  const imagesFileRef = useRef<HTMLInputElement>(null);
  const [catalogs, setCatalogs] = useState<AgentCatalog[]>([]);
  const [draggingCatalogs, setDraggingCatalogs] = useState(false);
  const catalogsFileRef = useRef<HTMLInputElement>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(faqs[0].id);
  const [status, setStatus] = useState<"idle" | "loading" | "training" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingPrompt, setUploadingPrompt] = useState(false);
  const [uploadingFaqs, setUploadingFaqs] = useState(false);
  const [draggingPrompt, setDraggingPrompt] = useState(false);
  const [draggingFaqs, setDraggingFaqs] = useState(false);
  const promptFileRef = useRef<HTMLInputElement>(null);
  const faqsFileRef = useRef<HTMLInputElement>(null);

  async function handlePromptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPromptFile(file);
    e.target.value = "";
  }

  async function handleFaqsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFaqsFile(file);
    e.target.value = "";
  }

  // FAQs
  function addFaq() {
    const id = genId();
    setFaqs((prev) => [...prev, { id, question: "", answer: "" }]);
    setExpandedFaq(id);
  }

  function makeDragHandlers(
    setter: (v: boolean) => void,
    onFile: (f: File) => void,
  ) {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setter(true); },
      onDragEnter: (e: React.DragEvent) => { e.preventDefault(); setter(true); },
      onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setter(false); },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setter(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
      },
    };
  }

  async function processPromptFile(file: File) {
    setUploadingPrompt(true);
    try {
      const text = await parseDocument(file);
      setPrompt(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al leer el archivo");
    } finally { setUploadingPrompt(false); }
  }

  async function processFaqsFile(file: File) {
    setUploadingFaqs(true);
    try {
      const text = await parseDocument(file);
      const parsed = parseFaqsFromText(text);
      if (parsed.length === 0) { alert("No se encontraron preguntas en el documento. Verifica el formato."); return; }
      setFaqs(parsed.map((f) => ({ ...f, id: genId() })));
      setExpandedFaq(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al leer el archivo");
    } finally { setUploadingFaqs(false); }
  }

  const promptDrag = makeDragHandlers(setDraggingPrompt, processPromptFile);
  const faqsDrag = makeDragHandlers(setDraggingFaqs, processFaqsFile);

  async function handleImageFiles(files: File[]) {
    const slots = MAX_IMAGES - images.length;
    const toAdd = files.filter((f) => f.type.startsWith("image/")).slice(0, slots);
    if (!toAdd.length) return;

    const newImgs: AgentImage[] = toAdd.map((f) => ({
      id: genId(), title: "", url: "", preview: URL.createObjectURL(f), uploading: true, error: "",
    }));
    setImages((prev) => [...prev, ...newImgs]);

    for (let i = 0; i < toAdd.length; i++) {
      const img = newImgs[i];
      const form = new FormData();
      form.append("file", toAdd[i]);
      form.append("agentSlug", agentSlug);
      try {
        const res = await fetch("/api/setup/upload-image", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al subir");
        setImages((prev) => prev.map((m) => m.id === img.id ? { ...m, url: data.url, uploading: false } : m));
      } catch (err) {
        setImages((prev) => prev.map((m) => m.id === img.id ? { ...m, uploading: false, error: err instanceof Error ? err.message : "Error" } : m));
      }
    }
  }

  const imagesDrag = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (images.length < MAX_IMAGES) setDraggingImages(true); },
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); if (images.length < MAX_IMAGES) setDraggingImages(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDraggingImages(false); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingImages(false);
      const files = Array.from(e.dataTransfer.files);
      handleImageFiles(files);
    },
  };

  async function handleImagesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await handleImageFiles(files);
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const img = prev.find((m) => m.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter((m) => m.id !== id);
    });
  }

  function updateImageTitle(id: string, title: string) {
    setImages((prev) => prev.map((m) => m.id === id ? { ...m, title } : m));
  }

  async function handleCatalogFiles(files: File[]) {
    const slots = MAX_CATALOGS - catalogs.length;
    const toAdd = files.filter((f) => f.name.toLowerCase().endsWith(".pdf")).slice(0, slots);
    if (!toAdd.length) return;

    const newCats: AgentCatalog[] = toAdd.map((f) => ({
      id: genId(), title: f.name.replace(/\.pdf$/i, ""), fileName: f.name, url: "", uploading: true, error: "",
    }));
    setCatalogs((prev) => [...prev, ...newCats]);

    for (let i = 0; i < toAdd.length; i++) {
      const cat = newCats[i];
      const form = new FormData();
      form.append("file", toAdd[i]);
      form.append("agentSlug", agentSlug);
      try {
        const res = await fetch("/api/setup/upload-catalog", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al subir");
        setCatalogs((prev) => prev.map((c) => c.id === cat.id ? { ...c, url: data.url, uploading: false } : c));
      } catch (err) {
        setCatalogs((prev) => prev.map((c) => c.id === cat.id ? { ...c, uploading: false, error: err instanceof Error ? err.message : "Error" } : c));
      }
    }
  }

  const catalogsDrag = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (catalogs.length < MAX_CATALOGS) setDraggingCatalogs(true); },
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); if (catalogs.length < MAX_CATALOGS) setDraggingCatalogs(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDraggingCatalogs(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDraggingCatalogs(false); handleCatalogFiles(Array.from(e.dataTransfer.files)); },
  };

  function removeCatalog(id: string) {
    setCatalogs((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCatalogTitle(id: string, title: string) {
    setCatalogs((prev) => prev.map((c) => c.id === id ? { ...c, title } : c));
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

  const PROMPT_MIN = 150;

  const validFaqs = faqs.filter((f) => f.question.trim() || f.answer.trim());
  const incompleteFaqs = faqs.filter((f) => f.question.trim() && !f.answer.trim());
  const imagesUploading = images.some((m) => m.uploading);
  const imagesMissingTitle = images.filter((m) => m.url && !m.title.trim());
  const catalogsUploading = catalogs.some((c) => c.uploading);
  const catalogsMissingTitle = catalogs.filter((c) => c.url && !c.title.trim());

  const isValid =
    agentName.trim() &&
    prompt.trim().length >= PROMPT_MIN &&
    incompleteFaqs.length === 0 &&
    !imagesUploading &&
    imagesMissingTitle.length === 0 &&
    !catalogsUploading &&
    catalogsMissingTitle.length === 0 &&
    escalationPhone.trim() &&
    adminPhone.trim();

  async function handleSubmit() {
    if (!isValid) return;

    setStatus("loading");
    setErrorMsg("");

    const payload = {
      agent_slug: agentSlug,
      agent_name: agentName.trim(),
      tone,
      prompt: prompt.trim(),
      faqs: validFaqs.map(({ question, answer }) => ({
        question: question.trim(),
        answer: answer.trim(),
      })),
      escalation_phone: escalationPhone.trim(),
      admin_phone: adminPhone.trim(),
      images: images.filter((m) => m.url).map(({ title, url }) => ({ title: title.trim(), url })),
      catalogs: catalogs.filter((c) => c.url).map(({ title, url, fileName }) => ({ title: title.trim(), url, fileName })),
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
      // Guardar contactos en localStorage para no tener que re-ingresarlos
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ escalationPhone: escalationPhone.trim(), adminPhone: adminPhone.trim() }));
      } catch { /* ignore */ }
      setStatus("training");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al enviar. Revisa la URL del webhook."
      );
      setStatus("error");
    }
  }

  // ── Training screen (20s animated) ──
  const TRAINING_STEPS = [
    { label: "Procesando datos del agente", icon: BrainCircuit },
    { label: "Configurando tono de conversación", icon: MessageCircle },
    { label: "Entrenando preguntas frecuentes", icon: HelpCircle },
    { label: "Cargando catálogos y recursos", icon: BookOpen },
    { label: "Optimizando respuestas", icon: Bot },
    { label: "Finalizando entrenamiento", icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (status !== "training") return;
    const timer = setTimeout(() => setStatus("success"), 20000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "training") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4">
        {/* Outer glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative mb-12"
        >
          {/* Rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="h-32 w-32 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#34d399", borderRightColor: "#34d39950" }}
          />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrainCircuit className="h-12 w-12 text-emerald-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold text-white mb-3 text-center"
        >
          Entrenando a {agentName}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/40 text-sm mb-10 text-center"
        >
          Esto toma unos segundos, no cierres esta ventana
        </motion.p>

        {/* Animated steps */}
        <div className="w-full max-w-xs space-y-4">
          {TRAINING_STEPS.map((step, i) => {
            const delay = (i * 20) / TRAINING_STEPS.length;
            return (
              <TrainingStep key={i} label={step.label} icon={step.icon} delay={delay} index={i} total={TRAINING_STEPS.length} />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mt-10 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 20, ease: "linear" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
          />
        </div>
      </div>
    );
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
          {["Nombre", "FAQs", "Prompt", "Imágenes", "Catálogos", "Contactos"].map((step, i) => {
            const done =
              i === 0 ? !!agentName.trim() :
              i === 1 ? validFaqs.length > 0 :
              i === 2 ? prompt.trim().length >= PROMPT_MIN :
              i === 3 ? (images.length > 0 && !imagesUploading && imagesMissingTitle.length === 0) :
              i === 4 ? (catalogs.length > 0 && !catalogsUploading && catalogsMissingTitle.length === 0) :
              !!(escalationPhone.trim() && adminPhone.trim());
            return (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    done
                      ? "bg-emerald-500 text-white"
                      : "bg-white/8 text-white/30"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[11px] font-medium ${done ? "text-white/60" : "text-white/25"}`}>
                  {step}
                </span>
                {i < 5 && <div className="flex-1 h-px bg-white/8" />}
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
          <div className="px-4 pt-3 pb-4 space-y-4">
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder={`ej. ${agentMeta.name} — Asistente de Ventas`}
              className="w-full rounded-xl bg-white/6 px-4 py-3 text-[16px] text-white placeholder-white/25 outline-none ring-1 ring-white/10 focus:ring-orange-500/50 transition-all"
            />

            {/* Tono de conversación */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-white/30" />
                <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Tono de conversación</p>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-all ring-1 ${
                      tone === t.id
                        ? "bg-orange-500/15 ring-orange-500/40 text-orange-400"
                        : "bg-white/5 ring-white/8 text-white/35 hover:bg-white/8"
                    }`}
                  >
                    <span className="text-[12px] font-semibold leading-tight">{t.label}</span>
                    <span className={`text-[10px] leading-tight ${tone === t.id ? "text-orange-400/70" : "text-white/20"}`}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2 — FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.13 }}
          {...faqsDrag}
          className={`relative rounded-2xl bg-[#1a1a1a] ring-1 overflow-hidden transition-all ${draggingFaqs ? "ring-amber-400/60 bg-amber-500/5" : "ring-white/8"}`}
        >
          {draggingFaqs && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-amber-500/10 backdrop-blur-[2px]">
              <Upload className="h-8 w-8 text-amber-400" />
              <p className="text-[15px] font-semibold text-amber-300">Suelta el documento aquí</p>
              <p className="text-[12px] text-amber-400/60">Se importarán las preguntas automáticamente</p>
            </div>
          )}
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
                        <div className="relative">
                          <textarea
                            value={faq.answer}
                            onChange={(e) =>
                              updateFaq(faq.id, "answer", e.target.value)
                            }
                            placeholder="Respondemos de lunes a viernes de 8am a 6pm…"
                            rows={3}
                            className={`w-full resize-none rounded-xl bg-white/6 px-3.5 py-2.5 text-[14px] text-white placeholder-white/25 outline-none ring-1 transition-all ${
                              faq.question.trim() && !faq.answer.trim()
                                ? "ring-red-500/40 bg-red-500/5"
                                : "ring-white/10 focus:ring-amber-500/40"
                            }`}
                          />
                          {faq.question.trim() && !faq.answer.trim() && (
                            <p className="mt-1 text-[11px] text-red-400">Respuesta obligatoria</p>
                          )}
                        </div>
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
              <span className={`text-[12px] tabular-nums ${prompt.length >= PROMPT_MIN ? "text-emerald-400" : prompt.length > 0 ? "text-amber-400" : "text-white/30"}`}>
                {prompt.length}/{PROMPT_MIN} mín.
              </span>
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
            <div
              {...promptDrag}
              className={`relative rounded-xl transition-all ${draggingPrompt ? "ring-2 ring-blue-400/60 bg-blue-500/8" : ""}`}
            >
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Eres ${agentMeta.name}, el asistente virtual de [Empresa]. Tu misión es ayudar a los clientes con información sobre productos, horarios, precios y resolver dudas frecuentes.\n\nSiempre responde en español, de forma amable y profesional. Nunca inventes precios ni hagas promesas que no puedas cumplir.\n\nContexto del negocio:\n- Nombre: [Empresa]\n- Sector: [Industria]\n- Horario: [Horario de atención]\n\nTono: cercano, profesional, conciso.`}
                rows={16}
                className="w-full resize-none rounded-xl bg-white/5 px-4 py-3 text-[14px] leading-relaxed text-white placeholder-white/18 outline-none ring-1 ring-white/8 focus:ring-blue-500/35 transition-all font-mono"
              />
              {draggingPrompt && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-blue-500/10 backdrop-blur-[2px]">
                  <Upload className="h-8 w-8 text-blue-400" />
                  <p className="text-[15px] font-semibold text-blue-300">Suelta el documento aquí</p>
                  <p className="text-[12px] text-blue-400/60">.txt · .pdf · .docx · .md</p>
                </div>
              )}
              {uploadingPrompt && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                </div>
              )}
            </div>
            <p className="mt-2 text-[12px] text-white/25 leading-relaxed">
              Incluye: rol, tono, contexto del negocio, limites de respuesta y
              ejemplos de conversacion. · Arrastra un archivo o usa el botón ↑
            </p>
          </div>
        </motion.div>

        {/* 4 — Imágenes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.21 }}
          {...imagesDrag}
          className={`relative rounded-2xl ring-1 overflow-hidden transition-all ${draggingImages ? "ring-pink-400/60 bg-pink-500/5" : "bg-[#1a1a1a] ring-white/8"}`}
        >
          {draggingImages && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-pink-500/10 backdrop-blur-[2px]">
              <ImagePlus className="h-8 w-8 text-pink-400" />
              <p className="text-[15px] font-semibold text-pink-300">Suelta las imágenes aquí</p>
              <p className="text-[12px] text-pink-400/60">JPG · PNG · WebP · máx. 5MB por imagen</p>
            </div>
          )}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/15">
                <ImagePlus className="h-4 w-4 text-pink-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white leading-tight">Galería de imágenes</p>
                <p className="text-[12px] text-white/35">
                  {images.length}/{MAX_IMAGES} imágenes — título obligatorio por imagen
                </p>
              </div>
            </div>
            {images.length < MAX_IMAGES && (
              <>
                <input
                  ref={imagesFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleImagesSelected}
                />
                <button
                  onClick={() => imagesFileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-pink-500/15 px-3 py-1.5 text-[13px] font-semibold text-pink-400 ring-1 ring-pink-500/20 transition-all hover:bg-pink-500/25 active:scale-[0.97]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </button>
              </>
            )}
          </div>

          {images.length === 0 ? (
            <button
              onClick={() => imagesFileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 py-10 text-white/25 transition-colors hover:text-white/40"
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-[14px]">Arrastra o toca para agregar imágenes</span>
              <span className="text-[12px] text-white/20">JPG, PNG o WebP · máx. 5MB por imagen</span>
            </button>
          ) : (
            <div className="p-3 grid grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{ duration: 0.15 }}
                    className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5"
                  >
                    {/* Imagen */}
                    <div className="relative aspect-square">
                      <img
                        src={img.preview || img.url}
                        alt={img.title || "imagen"}
                        className="h-full w-full object-cover"
                      />
                      {img.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/60 p-2">
                          <p className="text-[11px] text-red-200 text-center">{img.error}</p>
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-white transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Título */}
                    <div className="p-2">
                      <input
                        type="text"
                        value={img.title}
                        onChange={(e) => updateImageTitle(img.id, e.target.value)}
                        placeholder="Título de la imagen…"
                        maxLength={60}
                        className={`w-full rounded-lg bg-white/6 px-2.5 py-1.5 text-[13px] text-white placeholder-white/25 outline-none ring-1 transition-all ${
                          img.url && !img.title.trim()
                            ? "ring-red-500/50 bg-red-500/5"
                            : "ring-white/10 focus:ring-pink-500/50"
                        }`}
                      />
                      {img.url && !img.title.trim() && (
                        <p className="mt-1 text-[10px] text-red-400 px-0.5">Título obligatorio</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* 5 — Catálogos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.24 }}
          {...catalogsDrag}
          className={`relative rounded-2xl ring-1 overflow-hidden transition-all ${draggingCatalogs ? "ring-teal-400/60 bg-teal-500/5" : "bg-[#1a1a1a] ring-white/8"}`}
        >
          {draggingCatalogs && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-teal-500/10 backdrop-blur-[2px]">
              <BookOpen className="h-8 w-8 text-teal-400" />
              <p className="text-[15px] font-semibold text-teal-300">Suelta los catálogos aquí</p>
              <p className="text-[12px] text-teal-400/60">Solo archivos PDF · máx. 20MB por archivo</p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15">
                <BookOpen className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white leading-tight">Catálogos PDF</p>
                <p className="text-[12px] text-white/35">
                  {catalogs.length}/{MAX_CATALOGS} catálogos — título obligatorio
                </p>
              </div>
            </div>
            {catalogs.length < MAX_CATALOGS && (
              <>
                <input
                  ref={catalogsFileRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => { handleCatalogFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
                />
                <button
                  onClick={() => catalogsFileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-500/15 px-3 py-1.5 text-[13px] font-semibold text-teal-400 ring-1 ring-teal-500/20 transition-all hover:bg-teal-500/25 active:scale-[0.97]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </button>
              </>
            )}
          </div>

          {catalogs.length === 0 ? (
            <button
              onClick={() => catalogsFileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 py-10 text-white/25 transition-colors hover:text-white/40"
            >
              <BookOpen className="h-8 w-8" />
              <span className="text-[14px]">Arrastra o toca para agregar catálogos</span>
              <span className="text-[12px] text-white/20">Solo PDF · máx. 20MB por archivo</span>
            </button>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {catalogs.map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Icono */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.uploading ? "bg-teal-500/10" : cat.error ? "bg-red-500/10" : "bg-teal-500/15"}`}>
                        {cat.uploading
                          ? <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                          : cat.error
                          ? <X className="h-5 w-5 text-red-400" />
                          : <FileCheck className="h-5 w-5 text-teal-400" />
                        }
                      </div>

                      {/* Título editable + nombre archivo */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <input
                          type="text"
                          value={cat.title}
                          onChange={(e) => updateCatalogTitle(cat.id, e.target.value)}
                          placeholder="Título del catálogo…"
                          maxLength={80}
                          className={`w-full rounded-lg bg-white/6 px-3 py-1.5 text-[14px] text-white placeholder-white/25 outline-none ring-1 transition-all ${
                            cat.url && !cat.title.trim() ? "ring-red-500/50 bg-red-500/5" : "ring-white/10 focus:ring-teal-500/50"
                          }`}
                        />
                        <p className="text-[11px] text-white/25 px-0.5 truncate">
                          {cat.error ? cat.error : cat.uploading ? "Subiendo…" : cat.fileName}
                        </p>
                        {cat.url && !cat.title.trim() && (
                          <p className="text-[11px] text-red-400 px-0.5">Título obligatorio</p>
                        )}
                      </div>

                      {/* Eliminar */}
                      <button
                        onClick={() => removeCatalog(cat.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/25 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* 6 — Contactos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.26 }}
          className="rounded-2xl bg-[#1a1a1a] ring-1 ring-white/8 overflow-hidden"
        >
          {/* Header — siempre visible */}
          <button
            type="button"
            onClick={() => setContactsCollapsed((v) => !v)}
            className="flex w-full items-center gap-3 px-4 pt-4 pb-3 text-left transition-colors hover:bg-white/4"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${contactsCollapsed ? "bg-emerald-500/15" : "bg-violet-500/15"}`}>
              {contactsCollapsed
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                : <Phone className="h-4 w-4 text-violet-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-white leading-tight">
                Contactos del sistema
              </p>
              {contactsCollapsed ? (
                <p className="text-[12px] text-emerald-400/70 mt-0.5">
                  Configurado · toca para editar
                </p>
              ) : (
                <p className="text-[12px] text-white/35">
                  Escalamiento y administración del agente
                </p>
              )}
            </div>
            {contactsCollapsed && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] text-white/30">Escalamiento</p>
                  <p className="text-[12px] text-white/55 font-medium tabular-nums">{escalationPhone.slice(0, 6)}···</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-white/30">Admin</p>
                  <p className="text-[12px] text-white/55 font-medium tabular-nums">{adminPhone.slice(0, 6)}···</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/25" />
              </div>
            )}
            {!contactsCollapsed && escalationPhone && adminPhone && (
              <ChevronUp className="h-4 w-4 text-white/25 shrink-0" />
            )}
          </button>

          {/* Formulario — colapsable */}
          <AnimatePresence initial={false}>
            {!contactsCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/6 px-4 py-4 space-y-4">
                  {/* Número de escalamiento */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-violet-400/60" />
                      <p className="text-[13px] font-semibold text-white/70">Número de escalamiento</p>
                    </div>
                    <p className="text-[12px] text-white/35 pl-5">
                      A este número se enviarán las notificaciones cuando el agente necesite escalar una conversación a un humano.
                    </p>
                    <PhoneField value={escalationPhone} onChange={setEscalationPhone} ringColor="ring-violet-500/50" />
                  </div>

                  <div className="h-px bg-white/6" />

                  {/* Número de administrador */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
                      <p className="text-[13px] font-semibold text-white/70">Número de administrador</p>
                    </div>
                    <p className="text-[12px] text-white/35 pl-5">
                      Solo este número tendrá acceso de administración al agente. Si el agente recibe un mensaje desde este número, activará los comandos de gestión y escalamiento.
                    </p>
                    <PhoneField value={adminPhone} onChange={setAdminPhone} ringColor="ring-emerald-500/50" />
                  </div>

                  {/* Guardar y colapsar */}
                  {escalationPhone && adminPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ escalationPhone, adminPhone })); } catch { /* ignore */ }
                        setContactsCollapsed(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/12 py-2.5 text-[14px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20 transition-all active:scale-[0.98] hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Guardar contactos
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                : incompleteFaqs.length > 0
                ? `${incompleteFaqs.length} pregunta${incompleteFaqs.length > 1 ? "s" : ""} sin respuesta`
                : prompt.trim().length < PROMPT_MIN
                ? `Prompt muy corto — mínimo ${PROMPT_MIN} caracteres (${PROMPT_MIN - prompt.trim().length} faltan)`
                : imagesUploading
                ? "Espera a que terminen de subir las imágenes"
                : imagesMissingTitle.length > 0
                ? `${imagesMissingTitle.length} imagen${imagesMissingTitle.length > 1 ? "es" : ""} sin título`
                : catalogsUploading
                ? "Espera a que terminen de subir los catálogos"
                : catalogsMissingTitle.length > 0
                ? `${catalogsMissingTitle.length} catálogo${catalogsMissingTitle.length > 1 ? "s" : ""} sin título`
                : !escalationPhone.trim()
                ? "Agrega el número de escalamiento"
                : "Agrega el número de administrador"}
            </p>
          )}
        </motion.div>

        <div className="h-4" />
      </div>
    </div>
  );
}
