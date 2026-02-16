# Agent Hub - Plataforma de Agentes IA

## Descripcion General

Agent Hub es una plataforma SaaS para crear y gestionar agentes de inteligencia artificial que atienden clientes por WhatsApp. Originalmente disenada para hoteles, ahora soporta multiples tipos de negocio gracias al sistema de **Tipos de Algoritmo**.

**Stack:** Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Zustand

---

## Arquitectura

```
src/
├── app/(dashboard)/          # Rutas protegidas del dashboard
│   ├── agents/
│   │   ├── [agentId]/        # Detalle del agente
│   │   │   ├── page.tsx      # Vista principal + integraciones
│   │   │   ├── settings/     # Configuracion de personalidad
│   │   │   ├── faqs/         # Editor de FAQs
│   │   │   ├── whatsapp/     # Conexion WhatsApp
│   │   │   ├── social/       # Redes sociales + scraping
│   │   │   ├── conversations/# Chat en tiempo real
│   │   │   ├── crm/          # CRM de clientes
│   │   │   ├── contacts/     # Contactos del hotel
│   │   │   └── analytics/    # Metricas y rendimiento
│   │   └── new/              # Crear nuevo agente
│   ├── billing/              # Facturacion y planes
│   ├── dashboard/            # Panel principal
│   └── settings/             # Config de cuenta
├── components/
│   ├── agents/               # Componentes de agentes
│   │   ├── personality-config.tsx  # Constructor de personalidad IA
│   │   ├── conversation-list.tsx   # Lista de conversaciones
│   │   ├── crm-client-list.tsx     # Lista CRM
│   │   └── integration-config-dialog.tsx
│   ├── whatsapp/             # Wizard de conexion WhatsApp
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── mock-data.ts          # Datos mock + tipos + constantes
│   └── i18n/                 # Sistema de internacionalizacion
│       ├── types.ts          # Tipos de traduccion
│       ├── es.ts             # Espanol
│       └── en.ts             # Ingles
└── stores/
    ├── agent-store.ts        # Estado global (Zustand)
    └── locale-store.ts       # Estado de idioma
```

---

## Tipos de Algoritmo (5)

Cada agente se configura con un tipo de negocio que pre-configura su personalidad e integraciones sugeridas.

| Key | Nombre | Icono | Integraciones Recomendadas |
|-----|--------|-------|---------------------------|
| `ecommerce` | E-commerce (web) | ShoppingCart | WooCommerce, Shopify, Google Sheets, Gmail |
| `appointments` | Citas y reservas | CalendarCheck | Google Calendar, Gmail |
| `whatsapp-store` | Tienda WhatsApp | MessageCircle | Google Sheets, Gmail |
| `hotel` | Hoteles | Building2 | Google Sheets, Google Calendar, Gmail |
| `restaurant` | Restaurantes | UtensilsCrossed | Google Calendar, Google Sheets |

---

## Estilos de Comunicacion

### Region (parlache LATAM)
| Key | Ejemplo |
|-----|---------|
| `neutral` | "Hola, con gusto le ayudo" |
| `colombian` | "Quiubo parce, con todo el gusto" |
| `mexican` | "Que onda, con mucho gusto" |
| `argentinian` | "Che, dale, te ayudo" |

### Registro (formalidad)
| Key | Descripcion |
|-----|-------------|
| `corporate` | Formal, usted, sin coloquialismos |
| `professional` | Cercano pero profesional |
| `relaxed` | Casual, como hablar con un amigo |
| `genz` | Juvenil, expresiones modernas, emojis |

---

## Constructor de Personalidad IA

El sistema genera prompts de personalidad combinando 3 capas:

1. **Base del algoritmo** - Describe el rol del agente segun el tipo de negocio
2. **Overlay de region** - Agrega expresiones y estilo regional
3. **Overlay de registro** - Define el nivel de formalidad

### Ejemplo: Hotel + Colombiano + Relajado
```
Eres [AgentName], el asistente virtual de [HotelName]. Tu rol es atender
huespedes como un conserje local autentico. Hablas con la calidez y
naturalidad del parlache colombiano — usas expresiones como "parce",
"bacano", "que mas pues". Tu tono es relajado y cercano, como hablar
con un amigo que conoce todos los secretos del lugar.
```

