"use client";

import React, { use, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  BarChart3,
  Globe,
  CheckCircle2,
  Bot,
  BrainCircuit,
  Users,
  Trash2,
  CreditCard,
  FileText,
  Package,
  Lock,
  Table2,
  Calendar,
  Mail,
  ShoppingBag,
  MessageSquare,
  Settings,
  CalendarDays,
  UtensilsCrossed,
  ShoppingCart,
  Building2,
  ImageIcon,
  BookOpen,
  Webhook,
  X,
  Plus,
  User,
  MessageCircle,
  Facebook,
  Instagram,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { IconWhatsApp, IconGmail, IconGoogleSheets, IconGoogleCalendar, IconWompi, IconBold, IconShopify, IconWooCommerce, IconMercadoPago } from "@/components/icons/brand-icons";
import { useAgentStore } from "@/stores/agent-store";
import { type Integration, type Agent, PLAN_INTEGRATION_LIMITS, ALGORITHM_RECOMMENDED_INTEGRATIONS, MODULE_FEATURE_MAP } from "@/lib/mock-data";
import { usePlanStore } from "@/stores/plan-store";
import type { Translations } from "@/lib/i18n/types";
import { useLocaleStore } from "@/stores/locale-store";
import { SetupWizard } from "@/components/agents/setup-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IntegrationConfigDialog } from "@/components/agents/integration-config-dialog";
import { ALGORITHM_ICONS, ALGORITHM_KEYS, REGION_KEYS, REGISTER_KEYS, REGION_FLAGS, generateEnhancedPrompt, getPreview } from "@/lib/agent-training";
import type { AlgorithmType, CommunicationRegion, CommunicationRegister, SocialLinks } from "@/lib/mock-data";
import { trainApi } from "@/lib/api";
import { Sparkles, Loader2, Phone, Zap, Power, Play, Shield } from "lucide-react";

const TRAINING_STEPS = [
  "Procesando datos del agente",
  "Configurando tono de conversación",
  "Entrenando preguntas frecuentes",
  "Cargando catálogos y recursos",
  "Conectando con WhatsApp",
  "Optimizando respuestas",
  "Verificando webhook",
  "Finalizando entrenamiento",
];
const TRAIN_DURATION = 40_000;

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  inactive: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30",
  setup: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  testing: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
};

