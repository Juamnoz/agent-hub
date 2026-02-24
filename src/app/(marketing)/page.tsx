"use client";

import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Globe,
  GraduationCap,
  Hotel,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  Store,
  Star,
  Building2,
  Crown,
} from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default function LandingPage() {
  const { t } = useLocaleStore();

  const features = [
    { icon: MessageSquare, title: "Integración WhatsApp", description: "Conecta tu WhatsApp Business y responde a tus clientes de forma automática, 24/7." },
    { icon: GraduationCap, title: "Entrena desde el chat", description: "Educa a Lisa conversando con ella. Enséñale sobre precios, horarios, menús y más en lenguaje natural." },
    { icon: Zap, title: "Respuestas instantáneas", description: "Tus clientes reciben respuestas al momento, sin importar la hora del día." },
    { icon: Globe, title: "Soporte multilingüe", description: "Atiende a clientes en español, inglés, portugués y francés sin esfuerzo." },
    { icon: Shield, title: "Datos seguros", description: "Mantén el control total de tus datos con una solución segura y confiable." },
    { icon: Check, title: "Configuración por industria", description: "Algoritmos preconfigurados para hoteles, restaurantes, e-commerce, agendamiento y más." },
  ];

  const industries = [
    { icon: Hotel, name: "Hoteles", description: "Reservas, check-in, servicios del hotel, información turística." },
    { icon: UtensilsCrossed, name: "Restaurantes", description: "Menús, reservaciones, horarios, pedidos a domicilio." },
    { icon: ShoppingBag, name: "E-commerce", description: "Catálogo, estado de pedidos, devoluciones, soporte postventa." },
    { icon: Calendar, name: "Agendamiento", description: "Citas, disponibilidad, confirmaciones y recordatorios." },
    { icon: Store, name: "Tienda WhatsApp", description: "Catálogo digital, pedidos y pagos directos por WhatsApp." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Lisa" className="h-7 w-7" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-semibold tracking-tight leading-tight">Lisa</span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wide">by Aic studio</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              {t.common.signIn}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg bg-orange-500 px-4 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {t.common.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-4xl mx-auto">
          Automatiza la atención al cliente con{" "}
          <span className="text-orange-600">Lisa</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Crea agentes de IA para tu negocio que responden por WhatsApp las 24/7.
          Entrena a Lisa desde el chat y ella aprende sobre tu empresa en lenguaje natural.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Prueba gratis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          <Link
            href="#industries"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border px-6 text-sm font-medium hover:bg-accent transition-colors"
          >
            Ver industrias
          </Link>
        </div>
      </section>

      {/* Industries */}
      <section id="industries" className="border-t bg-[#FAFAFA] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Un agente para cada tipo de negocio
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Lisa viene preconfigurada con algoritmos especializados por industria. Selecciona tu tipo de negocio y empieza a operar en minutos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <industry.icon className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{industry.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {industry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Todo lo que necesitas
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Herramientas potentes para automatizar la comunicación con tus clientes.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 mb-4">
                  <feature.icon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Train CTA */}
      <section className="border-t bg-[#FAFAFA] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Entrena a Lisa conversando
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            No necesitas archivos complicados ni configuraciones técnicas. Solo chatea con Lisa
            y enséñale sobre tu negocio: precios, horarios, preguntas frecuentes, menús y más.
            Ella aprende y responde por ti.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Comenzar a entrenar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Planes y precios</h2>
          <p className="text-muted-foreground mb-12">
            Escala a tu ritmo. Todos los planes incluyen entrenamiento por chat con Lisa.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Starter */}
            <div className="rounded-2xl border bg-white p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Starter</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$30</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["1 agente", "1,000 mensajes/mes", "WhatsApp Business", "2 integraciones", "Entrenamiento por chat"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
                Comenzar
              </Link>
            </div>

            {/* Pro - highlighted */}
            <div className="rounded-2xl border-2 border-orange-500 bg-white p-6 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-medium text-white">
                Popular
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Pro</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$80</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["3 agentes", "3,000 mensajes/mes", "WhatsApp Business", "5 integraciones", "Entrenamiento por chat", "Analíticas avanzadas"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
                Prueba gratis
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-2xl border bg-white p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Business</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$200</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["5 agentes", "15,000 mensajes/mes", "WhatsApp Business", "Integraciones ilimitadas", "Entrenamiento por chat", "Analíticas avanzadas", "Soporte prioritario"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
                Comenzar
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border bg-white p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Enterprise</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$500</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {["Agentes ilimitados", "Mensajes ilimitados", "WhatsApp Business", "Integraciones ilimitadas", "Entrenamiento por chat", "Analíticas avanzadas", "Soporte dedicado", "SLA garantizado"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="inline-flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
                Contactar ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Lisa" className="h-5 w-5" />
            <span className="text-sm font-semibold">Lisa</span>
            <span className="text-xs text-muted-foreground">by Aic studio</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Learning Intelligence Service Automatization
          </p>
        </div>
      </footer>
    </div>
  );
}