### Preview de Respuesta
El sistema genera un preview en tiempo real de como responderia el agente:
```
"Quiubo parce! Bienvenido al Hotel Playa Azul. Con todo el gusto te ayudo
con tu reserva. Tenemos unas habitaciones bacanas desde $2,500 MXN la
noche con vista al mar. Te cuento mas?"
```

---

## Sistema de Integraciones

### Categorias
- **Pagos:** Wompi, Bold
- **Operaciones:** Facturacion electronica, Logistica
- **Productividad:** Google Sheets, Google Calendar, Gmail
- **E-commerce:** WooCommerce, Shopify

### Badge "Recomendado"
Las integraciones muestran un badge azul "Recomendado" cuando coinciden con el tipo de algoritmo del agente. Ejemplo: un agente tipo `hotel` vera "Recomendado" en Google Calendar y Gmail.

### Planes y Limites
| Plan | Integraciones | Agentes |
|------|---------------|---------|
| Starter | 2 | 1 |
| Pro | 5 | 3 |
| Business | Ilimitadas | 5 |
| Enterprise | Ilimitadas | Ilimitados |

---

## Internacionalizacion (i18n)

Sistema completo ES/EN con tipado estricto TypeScript:

- `src/lib/i18n/types.ts` - Interface `Translations` con todas las keys
- `src/lib/i18n/es.ts` - Traducciones en espanol
- `src/lib/i18n/en.ts` - Traducciones en ingles
- `src/stores/locale-store.ts` - Store de idioma con Zustand

---

## Flujos de Usuario

### Crear Agente
1. `/agents/new` → Selecciona tipo de algoritmo (grid de 5 cards)
2. El label del campo "nombre" cambia segun el tipo (hotel/restaurante/tienda/clinica)
3. Completa nombre, idioma, tono → Click Crear

### Configurar Personalidad
1. `/agents/[id]/settings` → Ve tipo actual, puede cambiar
2. Selecciona region (Colombiano) + registro (Casual relajado)
3. Click "Generar con IA" → Spinner 1.5s → Prompt con typewriter effect
4. Ve preview de respuesta del agente
5. Opcionalmente activa "Modo avanzado" para editar manualmente
6. Click Guardar

### Gestionar Integraciones
1. En la pagina del agente, seccion integraciones
2. Integraciones recomendadas muestran badge azul
3. Toggle para activar/desactivar (respeta limites del plan)
4. Click en integracion activa para configurar credenciales

---

## Funcionalidades Completas

- [x] Dashboard con metricas y graficos
- [x] CRUD de agentes con 5 tipos de algoritmo
- [x] Constructor de personalidad IA con generacion mock
- [x] Estilos de comunicacion LATAM (4 regiones + 4 registros)
- [x] Preview de respuesta del agente en tiempo real
- [x] Editor de FAQs con plantillas
- [x] Conexion WhatsApp (Meta API directo + WATI)
- [x] Redes sociales + scraping de informacion
- [x] Conversaciones en tiempo real con takeover humano
- [x] CRM de clientes con tags y notas
- [x] Contactos del hotel
- [x] Sistema de integraciones con 9 proveedores
- [x] Configuracion de credenciales por integracion
- [x] Badge "Recomendado" en integraciones segun algoritmo
- [x] Facturacion con 4 planes (Starter/Pro/Business/Enterprise)
- [x] i18n completo ES/EN
- [x] UX mobile-native estilo Apple/iOS
- [x] Webhooks para eventos del sistema

---

## Modelo de Datos Principal

```typescript
interface Agent {
  id: string;
  name: string;
  hotelName: string;
  status: "active" | "inactive" | "setup";
  personality: string;
  tone: "formal" | "friendly" | "casual";
  language: string;
  algorithmType?: "ecommerce" | "appointments" | "whatsapp-store" | "hotel" | "restaurant";
  communicationStyle?: {
    region: "neutral" | "colombian" | "mexican" | "argentinian";
    register: "corporate" | "professional" | "relaxed" | "genz";
  };
  whatsappConnected: boolean;
  socialLinks?: SocialLinks;
  messageCount: number;
  faqCount: number;
}
```

---

## Desarrollo Local

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Build de produccion
```