const statusDot: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
  setup: "bg-amber-500",
  testing: "bg-blue-500",
};

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const { agents, faqs, products, integrations, conversations, deleteAgent, updateAgent, loadIntegrations, loadProducts, loadConversations, loadFaqs, addFaq, updateFaq, deleteFaq, toggleIntegration } = useAgentStore();
  const { t } = useLocaleStore();
  const { hasFeature } = usePlanStore();
  const router = useRouter();
  const agent = agents.find((a) => a.id === agentId);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null);
  const [activeQuickView, setActiveQuickView] = useState<string | null>(null);

  // ── Quick view local state ──────────────────────────────────────────────
  const [qvRegion, setQvRegion] = useState<CommunicationRegion>(agent?.communicationStyle?.region ?? "neutral");
  const [qvRegister, setQvRegister] = useState<CommunicationRegister>(agent?.communicationStyle?.register ?? "professional");
  const [qvRegionTemp, setQvRegionTemp] = useState<number>(agent?.communicationStyle?.regionTemperature ?? 2);
  const [qvExamples, setQvExamples] = useState<Array<{ id: string; userMessage: string; agentResponse: string }>>(
    (agent?.conversationExamples as Array<{ id: string; userMessage: string; agentResponse: string }>) ?? [{ id: crypto.randomUUID(), userMessage: "", agentResponse: "" }]
  );
  const [qvPrompt, setQvPrompt] = useState(agent?.systemPrompt ?? "");
  const [qvAdvancedMode, setQvAdvancedMode] = useState(false);
  const [qvIsGenerating, setQvIsGenerating] = useState(false);
  const [qvWebhookUrl, setQvWebhookUrl] = useState(agent?.webhookUrl ?? "");
  const [qvApiKey, setQvApiKey] = useState(agent?.apiKey ?? "");
  const [qvSocialLinks, setQvSocialLinks] = useState<Record<string, string>>({
    website: (agent?.socialLinks as Record<string, string>)?.website ?? "",
    facebook: (agent?.socialLinks as Record<string, string>)?.facebook ?? "",
    instagram: (agent?.socialLinks as Record<string, string>)?.instagram ?? "",
    googleMaps: (agent?.socialLinks as Record<string, string>)?.googleMaps ?? "",
    tripAdvisor: (agent?.socialLinks as Record<string, string>)?.tripAdvisor ?? "",
  });
  const [qvFaqs, setQvFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([]);
  const [qvFaqExpanded, setQvFaqExpanded] = useState<string | null>(null);
  const [qvFaqDragging, setQvFaqDragging] = useState(false);
  const [qvFaqParsing, setQvFaqParsing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainStep, setTrainStep] = useState(0);
  const [trainDone, setTrainDone] = useState(false);
  // Phone country codes with exact local digit counts
  const PHONE_COUNTRIES = [
    { code: "+57", flag: "🇨🇴", name: "Colombia", digits: 10 },
    { code: "+52", flag: "🇲🇽", name: "México", digits: 10 },
    { code: "+1", flag: "🇺🇸", name: "USA / Canadá", digits: 10 },
    { code: "+34", flag: "🇪🇸", name: "España", digits: 9 },
    { code: "+54", flag: "🇦🇷", name: "Argentina", digits: 10 },
    { code: "+56", flag: "🇨🇱", name: "Chile", digits: 9 },
    { code: "+51", flag: "🇵🇪", name: "Perú", digits: 9 },
    { code: "+593", flag: "🇪🇨", name: "Ecuador", digits: 9 },
    { code: "+58", flag: "🇻🇪", name: "Venezuela", digits: 10 },
    { code: "+507", flag: "🇵🇦", name: "Panamá", digits: 8 },
    { code: "+506", flag: "🇨🇷", name: "Costa Rica", digits: 8 },
    { code: "+502", flag: "🇬🇹", name: "Guatemala", digits: 8 },
    { code: "+55", flag: "🇧🇷", name: "Brasil", digits: 11 },
    { code: "+44", flag: "🇬🇧", name: "Reino Unido", digits: 10 },
  ] as const;

  // Parse existing phone into country code + local number
  function parsePhone(full: string) {
    if (!full) return { code: "+57", local: "" };
    for (const c of PHONE_COUNTRIES) {
      if (full.startsWith(c.code)) {
        return { code: c.code, local: full.slice(c.code.length).replace(/\D/g, "") };
      }
    }
    return { code: "+57", local: full.replace(/\D/g, "") };
  }

  const parsedAdmin = parsePhone(agent?.adminPhone ?? "");
  const parsedEscalation = parsePhone(agent?.escalationPhone ?? "");
  const [adminCountry, setAdminCountry] = useState(parsedAdmin.code);
  const [adminLocal, setAdminLocal] = useState(parsedAdmin.local);
  const [escalationCountry, setEscalationCountry] = useState(parsedEscalation.code);
  const [escalationLocal, setEscalationLocal] = useState(parsedEscalation.local);
  const [showAdminCountryPicker, setShowAdminCountryPicker] = useState(false);
  const [showEscalationCountryPicker, setShowEscalationCountryPicker] = useState(false);

  const getCountry = (code: string) => PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
  const adminDigits = getCountry(adminCountry).digits;
  const escalationDigits = getCountry(escalationCountry).digits;
  const adminPhoneFull = adminLocal.length === adminDigits ? `${adminCountry}${adminLocal}` : "";
  const escalationPhoneFull = escalationLocal.length === escalationDigits ? `${escalationCountry}${escalationLocal}` : "";

  useEffect(() => {
    loadIntegrations(agentId);
    loadProducts(agentId);
    loadConversations(agentId);
    loadFaqs(agentId);
  }, [agentId, loadIntegrations, loadProducts, loadConversations, loadFaqs]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t.agents.agentNotFound}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {t.agents.agentNotFoundDescription}
        </p>
        <Button asChild variant="outline">
          <Link href="/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.agents.backToAgents}
          </Link>
        </Button>
      </div>
    );
  }

  // Setup wizard removed — now uses progressive unlock flow below

  const statusLabels: Record<string, string> = {
    active: "Activo — respondiendo mensajes",
    inactive: "Pausado — no responde",
    setup: "Configurando",
    testing: "Modo prueba",
  };

  // ── Computed state ──────────────────────────────────────────────────────────
  const agentFaqs = faqs.filter((f) => f.agentId === agentId);
  const agentProducts = products.filter((p) => p.agentId === agentId);
  const hasProducts = agentProducts.length > 0;
  const pendingHuman = conversations.filter(
    (c) => c.agentId === agentId && c.status === "human_handling"
  ).length;

  // Step completeness flags
  const hasType = !!agent.algorithmType;
  const hasPersonality = hasType && !!agent.communicationStyle && !!agent.conversationExamples && agent.conversationExamples.length > 0;
  const hasPrompt = !!agent.systemPrompt && agent.systemPrompt.length >= 50;
  const hasFaqs = agent.faqCount > 0 || agentFaqs.length > 0;
  const hasWebhook = !!agent.webhookUrl;
  const hasSocial = agent.socialLinks && Object.values(agent.socialLinks).some((v) => v && v.trim());

  // ── Quality score ─────────────────────────────────────────────────────────
  function getQualityScore(a: Agent) {
    let score = 0;
    if (a.algorithmType) score += 15;                                            // Tipo (15)
    if (a.communicationStyle) score += 10;                                       // Estilo comm (10)
    const ex = a.conversationExamples;
    if (ex && ex.length > 0) score += Math.min(ex.length / 3, 1) * 10;          // Ejemplos (10)
    if (a.systemPrompt && a.systemPrompt.length >= 50) score += 15;             // Prompt (15)
    score += Math.min(a.faqCount / 10, 1) * 20;                                 // FAQs (20)
    if (a.webhookUrl) score += 10;                                               // Webhook (10)
    if (a.socialLinks && Object.values(a.socialLinks).some(Boolean)) score += 10;// Social (10)
    if (a.productCount > 0 || (a.catalogs as any[])?.length > 0) score += 10;     // Productos (10)
    return Math.round(score);
  }
  const qualityScore = getQualityScore(agent);
  const qualityLabel = qualityScore >= 80 ? "Alta" : qualityScore >= 50 ? "Media" : "Baja";
  const qualityColor = qualityScore >= 80 ? "text-emerald-500" : qualityScore >= 50 ? "text-amber-500" : "text-rose-400";
  const qualityBarColor = qualityScore >= 80 ? "bg-emerald-500" : qualityScore >= 50 ? "bg-amber-400" : "bg-rose-400";

  // ── Module-specific slots (depend on algorithmType) ───────────────────────
  const moduleSlots = (() => {
    switch (agent.algorithmType) {
      case "hotel":
        return [
          { id: "rooms", label: "Habitaciones", icon: Building2, href: `/agents/${agentId}/products`, configured: hasProducts, stat: hasProducts ? `${agentProducts.length}` : "", color: "violet" },
          { id: "reservations", label: "Reservas", icon: CalendarDays, href: `/agents/${agentId}/reservations`, configured: true, stat: "", color: "blue" },
        ];
      case "appointments":
        return [
          { id: "services", label: "Servicios", icon: ShoppingBag, href: `/agents/${agentId}/products`, configured: hasProducts, stat: hasProducts ? `${agentProducts.length}` : "", color: "violet" },
          { id: "reservations", label: "Citas", icon: CalendarDays, href: `/agents/${agentId}/reservations`, configured: true, stat: "", color: "blue" },
        ];
      case "restaurant":
        return [
          { id: "menu", label: "Menú", icon: UtensilsCrossed, href: `/agents/${agentId}/menu`, configured: true, stat: "", color: "red" },
          { id: "reservations", label: "Reservas", icon: CalendarDays, href: `/agents/${agentId}/reservations`, configured: true, stat: "", color: "blue" },
        ];
      case "ecommerce":
      case "whatsapp-store":
        return [
          { id: "products", label: "Catálogo", icon: ShoppingBag, href: `/agents/${agentId}/products`, configured: hasProducts, stat: hasProducts ? `${agentProducts.length}` : "", color: "violet" },
          { id: "orders", label: "Pedidos", icon: ShoppingCart, href: `/agents/${agentId}/orders`, configured: true, stat: "", color: "blue" },
        ];
      case "inmobiliaria":
        return [
          { id: "properties", label: "Propiedades", icon: Building2, href: `/agents/${agentId}/properties`, configured: true, stat: "", color: "teal" },
        ];
      default:
        return [];
    }
  })();

  // Module-specific deploy steps
  const moduleDeploySteps = (() => {
    switch (agent.algorithmType) {
      case "hotel":
        return [{ id: "rooms", title: "Habitaciones", description: hasProducts ? `${agentProducts.length} configuradas` : "Agrega habitaciones del hotel", done: hasProducts, href: `/agents/${agentId}/products` }];
      case "restaurant":
        return [{ id: "menu", title: "Menú", description: "Configura los platos del restaurante", done: true, href: `/agents/${agentId}/menu` }];
      case "ecommerce":
      case "whatsapp-store":
        return [{ id: "products", title: "Catálogo de productos", description: hasProducts ? `${agentProducts.length} productos` : (agent.catalogs as any[])?.length > 0 ? `${(agent.catalogs as any[]).length} catálogo(s) PDF` : "Agrega tus productos", done: hasProducts || ((agent.catalogs as any[])?.length ?? 0) > 0, href: `/agents/${agentId}/products` }];
      default:
        return [];
    }
  })();

  // ── Algorithm translation keys ─────────────────────────────────────────────
  const algorithmTranslationKeys: Record<AlgorithmType, keyof typeof t.personalityBuilder.algorithms> = {
    ecommerce: "ecommerce",
    appointments: "appointments",
    "whatsapp-store": "whatsappStore",
    hotel: "hotel",
    restaurant: "restaurant",
    inmobiliaria: "inmobiliaria",
  };

  function handleSelectAlgorithm(key: AlgorithmType) {
    updateAgent(agent!.id, { algorithmType: key });
    setActiveQuickView(null);
    toast.success(`Tipo de negocio: ${t.personalityBuilder.algorithms[algorithmTranslationKeys[key]].name}`);
  }

  async function handleTrain() {
    setIsTraining(true);
    setTrainProgress(0);
    setTrainStep(0);

    // Call backend deploy endpoint (sends training payload to n8n)
    trainApi.deploy(agent!.id).catch((err) => {
      console.error("Deploy error:", err);
    });

    // Animate progress
    const stepInterval = TRAIN_DURATION / TRAINING_STEPS.length;
    const progressInterval = setInterval(() => {
      setTrainProgress((p) => Math.min(p + 100 / (TRAIN_DURATION / 200), 100));
    }, 200);
    const stepTimer = setInterval(() => {
      setTrainStep((s) => {
        const next = s + 1;
        if (next >= TRAINING_STEPS.length) clearInterval(stepTimer);
        return Math.min(next, TRAINING_STEPS.length - 1);
      });
    }, stepInterval);

    setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(stepTimer);
      setTrainProgress(100);
      updateAgent(agentId, { trainedAt: new Date().toISOString(), status: "testing" as any }).catch(() => {});
      setTimeout(() => setTrainDone(true), 500);
    }, TRAIN_DURATION);
  }

  function handleTrainClose() {
    setIsTraining(false);
    setTrainDone(false);
  }

  function openQuickView(id: string) {
    // Sync local state from agent before opening
    if (id === "personality") {
      setQvRegion(agent!.communicationStyle?.region ?? "neutral");
      setQvRegister(agent!.communicationStyle?.register ?? "professional");
      setQvRegionTemp(agent!.communicationStyle?.regionTemperature ?? 2);
      const saved = agent!.conversationExamples as Array<{ id: string; userMessage: string; agentResponse: string }> | undefined;
      setQvExamples(saved && saved.length > 0 ? saved : [{ id: crypto.randomUUID(), userMessage: "", agentResponse: "" }]);
    } else if (id === "prompt") {
      setQvPrompt(agent!.systemPrompt ?? "");
      setQvAdvancedMode(false);
    } else if (id === "webhook") {
      setQvWebhookUrl(agent!.webhookUrl ?? "");
      setQvApiKey(agent!.apiKey ?? "");
    } else if (id === "faqs") {
      const existing = faqs.filter((f) => f.agentId === agentId);
      setQvFaqs(existing.map((f) => ({ id: f.id, question: f.question, answer: f.answer })));
      setQvFaqExpanded(null);
    } else if (id === "social") {
      const links = agent!.socialLinks as Record<string, string> | undefined;
      setQvSocialLinks({
        website: links?.website ?? "",
        facebook: links?.facebook ?? "",
        instagram: links?.instagram ?? "",
        googleMaps: links?.googleMaps ?? "",
        tripAdvisor: links?.tripAdvisor ?? "",
      });
    } else if (id === "phones") {
      const pAdmin = parsePhone(agent!.adminPhone ?? "");
      const pEsc = parsePhone(agent!.escalationPhone ?? "");
      setAdminCountry(pAdmin.code);
      setAdminLocal(pAdmin.local);
      setEscalationCountry(pEsc.code);
      setEscalationLocal(pEsc.local);
      setShowAdminCountryPicker(false);
      setShowEscalationCountryPicker(false);
    }
    setActiveQuickView(id);
  }

  function handleSavePhones() {
    updateAgent(agent!.id, {
      adminPhone: adminPhoneFull || null,
      escalationPhone: escalationPhoneFull || null,
    } as any);
    setActiveQuickView(null);
    toast.success("Teléfonos guardados");
    if (agent!.trainedAt) {
      trainApi.update(agent!.id, "phones").catch(console.error);
    }
  }

  function handleSavePersonality() {
    const validExamples = qvExamples.filter((e) => e.userMessage.trim() && e.agentResponse.trim());
    updateAgent(agent!.id, {
      communicationStyle: { region: qvRegion, register: qvRegister, regionTemperature: qvRegionTemp },
      conversationExamples: validExamples,
    });
    setActiveQuickView(null);
    toast.success("Personalidad guardada");
    if (agent!.trainedAt) {
      trainApi.update(agent!.id, "prompt").catch(console.error);
    }
  }

  // --- Drag & drop for conversation examples ---
  const [draggingExamples, setDraggingExamples] = useState(false);
  const [uploadingExamples, setUploadingExamples] = useState(false);
  const examplesFileRef = useRef<HTMLInputElement>(null);

  const processExamplesFile = useCallback(async (file: File) => {
    setUploadingExamples(true);
    try {
      const text = await extractTextFromFile(file);
      // Parse conversation pairs from text
      const parsed: { userMessage: string; agentResponse: string }[] = [];
      // Try Cliente:/Agente: or P:/R: pairs
      const pairRegex = /(?:Cliente|Customer|User|Pregunta|P)[:\.\-]\s*(.+?)\n(?:Agente|Agent|Bot|Respuesta|R)[:\.\-]\s*([\s\S]+?)(?=\n(?:Cliente|Customer|User|Pregunta|P)[:\.\-]|$)/gi;
      let match;
      while ((match = pairRegex.exec(text)) !== null) {
        parsed.push({ userMessage: match[1].trim(), agentResponse: match[2].trim() });
      }
      // Fallback: lines with "?" are questions
      if (parsed.length === 0) {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].endsWith("?") && i + 1 < lines.length) {
            parsed.push({ userMessage: lines[i], agentResponse: lines[i + 1] });
            i++;
          }
        }
      }
      // Last fallback: pairs of lines
      if (parsed.length === 0) {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        for (let i = 0; i + 1 < lines.length; i += 2) {
          parsed.push({ userMessage: lines[i], agentResponse: lines[i + 1] });
        }
      }
      if (parsed.length === 0) {
        toast.error("No se encontraron ejemplos. Usa formato Cliente:/Agente: o pregunta/respuesta.");
        return;
      }
      setQvExamples(parsed.map((e) => ({ ...e, id: crypto.randomUUID() })));
      toast.success(`${parsed.length} ejemplo${parsed.length !== 1 ? "s" : ""} importado${parsed.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Error al leer el archivo");
    } finally {
      setUploadingExamples(false);
    }
  }, []);

  const examplesDrag = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDraggingExamples(true); },
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); setDraggingExamples(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDraggingExamples(false); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingExamples(false);
      const file = e.dataTransfer.files[0];
      if (file) processExamplesFile(file);
    },
  };

  async function handleGeneratePrompt() {
    setQvIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const hasSocialLinks = agent!.socialLinks ? Object.values(agent!.socialLinks).some((v) => v && v.trim()) : false;
    const generated = generateEnhancedPrompt(
      agent!,
      agent!.faqCount,
      agent!.productCount,
      hasSocialLinks,
      agent!.algorithmType ?? "hotel",
      agent!.communicationStyle?.region ?? "neutral",
      agent!.communicationStyle?.register ?? "professional"
    );
    setQvPrompt(generated);
    setQvIsGenerating(false);
  }

  async function handlePromptFileUpload(file: File) {
    setQvIsGenerating(true);
    try {
      const text = await extractTextFromFile(file);
      if (text.trim()) {
        setQvPrompt((prev) => prev ? prev + "\n\n" + text.trim() : text.trim());
        setQvAdvancedMode(true);
        toast.success(`Contenido importado desde ${file.name}`);
      } else {
        toast.error("El archivo está vacío");
      }
    } catch {
      toast.error("Error al leer el archivo");
    }
    setQvIsGenerating(false);
  }

  function handleSavePrompt() {
    updateAgent(agent!.id, { personality: qvPrompt.trim(), systemPrompt: qvPrompt.trim() });
    setActiveQuickView(null);
    toast.success("Prompt guardado");
    if (agent!.trainedAt) {
      trainApi.update(agent!.id, "prompt").catch(console.error);
    }
  }

  function handleSaveWebhook() {
    updateAgent(agent!.id, { webhookUrl: qvWebhookUrl.trim() || null, apiKey: qvApiKey.trim() || null });
    setActiveQuickView(null);
    toast.success("Webhook guardado");
  }

  function handleSaveSocial() {
    updateAgent(agent!.id, { socialLinks: qvSocialLinks });
    setActiveQuickView(null);
    toast.success("Redes sociales guardadas");
    if (agent!.trainedAt) {
      trainApi.update(agent!.id, "social_links").catch(console.error);
    }
  }

  async function extractTextFromFile(file: File): Promise<string> {
    const name = file.name.toLowerCase();

    if (name.endsWith(".docx")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth/mammoth.browser");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
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

    return await file.text();
  }

  async function handleFaqFileUpload(file: File) {
    setQvFaqParsing(true);
    try {
      const text = await extractTextFromFile(file);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const parsed: Array<{ id: string; question: string; answer: string }> = [];

      // Try CSV-style: "question","answer" or question;answer or question,answer
      // Also try line pairs: odd lines = question, even lines = answer
      // Also try Q: / A: format or Pregunta: / Respuesta:
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        // CSV with separator
        const csvMatch = line.match(/^["']?(.+?)["']?\s*[;,|]\s*["']?(.+?)["']?$/);
        if (csvMatch && csvMatch[1] && csvMatch[2]) {
          parsed.push({ id: crypto.randomUUID(), question: csvMatch[1].trim(), answer: csvMatch[2].trim() });
          i++;
          continue;
        }
        // Q:/A: or Pregunta:/Respuesta: format
        const qMatch = line.match(/^(?:Q|Pregunta|P)\s*[:.\-]\s*(.+)/i);
        if (qMatch && i + 1 < lines.length) {
          const aMatch = lines[i + 1].trim().match(/^(?:A|R|Respuesta)\s*[:.\-]\s*(.+)/i);
          if (aMatch) {
            parsed.push({ id: crypto.randomUUID(), question: qMatch[1].trim(), answer: aMatch[1].trim() });
            i += 2;
            continue;
          }
        }
        // Line pairs fallback: question line then answer line
        if (line.endsWith("?") && i + 1 < lines.length) {
          parsed.push({ id: crypto.randomUUID(), question: line, answer: lines[i + 1].trim() });
          i += 2;
          continue;
        }
        // Single line as question with empty answer
        if (line.length > 5) {
          parsed.push({ id: crypto.randomUUID(), question: line, answer: "" });
        }
        i++;
      }

      if (parsed.length > 0) {
        setQvFaqs((prev) => [...prev, ...parsed]);
        toast.success(`${parsed.length} pregunta${parsed.length !== 1 ? "s" : ""} importada${parsed.length !== 1 ? "s" : ""} desde ${file.name}`);
      } else {
        toast.error("No se encontraron preguntas en el archivo");
      }
    } catch {
      toast.error("Error al leer el archivo");
    }
    setQvFaqParsing(false);
  }

  function handleFaqDrop(e: React.DragEvent) {
    e.preventDefault();
    setQvFaqDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFaqFileUpload(file);
  }

  // ── Deploy steps (quality checklist) ──────────────────────────────────────
  const deploySteps: Array<{ id: string; title: string; description: string; done: boolean; href: string; onClick?: () => void }> = [
    {
      id: "type",
      title: "Tipo de negocio",
      description: hasType ? `${t.personalityBuilder.algorithms[algorithmTranslationKeys[agent.algorithmType!]]?.name ?? agent.algorithmType} configurado` : "Selecciona el tipo de agente",
      done: hasType,
      href: "#",
      onClick: hasType ? undefined : () => setActiveQuickView("type"),
    },
    ...(hasType ? [
      {
        id: "personality",
        title: "Personalidad del agente",
        description: hasPersonality ? "Estilo y ejemplos configurados" : "Configura el estilo y ejemplos de conversación",
        done: hasPersonality,
        href: "#",
        onClick: () => openQuickView("personality"),
      },
      {
        id: "prompt",
        title: "Prompt del agente",
        description: hasPrompt ? "Instrucciones configuradas" : "Define las instrucciones del agente",
        done: hasPrompt,
        href: "#",
        onClick: () => openQuickView("prompt"),
      },
      {
        id: "faqs",
        title: "Preguntas frecuentes",
        description: agent.faqCount > 0
          ? `${agent.faqCount} FAQs cargadas`
          : "Agrega las preguntas frecuentes",
        done: hasFaqs,
        href: "#",
        onClick: () => openQuickView("faqs"),
      },
      ...moduleDeploySteps.map((s) => ({ ...s, onClick: () => router.push(s.href) })),
      {
        id: "phones",
        title: "Teléfonos de contacto",
        description: agent.adminPhone ? "Admin y escalamiento configurados" : "Número admin y escalamiento",
        done: !!agent.adminPhone && !!agent.escalationPhone,
        href: "#",
        onClick: () => openQuickView("phones"),
      },
      {
        id: "webhook",
        title: "Webhook",
        description: hasWebhook ? "Endpoint configurado" : "Configura el webhook de salida",
        done: hasWebhook,
        href: "#",
        onClick: () => openQuickView("webhook"),
      },
      {
        id: "social",
        title: "Web y redes sociales",
        description: hasSocial ? "Perfiles configurados" : "Agrega tu sitio o perfiles",
        done: !!hasSocial,
        href: "#",
        onClick: () => openQuickView("social"),
      },
    ] : []),
  ];
  const completedDeployCount = deploySteps.filter((s) => s.done).length;
  const allDeployed = completedDeployCount === deploySteps.length;

  // ── Story circles (progressive unlock) ────────────────────────────────────
  const storyItems = [
    // 1. Tipo de negocio (always visible — entry point)
    {
      id: "type",
      label: "Tipo de negocio",
      icon: BrainCircuit,
      href: "#",
      configured: hasType,
      stat: "",
      color: hasType ? "emerald" : "orange",
      onClick: hasType ? undefined : () => setActiveQuickView("type"),
    },
    // Unlocked after type is selected — same order as deploySteps
    ...(hasType ? [
      // 2. Personalidad
      {
        id: "personality",
        label: "Personalidad",
        icon: Bot,
        href: "#",
        configured: hasPersonality,
        stat: "",
        color: hasPersonality ? "emerald" : "orange",
        onClick: () => openQuickView("personality"),
      },
      // 3. Prompt
      {
        id: "prompt",
        label: "Prompt",
        icon: FileText,
        href: "#",
        configured: hasPrompt,
        stat: "",
        color: hasPrompt ? "emerald" : "orange",
        onClick: () => openQuickView("prompt"),
      },
      // 4. FAQs
      {
        id: "faqs",
        label: t.agents.setupCards.faqsTitle,
        icon: HelpCircle,
        href: "#",
        configured: hasFaqs,
        stat: agent.faqCount > 0 ? `${agent.faqCount}` : "",
        color: hasFaqs ? "emerald" : "amber",
        onClick: () => openQuickView("faqs"),
      },
      // 5. Module-specific (rooms, menu, products, etc.)
      ...moduleSlots,
      // 6. Teléfonos
      {
        id: "phones",
        label: "Teléfonos",
        icon: Phone,
        href: "#",
        configured: !!agent.adminPhone && !!agent.escalationPhone,
        stat: "",
        color: (agent.adminPhone && agent.escalationPhone) ? "emerald" : "orange",
        onClick: () => openQuickView("phones"),
      },
      // 7. Webhook
      {
        id: "webhook",
        label: "Webhook",
        icon: Webhook,
        href: "#",
        configured: hasWebhook,
        stat: "",
        color: hasWebhook ? "emerald" : "orange",
        onClick: () => openQuickView("webhook"),
      },
      // 8. Social
      {
        id: "social",
        label: t.agents.setupCards.socialTitle,
        icon: Globe,
        href: "#",
        configured: !!hasSocial,
        stat: "",
        color: hasSocial ? "emerald" : "pink",
        onClick: () => openQuickView("social"),
      },
    ] : []),
    // Always visible
    {
      id: "settings",
      label: "Configuración",
      icon: Settings,
      href: `/agents/${agentId}/settings`,
      configured: true,
      stat: "",
      color: "slate",
    },
  ];

  const storyColorMap: Record<string, { circle: string; icon: string }> = {
    amber: { circle: "bg-amber-100 dark:bg-amber-500/20", icon: "text-amber-600 dark:text-amber-400" },
    blue: { circle: "bg-blue-100 dark:bg-blue-500/20", icon: "text-blue-600 dark:text-blue-400" },
    lisa: { circle: "bg-gradient-to-br from-orange-400 to-orange-600", icon: "text-white" },
    whatsapp: { circle: "bg-[#25D366]", icon: "text-white" },
    rose: { circle: "bg-rose-100 dark:bg-rose-500/20", icon: "text-rose-600 dark:text-rose-400" },
    emerald: { circle: "bg-emerald-100 dark:bg-emerald-500/20", icon: "text-emerald-600 dark:text-emerald-400" },
    orange: { circle: "bg-orange-100 dark:bg-orange-500/20", icon: "text-orange-600 dark:text-orange-400" },
    violet: { circle: "bg-violet-100 dark:bg-violet-500/20", icon: "text-violet-600 dark:text-violet-400" },
    gray: { circle: "bg-gray-100 dark:bg-white/10", icon: "text-gray-600 dark:text-gray-400" },
    slate: { circle: "bg-slate-100 dark:bg-slate-500/20", icon: "text-slate-600 dark:text-slate-400" },
    white: { circle: "bg-white dark:bg-white/10 border border-border", icon: "text-gray-700 dark:text-gray-300" },
    pink: { circle: "bg-pink-100 dark:bg-pink-500/20", icon: "text-pink-500 dark:text-pink-400" },
    red: { circle: "bg-red-100 dark:bg-red-500/20", icon: "text-red-600 dark:text-red-400" },
    teal: { circle: "bg-teal-100 dark:bg-teal-500/20", icon: "text-teal-600 dark:text-teal-400" },
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring" as const, stiffness: 380, damping: 30, delay },
  });

  return (
    <div className="space-y-5 pb-24 lg:pb-8 lg:max-w-[800px] lg:mx-auto">
      {/* Back */}
      <motion.div {...fadeUp(0)}>
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/agents">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t.agents.backToAgents}
        </Link>
      </Button>
      </motion.div>

      {/* Agent Hero Card */}
      <motion.div {...fadeUp(0.06)} className="relative rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Badge estado configurando — esquina superior derecha */}
        {agent.status === "setup" && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
              <Settings className="h-3 w-3" />
              Configurando
            </span>
          </div>
        )}
        {/* Fila 1: identidad — tappable → settings */}
        <Link
          href={`/agents/${agentId}/settings`}
          className="flex items-center gap-3 px-4 pt-4 pb-3 active:bg-muted/40 transition-colors"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-sm bg-neutral-700 dark:bg-neutral-600">
            {agent.avatar ? (
              <img src={agent.avatar} alt={agent.name} className="h-full w-full object-cover" />
            ) : (
              <Bot className="h-6 w-6 text-neutral-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[19px] font-bold tracking-tight truncate">{agent.name}</h1>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[agent.status]}`} />
            </div>
            <p className="text-[15px] text-muted-foreground truncate">{agent.hotelName}</p>
          </div>
          {agent.status !== "setup" && (
            <Settings className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          )}
        </Link>
        {/* Fila 2: controles de estado — visible cuando ya fue entrenado */}
        {agent.trainedAt && (
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-3">
            {/* Toggle encendido/apagado */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const next = agent.status === "inactive" ? "testing" : "inactive";
                  updateAgent(agentId, { status: next as any });
                  toast.success(next === "inactive" ? "Agente apagado" : "Agente encendido");
                  trainApi.changeMode(agentId, next).catch(console.error);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  agent.status !== "inactive" ? "bg-emerald-500" : "bg-muted-foreground/25"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  agent.status !== "inactive" ? "translate-x-[18px]" : "translate-x-0.5"
                }`} />
              </button>
              <span className={`text-[13px] font-medium ${
                agent.status !== "inactive" ? "text-emerald-500" : "text-muted-foreground"
              }`}>
                {agent.status === "inactive" ? "Apagado" : "Encendido"}
              </span>
            </div>

            {/* Selector modo: Pruebas / Producción */}
            {agent.status !== "inactive" && (
              <div className="flex items-center bg-muted/60 rounded-lg p-0.5 gap-0.5">
                {([
                  { key: "testing", label: "Pruebas" },
                  { key: "active", label: "Producción" },
                ] as const).map((mode) => {
                  const isActive = mode.key === "testing"
                    ? (agent.status === "testing" || agent.status === "setup")
                    : agent.status === mode.key;
                  return (
                    <button
                      key={mode.key}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isActive) return;
                        updateAgent(agentId, { status: mode.key as any });
                        toast.success(mode.key === "testing" ? "Modo pruebas — solo responde al admin" : "En producción — responde a todos");
                        trainApi.changeMode(agentId, mode.key).catch(console.error);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                        isActive
                          ? mode.key === "testing"
                            ? "bg-blue-500/15 text-blue-400 shadow-sm"
                            : "bg-emerald-500/15 text-emerald-400 shadow-sm"
                          : "text-muted-foreground/60 hover:text-muted-foreground"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Calidad + Pasos — tarjeta unificada */}
      <motion.div {...fadeUp(0.12)} className="rounded-2xl bg-[#1a1a1a] dark:bg-[#111] ring-1 ring-white/8 shadow-[0_2px_16px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* Header: score + nivel */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">Calidad del agente</p>
            <p className="text-[13px] text-white/40 mt-0.5">
              {completedDeployCount} de {deploySteps.length} pasos completados
            </p>
          </div>
          <div className="flex items-end gap-0.5">
            <span className={`text-[30px] font-bold tabular-nums leading-none ${qualityColor}`}>{qualityScore}</span>
            <span className="text-[14px] text-white/35 mb-1">/ 100</span>
          </div>
        </div>
        {/* Barra de calidad */}
        <div className="mx-4 mb-3.5">
          <div className="h-[3px] rounded-full bg-white/15 overflow-hidden">
            <div
              className={`h-full rounded-full ${qualityBarColor} transition-all duration-700`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
          <p className={`text-[13px] font-semibold mt-1 ${qualityColor}`}>{qualityLabel}</p>
        </div>
        {/* Stepper vertical */}
        <div className="border-t border-white/8 px-4 py-4">
          <div className="relative">
            {deploySteps.map((step, idx) => {
              const isLast = idx === deploySteps.length - 1;
              const stepNumber = idx + 1;
              const filledUpTo = deploySteps.findIndex((s) => !s.done);
              const isFilled = filledUpTo === -1 ? true : idx < filledUpTo;

              const stepContent = (
                <>
                  {/* Left column: circle + line */}
                  <div className="flex flex-col items-center shrink-0 w-8">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-500 ${
                        step.done
                          ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                          : isFilled
                          ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40"
                          : "bg-white/8 text-white/40 ring-1 ring-white/15"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    {!isLast && (
                      <div className="relative w-[2px] flex-1 min-h-[16px] bg-white/10 my-0.5">
                        <div
                          className="absolute inset-x-0 top-0 bg-emerald-500 transition-all duration-700 rounded-full"
                          style={{ height: step.done ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Right column: content */}
                  <div className={`flex-1 min-w-0 pb-5 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-center justify-between gap-2 min-h-[32px]">
                      <div className="flex-1 min-w-0 flex items-center">
                        <p className={`text-[15px] font-medium leading-tight ${step.done ? "text-white/40" : "text-white/90"}`}>
                          {step.title}
                        </p>
                        {step.id === "type" && step.done && (
                          <Lock className="h-3 w-3 text-white/25 ml-1.5" />
                        )}
                      </div>
                      {step.done ? (
                        <span className="text-[12px] font-semibold text-emerald-400 shrink-0">Listo</span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-white/25 shrink-0 group-active:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                    <p className="text-[13px] text-white/35 mt-0.5 leading-snug">{step.description}</p>
                  </div>
                </>
              );

              // Use button with onClick if step has onClick handler, otherwise Link
              if (step.onClick) {
                return (
                  <button
                    key={step.id}
                    onClick={step.onClick}
                    className="flex gap-3 group relative w-full text-left"
                  >
                    {stepContent}
                  </button>
                );
              }
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className="flex gap-3 group relative"
                >
                  {stepContent}
                </Link>
              );
            })}
          </div>
        </div>
        {/* Botones de estado — progresivo */}
        <div className="px-4 py-3 border-t border-white/8 space-y-3">
          {!allDeployed ? (
            <div className="w-full rounded-xl py-3 text-center text-[15px] font-semibold bg-white/6 text-white/25 cursor-not-allowed">
              Completa los pasos para entrenar
            </div>
          ) : (
            <button
              onClick={handleTrain}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[16px] font-semibold shadow-sm transition-all ${
                agent.trainedAt
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 active:bg-emerald-500/20"
                  : "bg-orange-500 text-white active:bg-orange-600"
              }`}
            >
              <Zap className="h-5 w-5" />
              {agent.trainedAt ? "Re-entrenar agente" : "Entrenar agente"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Stories bar — 3 columnas, solo configurados, espacio libre a la derecha */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 8px" }}>
        {storyItems.filter((item) => item.configured || item.id === "settings").map((item, index) => {
          const storyColors = storyColorMap[item.color];
          const circleStyle = item.configured ? storyColors.circle : "bg-muted";
          const iconStyle = item.configured ? storyColors.icon : "text-muted-foreground";
          const StoryIcon = item.icon;
          const isNumericStat = item.stat !== "" && !isNaN(Number(item.stat));
          const isWhatsapp = item.id === "whatsapp";
          const rf = (item as { requiredFeature?: string }).requiredFeature;
          const isModuleLocked = !!rf && !hasFeature(rf as Parameters<typeof hasFeature>[0]);
          const itemOnClick = (item as { onClick?: () => void }).onClick;
          const Wrapper = itemOnClick
            ? ({ children, className }: { children: React.ReactNode; className: string }) => (
                <button onClick={itemOnClick} className={className}>{children}</button>
              )
            : ({ children, className }: { children: React.ReactNode; className: string }) => (
                <Link href={item.href} className={className}>{children}</Link>
              );
          return (
            <div key={item.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 30, delay: index * 0.045 }}
              >
              <Wrapper
                className="flex flex-col items-center gap-1.5 active:opacity-70 transition-opacity w-full"
              >
                <div className="relative">
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center ${isModuleLocked ? "bg-muted" : circleStyle}`}
                  >
                    {isWhatsapp ? (
                      <IconWhatsApp className={`h-7 w-7 ${isModuleLocked ? "text-muted-foreground" : iconStyle}`} />
                    ) : StoryIcon ? (
                      <StoryIcon className={`h-6 w-6 ${isModuleLocked ? "text-muted-foreground" : iconStyle}`} />
                    ) : null}
                    {isModuleLocked && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/20">
                        <Lock className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  {isNumericStat && (
                    <span className={`absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[12px] font-bold tabular-nums ring-2 ring-background ${
                      item.id === "chat" ? "bg-amber-500 text-white" : "bg-foreground text-background"
                    }`}>
                      {item.stat}
                    </span>
                  )}
                  {item.configured && !isNumericStat && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-muted-foreground text-center leading-tight max-w-[72px]">
                  {item.label}
                </span>
              </Wrapper>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Integrations Section */}
      <motion.div {...fadeUp(0.28)}>
      <IntegrationsSection
        integrations={integrations}
        onToggle={toggleIntegration}
        onConfigure={setConfigIntegration}
        t={t}
        agent={agent}
      />
      </motion.div>

      {/* Integration Config Dialog */}
      <IntegrationConfigDialog
        integration={configIntegration}
        open={!!configIntegration}
        onOpenChange={(open) => { if (!open) setConfigIntegration(null); }}
      />

      {/* Delete Agent - iOS action sheet style */}
      <motion.div {...fadeUp(0.34)} className="pt-4">
        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            className="w-full rounded-2xl bg-card px-4 py-3.5 text-[17px] font-medium text-red-500 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] active:bg-red-50"
          >
            {t.agentSettings.deleteAgent}
          </button>
        )}

        {deleteStep === 1 && (
          <div className="rounded-2xl bg-card ring-1 ring-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-5 py-4 text-center border-b border-border">
              <p className="text-[17px] font-semibold">{t.agentSettings.deleteConfirmTitle}</p>
              <p className="text-[15px] text-muted-foreground mt-1">
                {t.agentSettings.deleteConfirmDescription}
              </p>
            </div>
            <button
              onClick={() => setDeleteStep(2)}
              className="w-full px-4 py-3 text-[17px] font-medium text-red-500 border-b border-border transition-colors active:bg-red-50"
            >
              {t.agentSettings.deletePermanently}
            </button>
            <button
              onClick={() => setDeleteStep(0)}
              className="w-full px-4 py-3 text-[17px] font-medium text-orange-600 transition-colors active:bg-orange-50"
            >
              {t.common.cancel}
            </button>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="rounded-2xl bg-white ring-1 ring-red-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-5 py-4 text-center border-b border-red-100 bg-red-50/50">
              <Trash2 className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-[16px] font-semibold text-red-600">
                {t.agentSettings.deleteConfirmTitle}
              </p>
              <p className="text-[14px] text-red-500/80 mt-0.5">
                {t.agentSettings.deleteConfirmDescription}
              </p>
            </div>
            <button
              onClick={() => {
                deleteAgent(agentId);
                toast.success(t.agentSettings.agentDeleted);
                router.push("/agents");
              }}
              className="w-full px-4 py-3 text-[17px] font-semibold text-red-600 border-b border-red-100 transition-colors active:bg-red-50"
            >
              {t.agentSettings.deletePermanently}
            </button>
            <button
              onClick={() => setDeleteStep(0)}
              className="w-full px-4 py-3 text-[17px] font-medium text-orange-600 transition-colors active:bg-orange-50"
            >
              {t.common.cancel}
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Quick Views (portaled to body) ──────────────────────────────── */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {activeQuickView && (
          <>
            {/* Backdrop — Apple-style blur */}
            <motion.div
              key="qv-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={() => setActiveQuickView(null)}
              className="fixed inset-0 z-50 backdrop-blur-2xl bg-black/30"
              style={{ WebkitBackdropFilter: "blur(40px) saturate(180%)", backdropFilter: "blur(40px) saturate(180%)" }}
            />
            {/* Panel — Liquid Glass */}
            <motion.div
              key={`qv-${activeQuickView}`}
              initial={{ opacity: 0, y: "100%", scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "50%", scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-[520px] lg:w-full lg:rounded-3xl"
            >
              <div
                className="rounded-t-3xl lg:rounded-3xl overflow-y-auto max-h-[85vh] overscroll-contain border border-white/[0.12] shadow-[0_8px_60px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)]"
                style={{
                  background: "linear-gradient(180deg, rgba(60,60,67,0.72) 0%, rgba(30,30,32,0.82) 100%)",
                  WebkitBackdropFilter: "blur(80px) saturate(200%)",
                  backdropFilter: "blur(80px) saturate(200%)",
                }}
              >
                {/* Top highlight — glass refraction effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-3 lg:hidden">
                  <div className="h-1 w-10 rounded-full bg-white/25" />
                </div>

                {/* ═══ TYPE ═══ */}
                {activeQuickView === "type" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Tipo de negocio</h2>
                        <p className="text-[14px] text-white/50 mt-0.5">Esto define todo el algoritmo del agente</p>
                      </div>
                      <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                        <X className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 px-5 pt-3 pb-4">
                      {ALGORITHM_KEYS.map((key, i) => {
                        const Icon = ALGORITHM_ICONS[key];
                        const tKey = algorithmTranslationKeys[key];
                        const algo = t.personalityBuilder.algorithms[tKey];
                        return (
                          <motion.button
                            key={key}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.06 + i * 0.035 }}
                            onClick={() => handleSelectAlgorithm(key)}
                            className="group flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-200 bg-white/[0.05] ring-1 ring-white/[0.08] hover:bg-white/[0.10] hover:ring-white/[0.15] active:scale-[0.96]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] group-hover:bg-orange-500/12 transition-colors">
                              <Icon className="h-5.5 w-5.5 text-white/70 group-hover:text-orange-400 transition-colors" />
                            </div>
                            <span className="text-[15px] font-semibold text-white/90 leading-tight">{algo.name}</span>
                            <span className="text-[12px] text-white/40 leading-tight line-clamp-2">{algo.description}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-2.5">
                        <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <p className="text-[12px] text-amber-300/80 leading-snug">Una vez seleccionado, el tipo de negocio no se puede cambiar.</p>
                      </div>
                    </div>
                  </>
                )}

                {/* ═══ PERSONALITY ═══ */}
                {activeQuickView === "personality" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Personalidad</h2>
                        <p className="text-[14px] text-white/50 mt-0.5">Estilo de comunicación y ejemplos</p>
                      </div>
                      <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                        <X className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                    <div className="px-5 space-y-5 pb-5">
                      {/* Region */}
                      <div className="space-y-2.5">
                        <p className="text-[14px] font-semibold text-white/80">{t.personalityBuilder.regionTitle}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {REGION_KEYS.map((key) => {
                            const selected = qvRegion === key;
                            return (
                              <button key={key} onClick={() => setQvRegion(key)}
                                className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center transition-all ring-1 active:scale-[0.97] ${selected ? "ring-2 ring-orange-500 bg-orange-500/12" : "ring-white/[0.06] bg-white/[0.06] hover:bg-white/[0.07]"}`}>
                                <span className="text-xl">{REGION_FLAGS[key]}</span>
                                <span className={`text-[14px] font-semibold ${selected ? "text-orange-400" : "text-white/80"}`}>{t.personalityBuilder.regions[key]}</span>
                                <span className="text-[12px] text-white/40 leading-tight italic">&ldquo;{t.personalityBuilder.regionDescriptions[key]}&rdquo;</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Region temperature */}
                      {qvRegion !== "neutral" && (
                        <div className="space-y-2">
                          <p className="text-[14px] font-semibold text-white/80">Intensidad regional</p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((level) => {
                              const selected = qvRegionTemp === level;
                              const labels = ["Suave", "Medio", "Intenso"];
                              return (
                                <button key={level} onClick={() => setQvRegionTemp(level)}
                                  className={`flex-1 flex flex-col items-center gap-1 rounded-2xl p-2.5 text-center transition-all ring-1 active:scale-[0.97] ${selected ? "ring-2 ring-orange-500 bg-orange-500/12" : "ring-white/[0.06] bg-white/[0.06] hover:bg-white/[0.07]"}`}>
                                  <span className="text-base">{"🔥".repeat(level)}</span>
                                  <span className={`text-[13px] font-semibold ${selected ? "text-orange-400" : "text-white/80"}`}>{labels[level - 1]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Register */}
                      <div className="space-y-2.5">
                        <p className="text-[14px] font-semibold text-white/80">{t.personalityBuilder.registerTitle}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {REGISTER_KEYS.map((key) => {
                            const selected = qvRegister === key;
                            return (
                              <button key={key} onClick={() => setQvRegister(key)}
                                className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center transition-all ring-1 active:scale-[0.97] ${selected ? "ring-2 ring-orange-500 bg-orange-500/12" : "ring-white/[0.06] bg-white/[0.06] hover:bg-white/[0.07]"}`}>
                                <span className={`text-[14px] font-semibold ${selected ? "text-orange-400" : "text-white/80"}`}>{t.personalityBuilder.registers[key]}</span>
                                <span className="text-[12px] text-white/40 leading-tight">{t.personalityBuilder.registerDescriptions[key]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Conversation examples */}
                      <div className="space-y-2.5 relative" {...examplesDrag}>
                        {draggingExamples && (
                          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-blue-500/15 backdrop-blur-[2px] ring-2 ring-blue-400/60">
                            <Upload className="h-7 w-7 text-blue-400" />
                            <p className="text-[14px] font-semibold text-blue-300">Suelta el documento aquí</p>
                            <p className="text-[11px] text-blue-400/60">.txt · .pdf · .docx · .md</p>
                          </div>
                        )}
                        {uploadingExamples && (
                          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-[14px] font-semibold text-white/80">Ejemplos de conversación</p>
                          <div className="flex items-center gap-2">
                            <input ref={examplesFileRef} type="file" accept=".txt,.pdf,.docx,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processExamplesFile(f); e.target.value = ""; }} />
                            <button onClick={() => examplesFileRef.current?.click()} disabled={uploadingExamples}
                              className="flex items-center gap-1 text-[13px] font-medium text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
                              <FileText className="h-3.5 w-3.5" /> Importar
                            </button>
                            <button onClick={() => setQvExamples((prev) => [...prev, { id: crypto.randomUUID(), userMessage: "", agentResponse: "" }])}
                              className="flex items-center gap-1 text-[13px] font-medium text-orange-400 hover:text-orange-300 transition-colors">
                              <Plus className="h-3.5 w-3.5" /> Agregar
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/30 -mt-1">Arrastra un documento o usa Importar</p>
                        {qvExamples.map((ex, idx) => (
                          <div key={ex.id} className="rounded-xl bg-white/[0.06] ring-1 ring-white/[0.10] p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-white/40 font-medium">Ejemplo {idx + 1}</span>
                              {qvExamples.length > 1 && (
                                <button onClick={() => setQvExamples((prev) => prev.filter((e) => e.id !== ex.id))}
                                  className="text-white/30 hover:text-red-400 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1"><User className="h-3 w-3 text-blue-400" /><span className="text-[12px] text-blue-400 font-medium">Cliente:</span></div>
                              <textarea value={ex.userMessage} onChange={(e) => setQvExamples((prev) => prev.map((x) => x.id === ex.id ? { ...x, userMessage: e.target.value } : x))}
                                rows={2} placeholder="Ej: Hola, ¿tienen disponibilidad?"
                                className="w-full bg-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/50 focus:outline-none resize-none" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1"><Bot className="h-3 w-3 text-orange-400" /><span className="text-[12px] text-orange-400 font-medium">Agente:</span></div>
                              <textarea value={ex.agentResponse} onChange={(e) => setQvExamples((prev) => prev.map((x) => x.id === ex.id ? { ...x, agentResponse: e.target.value } : x))}
                                rows={2} placeholder="Ej: ¡Hola! Claro, tenemos disponibilidad..."
                                className="w-full bg-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/50 focus:outline-none resize-none" />
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Save */}
                      {(() => {
                        const hasValidExample = qvExamples.some(
                          (e) => e.userMessage.trim() && e.agentResponse.trim()
                        );
                        return (
                          <button onClick={handleSavePersonality}
                            disabled={!hasValidExample}
                            className={`w-full rounded-xl py-3 text-[16px] font-semibold transition-all ${
                              hasValidExample
                                ? "bg-orange-500 text-white active:bg-orange-600"
                                : "bg-white/[0.06] text-white/30 cursor-not-allowed"
                            }`}>
                            {hasValidExample ? "Guardar personalidad" : "Completa al menos un ejemplo"}
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* ═══ PROMPT ═══ */}
                {activeQuickView === "prompt" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Prompt del agente</h2>
                        <p className="text-[14px] text-white/50 mt-0.5">Instrucciones de comportamiento</p>
                      </div>
                      <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                        <X className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                    <div className="px-5 space-y-4 pb-5">
                      {/* Generate button */}
                      <button onClick={handleGeneratePrompt} disabled={qvIsGenerating}
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold bg-white/[0.07] ring-1 ring-white/[0.08] text-white/80 hover:bg-white/[0.08] active:scale-[0.98] transition-all disabled:opacity-50">
                        {qvIsGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> {qvPrompt ? "Regenerar con IA" : "Generar con IA"}</>}
                      </button>
                      {/* Upload document */}
                      <label className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold bg-white/[0.07] ring-1 ring-white/[0.08] text-white/80 hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer">
                        <Upload className="h-4 w-4" /> Subir documento
                        <input type="file" accept=".txt,.csv,.docx,.pdf,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePromptFileUpload(f); e.target.value = ""; }} />
                      </label>
                      <p className="text-[12px] text-white/30 text-center -mt-2">TXT, CSV, DOCX, PDF — el contenido se agregará al prompt</p>
                      {/* Preview bubble */}
                      {agent.algorithmType && (
                        <div className="rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500">
                              <Bot className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[12px] font-semibold text-orange-400 mb-1">{agent.name}</p>
                              <p className="text-[13px] text-white/70 leading-relaxed">
                                {getPreview(agent.hotelName, agent.algorithmType, agent.communicationStyle?.region ?? "neutral")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Textarea */}
                      <textarea value={qvPrompt} onChange={(e) => { if (qvAdvancedMode) setQvPrompt(e.target.value); }} readOnly={!qvAdvancedMode}
                        rows={8} placeholder="Genera o escribe las instrucciones del agente..."
                        className={`w-full bg-white/[0.06] rounded-xl px-3 py-3 text-[14px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/50 focus:outline-none resize-none ${!qvAdvancedMode ? "opacity-60 cursor-default" : ""}`} />
                      {/* Advanced toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${qvAdvancedMode ? "bg-orange-500" : "bg-white/[0.08]"}`}
                          onClick={() => setQvAdvancedMode(!qvAdvancedMode)}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${qvAdvancedMode ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-[13px] text-white/50">Modo avanzado — editar manualmente</span>
                      </label>
                      {/* Save */}
                      <button onClick={handleSavePrompt}
                        className="w-full rounded-xl py-3 text-[16px] font-semibold bg-orange-500 text-white active:bg-orange-600 transition-all">
                        Guardar prompt
                      </button>
                    </div>
                  </>
                )}

                {/* ═══ WEBHOOK ═══ */}
                {activeQuickView === "webhook" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Webhook</h2>
                        <p className="text-[14px] text-white/50 mt-0.5">URL de notificaciones del agente</p>
                      </div>
                      <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                        <X className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                    <div className="px-5 space-y-4 pb-5">
                      <div className="space-y-2">
                        <p className="text-[13px] text-white/50">El agente enviará eventos (mensajes, cambios de estado) a esta URL</p>
                        <input type="url" value={qvWebhookUrl} onChange={(e) => setQvWebhookUrl(e.target.value)}
                          placeholder="https://tu-servidor.com/webhook"
                          className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-[15px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/50 focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[13px] text-white/50">API Key para autenticación en workflows</p>
                        <input type="text" value={qvApiKey} onChange={(e) => setQvApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full bg-white/[0.06] rounded-xl px-4 py-3 text-[15px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/50 focus:outline-none font-mono" />
                      </div>
                      <button onClick={handleSaveWebhook}
                        className="w-full rounded-xl py-3 text-[16px] font-semibold bg-orange-500 text-white active:bg-orange-600 transition-all">
                        Guardar webhook
                      </button>
                    </div>
                  </>
                )}

                {/* ═══ SOCIAL ═══ */}
                {activeQuickView === "social" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Web y redes sociales</h2>
                        <p className="text-[14px] text-white/50 mt-0.5">Links de tu negocio</p>
                      </div>
                      <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] transition-colors">
                        <X className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                    <div className="px-5 space-y-3 pb-5">
                      {[
                        { key: "website", label: "Sitio web", icon: Globe, placeholder: "https://tu-negocio.com" },
                        { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/tu-negocio" },
                        { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/tu-negocio" },
                        { key: "googleMaps", label: "Google Maps", icon: MapPin, placeholder: "https://maps.google.com/..." },
                        { key: "tripAdvisor", label: "TripAdvisor", icon: Star, placeholder: "https://tripadvisor.com/..." },
                      ].map(({ key, label, icon: SIcon, placeholder }) => (
                        <div key={key} className="flex items-center gap-3 rounded-xl bg-white/[0.07] ring-1 ring-white/[0.10] px-3 py-2.5">
                          <SIcon className="h-4 w-4 text-white/35 shrink-0" />
                          <input type="url" value={qvSocialLinks[key]} onChange={(e) => setQvSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/20 focus:outline-none" />
                        </div>
                      ))}
                      <button onClick={handleSaveSocial}
                        className="w-full rounded-xl py-3 text-[16px] font-semibold bg-orange-500 text-white active:bg-orange-600 transition-all mt-2">
                        Guardar redes
                      </button>
                    </div>
                  </>
                )}

                {/* ═══ FAQS ═══ */}
                {activeQuickView === "faqs" && (
                  <>
                    <div className="flex items-center justify-between px-5 pt-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
                          <HelpCircle className="h-4.5 w-4.5 text-amber-400" />
                        </div>
                        <div>
                          <h2 className="text-[19px] font-bold text-white">Preguntas frecuentes</h2>
                          <p className="text-[13px] text-white/40 mt-0.5">
                            {qvFaqs.length} pregunta{qvFaqs.length !== 1 ? "s" : ""} — recomendamos 10+
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQvFaqs((prev) => [...prev, { id: crypto.randomUUID(), question: "", answer: "" }])}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/15 hover:bg-orange-500/25 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-orange-400" />
                        </button>
                        <button onClick={() => setActiveQuickView(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.08] transition-colors">
                          <X className="h-4 w-4 text-white/70" />
                        </button>
                      </div>
                    </div>
                    <div className="px-5 pb-5 space-y-3"
                      onDragOver={(e) => { e.preventDefault(); setQvFaqDragging(true); }}
                      onDragLeave={() => setQvFaqDragging(false)}
                      onDrop={handleFaqDrop}
                    >
                      {/* Upload zone */}
                      <div className={`relative rounded-xl border border-dashed transition-all ${qvFaqDragging ? "border-orange-400 bg-orange-500/10" : "border-white/[0.15] bg-white/[0.04]"}`}>
                        <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${qvFaqDragging ? "bg-orange-500/20" : "bg-white/[0.07]"}`}>
                            {qvFaqParsing ? (
                              <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                            ) : (
                              <Upload className={`h-4 w-4 ${qvFaqDragging ? "text-orange-400" : "text-white/30"}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white/60">
                              {qvFaqDragging ? "Suelta el archivo aquí" : qvFaqParsing ? "Procesando archivo..." : "Sube un documento con preguntas"}
                            </p>
                            <p className="text-[11px] text-white/25 mt-0.5">TXT, CSV, DOCX, PDF — arrastra o toca para seleccionar</p>
                          </div>
                          <input
                            type="file"
                            accept=".txt,.csv,.tsv,.docx,.pdf"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaqFileUpload(f); e.target.value = ""; }}
                          />
                        </label>
                      </div>
                      {/* FAQ list — accordion */}
                      <div className="rounded-xl overflow-hidden ring-1 ring-white/[0.10]">
                        {qvFaqs.length === 0 ? (
                          <div className="py-10 text-center">
                            <HelpCircle className="h-8 w-8 text-white/15 mx-auto mb-2" />
                            <p className="text-[14px] text-white/40">Sin preguntas frecuentes</p>
                            <p className="text-[13px] text-white/25 mt-0.5">Agrega preguntas para que tu agente pueda responder consultas comunes</p>
                            <button
                              onClick={() => setQvFaqs([{ id: crypto.randomUUID(), question: "", answer: "" }])}
                              className="mt-3 text-[14px] font-medium text-orange-400 hover:text-orange-300 transition-colors"
                            >
                              + Agregar primera pregunta
                            </button>
                          </div>
                        ) : (
                          qvFaqs.map((faq, idx) => {
                            const isExpanded = qvFaqExpanded === faq.id;
                            return (
                              <div key={faq.id} className={`${idx > 0 ? "border-t border-white/[0.10]" : ""}`}>
                                {/* Collapsed row */}
                                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-white/[0.06] transition-colors"
                                  onClick={() => setQvFaqExpanded(isExpanded ? null : faq.id)}>
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[12px] font-bold text-white/50 tabular-nums">
                                    {idx + 1}
                                  </span>
                                  <p className="flex-1 text-[14px] text-white/80 truncate min-w-0">
                                    {faq.question || "Nueva pregunta..."}
                                  </p>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setQvFaqs((prev) => prev.filter((f) => f.id !== faq.id)); }}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-white/30 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />
                                  )}
                                </div>
                                {/* Expanded content */}
                                {isExpanded && (
                                  <div className="px-4 pb-3 space-y-2">
                                    <input
                                      value={faq.question}
                                      onChange={(e) => setQvFaqs((prev) => prev.map((f) => f.id === faq.id ? { ...f, question: e.target.value } : f))}
                                      placeholder="Escribe la pregunta..."
                                      className="w-full bg-white/[0.06] rounded-lg px-3 py-2.5 text-[14px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/40 focus:outline-none"
                                    />
                                    <textarea
                                      value={faq.answer}
                                      onChange={(e) => setQvFaqs((prev) => prev.map((f) => f.id === faq.id ? { ...f, answer: e.target.value } : f))}
                                      placeholder="Escribe la respuesta del agente..."
                                      rows={3}
                                      className="w-full bg-white/[0.06] rounded-lg px-3 py-2.5 text-[14px] text-white/90 placeholder:text-white/20 ring-1 ring-white/[0.10] focus:ring-orange-500/40 focus:outline-none resize-none"
                                    />
                                    {!faq.answer.trim() && (
                                      <p className="text-[12px] text-orange-400/80">Respuesta obligatoria</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                        {/* Add button at bottom */}
                        {qvFaqs.length > 0 && (
                          <button
                            onClick={() => {
                              const newId = crypto.randomUUID();
                              setQvFaqs((prev) => [...prev, { id: newId, question: "", answer: "" }]);
                              setQvFaqExpanded(newId);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 border-t border-dashed border-white/[0.12] text-[14px] text-white/35 hover:text-white/60 transition-colors"
                          >
                            <Plus className="h-4 w-4" /> Agregar pregunta
                          </button>
                        )}
                      </div>

                      {/* Recommendation hint */}
                      {qvFaqs.length > 0 && qvFaqs.length < 10 && (
                        <p className="text-[12px] text-amber-400/60 text-center pt-3">
                          Llevas {qvFaqs.length} de 10 recomendadas — mientras más preguntas, mejor responde tu agente
                        </p>
                      )}

                      {/* Save */}
                      {(() => {
                        const hasValidFaq = qvFaqs.some(
                          (f) => f.question.trim() && f.answer.trim()
                        );
                        return (
                          <button
                            onClick={async () => {
                              const existingIds = new Set(agentFaqs.map((f) => f.id));
                              const newIds = new Set(qvFaqs.map((f) => f.id));
                              for (const f of agentFaqs) {
                                if (!newIds.has(f.id)) await deleteFaq(f.id);
                              }
                              for (const f of qvFaqs) {
                                if (!f.question.trim()) continue;
                                if (existingIds.has(f.id)) {
                                  await updateFaq(f.id, { question: f.question, answer: f.answer });
                                } else {
                                  await addFaq({ agentId, question: f.question, answer: f.answer, category: "general", isActive: true });
                                }
                              }
                              await loadFaqs(agentId);
                              setActiveQuickView(null);
                              toast.success("Preguntas frecuentes guardadas");
                              if (agent.trainedAt) {
                                trainApi.update(agentId, "faqs").catch(console.error);
                              }
                            }}
                            disabled={!hasValidFaq}
                            className={`w-full rounded-xl py-3 text-[16px] font-semibold transition-all mt-4 ${
                              hasValidFaq
                                ? "bg-orange-500 text-white active:bg-orange-600"
                                : "bg-white/[0.06] text-white/30 cursor-not-allowed"
                            }`}
                          >
                            {hasValidFaq ? "Guardar preguntas" : "Completa al menos una pregunta"}
                          </button>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* ── Phones ──────────────────────────────────────── */}
                {activeQuickView === "phones" && (
                  <>
                    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15">
                        <Phone className="h-4.5 w-4.5 text-orange-400" />
                      </div>
                      <div>
                        <h2 className="text-[19px] font-bold text-white">Teléfonos de contacto</h2>
                        <p className="text-[13px] text-white/40 mt-0.5">
                          Admin y escalamiento
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-8 space-y-5">
                      {/* Admin phone */}
                      <div className="space-y-1.5">
                        <p className="text-[13px] font-semibold text-white/60">Número admin (pruebas)</p>
                        <div className="flex gap-2">
                          {/* Country picker */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowAdminCountryPicker(!showAdminCountryPicker); setShowEscalationCountryPicker(false); }}
                              className="flex items-center gap-1.5 rounded-xl bg-white/8 ring-1 ring-white/[0.12] px-3 py-2.5 text-sm text-white hover:bg-white/12 transition-colors whitespace-nowrap"
                            >
                              <span>{getCountry(adminCountry).flag}</span>
                              <span className="text-white/70">{adminCountry}</span>
                              <ChevronDown className="h-3 w-3 text-white/40" />
                            </button>
                            {showAdminCountryPicker && (
                              <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-52 overflow-y-auto rounded-xl bg-[#1a1a2e] ring-1 ring-white/[0.15] shadow-xl">
                                {PHONE_COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    onClick={() => { setAdminCountry(c.code); setAdminLocal(""); setShowAdminCountryPicker(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/8 transition-colors ${c.code === adminCountry ? "bg-orange-500/15 text-orange-400" : "text-white/80"}`}
                                  >
                                    <span>{c.flag}</span>
                                    <span className="flex-1 text-left">{c.name}</span>
                                    <span className="text-white/40 text-xs">{c.code} ({c.digits} díg.)</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Phone input with exact digit count */}
                          <div className="flex-1 relative">
                            <input
                              type="tel"
                              inputMode="numeric"
                              placeholder={"0".repeat(adminDigits)}
                              value={adminLocal}
                              maxLength={adminDigits}
                              onChange={(e) => setAdminLocal(e.target.value.replace(/\D/g, "").slice(0, adminDigits))}
                              className="w-full rounded-xl bg-white/8 ring-1 ring-white/[0.12] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 tracking-widest font-mono"
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono ${adminLocal.length === adminDigits ? "text-emerald-400" : "text-white/25"}`}>
                              {adminLocal.length}/{adminDigits}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/30">
                          En modo pruebas, el agente solo responde a este número
                        </p>
                      </div>

                      {/* Escalation phone */}
                      <div className="space-y-1.5">
                        <p className="text-[13px] font-semibold text-white/60">Número de escalamiento</p>
                        <div className="flex gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowEscalationCountryPicker(!showEscalationCountryPicker); setShowAdminCountryPicker(false); }}
                              className="flex items-center gap-1.5 rounded-xl bg-white/8 ring-1 ring-white/[0.12] px-3 py-2.5 text-sm text-white hover:bg-white/12 transition-colors whitespace-nowrap"
                            >
                              <span>{getCountry(escalationCountry).flag}</span>
                              <span className="text-white/70">{escalationCountry}</span>
                              <ChevronDown className="h-3 w-3 text-white/40" />
                            </button>
                            {showEscalationCountryPicker && (
                              <div className="absolute top-full left-0 mt-1 z-50 w-56 max-h-52 overflow-y-auto rounded-xl bg-[#1a1a2e] ring-1 ring-white/[0.15] shadow-xl">
                                {PHONE_COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    onClick={() => { setEscalationCountry(c.code); setEscalationLocal(""); setShowEscalationCountryPicker(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/8 transition-colors ${c.code === escalationCountry ? "bg-orange-500/15 text-orange-400" : "text-white/80"}`}
                                  >
                                    <span>{c.flag}</span>
                                    <span className="flex-1 text-left">{c.name}</span>
                                    <span className="text-white/40 text-xs">{c.code} ({c.digits} díg.)</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="tel"
                              inputMode="numeric"
                              placeholder={"0".repeat(escalationDigits)}
                              value={escalationLocal}
                              maxLength={escalationDigits}
                              onChange={(e) => setEscalationLocal(e.target.value.replace(/\D/g, "").slice(0, escalationDigits))}
                              className="w-full rounded-xl bg-white/8 ring-1 ring-white/[0.12] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 tracking-widest font-mono"
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono ${escalationLocal.length === escalationDigits ? "text-emerald-400" : "text-white/25"}`}>
                              {escalationLocal.length}/{escalationDigits}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-white/30">
                          Consultas complejas o quejas se escalan a este número
                        </p>
                      </div>

                      <button
                        onClick={handleSavePhones}
                        disabled={!adminPhoneFull || !escalationPhoneFull}
                        className={`w-full rounded-xl py-3 text-[16px] font-semibold transition-all ${
                          adminPhoneFull && escalationPhoneFull
                            ? "bg-orange-500 text-white active:bg-orange-600"
                            : "bg-white/6 text-white/25 cursor-not-allowed"
                        }`}
                      >
                        Guardar teléfonos
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* ── Training overlay (portaled) ──────────────────────────────────── */}
      {typeof document !== "undefined" && isTraining && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          <div className="w-full max-w-md px-8">
            <AnimatePresence mode="wait">
              {!trainDone ? (
                <motion.div
                  key="training"
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 text-center"
                >
                  {/* Lisa logo with pulse */}
                  <motion.div
                    animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto flex justify-center"
                  >
                    <img src="/lisa-logo-white.png" alt="Lisa" className="h-20 object-contain mx-auto" />
                  </motion.div>

                  <div>
                    <h2 className="text-2xl font-bold text-white">Entrenando a {agent.name}</h2>
                    <p className="text-white/40 text-sm mt-1">Esto tardará unos segundos...</p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-3">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                        style={{ width: `${trainProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <p className="text-[13px] text-white/50 font-medium">
                      {TRAINING_STEPS[trainStep]}...
                    </p>
                    <p className="text-[12px] text-white/25">
                      {Math.round(trainProgress)}%
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-6 text-center"
                >
                  {/* Success checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                  </motion.div>

                  <div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="text-2xl font-bold text-white"
                    >
                      {agent.name} está listo
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/50 text-sm mt-2 max-w-xs mx-auto"
                    >
                      Tu agente ha sido entrenado exitosamente y está en modo pruebas. Solo responderá a tu número admin.
                    </motion.p>
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    onClick={handleTrainClose}
                    className="w-full rounded-xl py-3.5 text-[16px] font-semibold bg-orange-500 text-white active:bg-orange-600 transition-colors"
                  >
                    Continuar
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}

const INTEGRATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  FileText,
  Package,
  Table2,
  Calendar,
  Mail,
  Globe,
  ShoppingBag,
};

const SWAP_TITLE_INTEGRATIONS = new Set(["wompi", "bold", "google-sheets", "google-calendar", "gmail", "shopify", "woocommerce"]);
const ROUNDED_BRAND_ICONS = new Set(["wompi", "bold", "mercadopago"]);

const BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "wompi": IconWompi,
  "bold": IconBold,
  "mercadopago": IconMercadoPago,
  "gmail": IconGmail,
  "google-sheets": IconGoogleSheets,
  "google-calendar": IconGoogleCalendar,
  "shopify": IconShopify,
  "woocommerce": IconWooCommerce,
};

const PLAN_TIER_ORDER: Record<string, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };

function IntegrationsSection({
  integrations,
  onToggle,
  onConfigure,
  t,
  agent,
}: {
  integrations: Integration[];
  onToggle: (id: string) => void;
  onConfigure: (integration: Integration) => void;
  t: Translations;
  agent: Agent;
}) {
  const router = useRouter();
  const { currentPlan, hasFeature } = usePlanStore();
  const activeCount = integrations.filter((i) => i.enabled).length;
  const limit = PLAN_INTEGRATION_LIMITS[currentPlan];
  const limitLabel = limit === Infinity ? "∞" : limit;

  const categories = [
    { key: "payments" as const, label: t.integrations.categories.payments },
    { key: "operations" as const, label: t.integrations.categories.operations },
    { key: "productivity" as const, label: t.integrations.categories.productivity },
    { key: "ecommerce" as const, label: t.integrations.categories.ecommerce },
  ];

  const recommendedIntegrations = agent.algorithmType
    ? ALGORITHM_RECOMMENDED_INTEGRATIONS[agent.algorithmType]
    : [];

  const isRecommended = (integration: Integration) =>
    recommendedIntegrations.includes(integration.name);

  const isLocked = (integration: Integration) =>
    PLAN_TIER_ORDER[integration.requiredPlan] > PLAN_TIER_ORDER[currentPlan];

  const requiredPlanLabel = (integration: Integration) => {
    const labels: Record<string, string> = {
      starter: "Starter",
      pro: "Pro",
      business: "Business",
      enterprise: "Enterprise",
    };
    return labels[integration.requiredPlan];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[17px] font-semibold text-muted-foreground">
          {t.integrations.title} ({activeCount}/{limitLabel} {t.integrations.activeCount})
        </h2>
      </div>

      {categories.map((cat) => {
        const items = integrations.filter((i) => i.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} className="space-y-2">
            <h3 className="text-[15px] font-medium text-muted-foreground px-0.5">
              {cat.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-fr">
              {items.map((integration, idx) => {
                const locked = isLocked(integration);
                const Icon = INTEGRATION_ICONS[integration.icon] ?? CreditCard;
                const itemT = t.integrations.items[integration.name as keyof typeof t.integrations.items];
                const swapTitle = SWAP_TITLE_INTEGRATIONS.has(integration.name);
                const BrandIcon = BRAND_ICONS[integration.name];
                const roundedBrand = ROUNDED_BRAND_ICONS.has(integration.name);
                const mainLabel = swapTitle ? (itemT?.description ?? integration.description) : (itemT?.name ?? integration.name);
                const subLabel = swapTitle ? (itemT?.name ?? integration.name) : (itemT?.description ?? integration.description);
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30, delay: idx * 0.05 }}
                    className={`flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all h-full ${
                      locked ? "opacity-60 cursor-pointer" : ""
                    }`}
                    onClick={locked ? () => router.push("/billing") : undefined}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                        BrandIcon
                          ? roundedBrand ? "rounded-xl overflow-hidden" : ""
                          : `rounded-xl ${locked ? "bg-muted" : "bg-orange-50 dark:bg-orange-500/12"}`
                      }`}
                    >
                      {BrandIcon
                        ? <BrandIcon className="h-10 w-10 object-contain" />
                        : <Icon className={`h-5 w-5 ${locked ? "text-gray-400" : "text-orange-600"}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[16px] font-semibold leading-tight">
                          {mainLabel}
                        </span>
                        {locked && (
                          <Badge variant="outline" className="text-[12px] px-1.5 py-0 gap-0.5 text-amber-700 border-amber-200 bg-amber-50">
                            <Lock className="h-2.5 w-2.5" />
                            {requiredPlanLabel(integration)}
                          </Badge>
                        )}
                        {!locked && integration.configured && (
                          <Badge variant="outline" className="text-[12px] px-1.5 py-0 gap-0.5 text-emerald-700 border-emerald-200 bg-emerald-50">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {t.integrations.configured}
                          </Badge>
                        )}
                        {!locked && isRecommended(integration) && (
                          <Badge className="text-[12px] bg-orange-50 text-orange-700 border-orange-200" variant="outline">
                            {t.personalityBuilder.recommended}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[14px] text-muted-foreground mt-0.5 line-clamp-1">
                        {subLabel}
                      </p>
                    </div>
                    {!locked && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigure(integration);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          title="Configurar"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        {/* Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!integration.enabled && activeCount >= limit) {
                              toast(t.integrations.limitReached);
                              return;
                            }
                            onToggle(integration.id);
                          }}
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                            integration.enabled ? "bg-emerald-500" : "bg-muted-foreground/20"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              integration.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                    {locked && (
                      <Lock className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SetupCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-orange-50 dark:bg-orange-500/12", icon: "text-orange-600 dark:text-orange-400" },
    violet: { bg: "bg-orange-50 dark:bg-orange-500/12", icon: "text-orange-600 dark:text-orange-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/15", icon: "text-emerald-600 dark:text-emerald-400" },
    orange: { bg: "bg-orange-50 dark:bg-orange-500/12", icon: "text-orange-600 dark:text-orange-400" },
  };
  const colors = colorMap[color] ?? colorMap.blue;

  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 active:scale-[0.99] hover:shadow-md">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
        >
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-semibold leading-tight">{title}</h3>
          <p className="text-[15px] text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
      </div>
    </Link>
  );
}
