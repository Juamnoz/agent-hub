// ---------------------------------------------------------------------------
// Training Chat Types
// ---------------------------------------------------------------------------

export type TrainingMessageRole = "user" | "agent" | "system";
export type TrainingToolType = "file" | "prices" | "schedule" | "menu" | "faq" | "sheets";

export interface TrainingMessage {
  id: string;
  agentId: string;
  role: TrainingMessageRole;
  content: string;
  toolType?: TrainingToolType;
  knowledgeSaved?: boolean;
  attachmentName?: string;
}

export const mockTrainingResponses: Record<string, string[]> = {
  prices: [
    "Perfecto, ya registre la informacion de precios. Voy a usar estos datos para responder consultas sobre tarifas y costos. Si necesitas actualizar algun precio, solo dimelo.",
    "Excelente, tengo los precios guardados. Cuando un cliente pregunte por tarifas, usare esta informacion para darle una respuesta precisa.",
    "Listo, precios actualizados en mi base de conocimiento. Puedo responder consultas de precios a partir de ahora.",
  ],
  schedule: [
    "Perfecto, ya tengo los horarios registrados. Voy a informar a los clientes sobre disponibilidad y horarios de atencion cuando pregunten.",
    "Horarios guardados correctamente. Ahora puedo responder preguntas sobre cuando estan disponibles los servicios.",
    "Excelente, ya conozco los horarios. Si cambian, solo avisame y los actualizo de inmediato.",
  ],
  menu: [
    "Ya tengo el menu registrado. Cuando los clientes pregunten por opciones de comida, les dare esta informacion con gusto.",
    "Menu guardado. Puedo recomendar platillos y responder sobre opciones disponibles, precios y alergenos.",
    "Perfecto, ya conozco las opciones del menu. Si hay cambios de temporada, solo dimelo para actualizar.",
  ],
  faq: [
    "Pregunta frecuente registrada. La proxima vez que un cliente haga esta pregunta, la respondere automaticamente.",
    "FAQ guardada en mi conocimiento. Esto me ayuda a dar respuestas mas rapidas y precisas.",
    "Excelente, ya tengo esta pregunta y respuesta. Voy a usarla para atender consultas similares.",
  ],
  sheets: [
    "Datos de la hoja importados correctamente. Ahora tengo acceso a esta informacion para responder consultas.",
    "Informacion de Google Sheets procesada. Puedo usar estos datos para dar respuestas mas completas.",
    "Perfecto, ya integre los datos de la hoja. Si actualizas el documento, dimelo para re-importar.",
  ],
  general: [
    "Entendido, he guardado esta informacion. La usare para dar mejores respuestas a los clientes.",
    "Perfecto, ya lo tengo registrado. Esto me ayuda a conocer mejor tu negocio y atender mejor a los clientes.",
    "Excelente, informacion guardada. Cada detalle que me compartes me hace mas util para tu negocio.",
    "Gracias por compartir eso. Ya lo tengo en mi base de conocimiento y lo usare cuando sea relevante.",
    "Listo, aprendido. Si hay algo mas que deba saber sobre tu negocio, estoy aqui para escucharte.",
  ],
};

export type AgentStatus = "active" | "inactive" | "setup";

export interface HotelContact {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  category: string;
  description?: string;
  isActive: boolean;
}

export interface SocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  tripadvisor?: string;
  googleMaps?: string;
}

export type WhatsAppProvider = "meta" | "wati";

export type AlgorithmType = "ecommerce" | "appointments" | "whatsapp-store" | "hotel" | "restaurant";

export type CommunicationRegion = "neutral" | "colombian" | "mexican" | "argentinian";
export type CommunicationRegister = "corporate" | "professional" | "relaxed" | "genz";

export interface CommunicationStyle {
  region: CommunicationRegion;
  register: CommunicationRegister;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  hotelName: string;
  status: AgentStatus;
  personality: string;
  tone: "formal" | "friendly" | "casual";
  language: string;
  whatsappConnected: boolean;
  whatsappPhoneNumber?: string;
  whatsappProvider?: WhatsAppProvider;
  socialLinks?: SocialLinks;
  algorithmType?: AlgorithmType;
  communicationStyle?: CommunicationStyle;
  messageCount: number;
  faqCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export const ALGORITHM_RECOMMENDED_INTEGRATIONS: Record<AlgorithmType, string[]> = {
  ecommerce: ["woocommerce", "shopify", "google-sheets", "gmail"],
  appointments: ["google-calendar", "gmail"],
  "whatsapp-store": ["google-sheets", "gmail"],
  hotel: ["google-sheets", "google-calendar", "gmail"],
  restaurant: ["google-calendar", "google-sheets"],
};

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  agentId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  sku?: string;
  stock?: number;
  variants: ProductVariant[];
  isActive: boolean;
  sortOrder: number;
}

export interface FAQ {
  id: string;
  agentId: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export type ConversationStatus = "bot_handling" | "human_handling" | "resolved";

export interface Conversation {
  id: string;
  agentId: string;
  contactPhone: string;
  contactName: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessage?: string;
  status: ConversationStatus;
  tags: string[];
}

export interface ConversationTag {
  id: string;
  agentId: string;
  name: string;
  color: string;
}

export interface CRMClient {
  id: string;
  agentId: string;
  name: string;
  phone: string;
  email?: string;
  firstContactAt: string;
  lastContactAt: string;
  totalConversations: number;
  totalMessages: number;
  tags: string[];
  notes?: string;
  status: "active" | "inactive" | "vip";
}

export interface Message {
  id: string;
  conversationId: string;
  agentId: string;
  role: "user" | "assistant" | "human";
  content: string;
  matchedFaqId?: string;
  confidence?: number;
  createdAt: string;
}

export type PlanTier = "starter" | "pro" | "business" | "enterprise";

export interface Integration {
  id: string;
  agentId: string;
  name: string;
  description: string;
  category: "payments" | "operations" | "productivity" | "ecommerce";
  icon: string;
  requiredPlan: PlanTier;
  enabled: boolean;
  environment?: "sandbox" | "production";
  credentials?: Record<string, string>;
  configured?: boolean;
}

export const PLAN_INTEGRATION_LIMITS: Record<PlanTier, number> = {
  starter: 2,
  pro: 5,
  business: Infinity,
  enterprise: Infinity,
};

export const PLAN_AGENT_LIMITS: Record<PlanTier, number> = {
  starter: 1,
  pro: 10,
  business: 25,
  enterprise: Infinity,
};

export const CURRENT_PLAN: PlanTier = "pro";

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalMessages: number;
  messagesThisWeek: number;
  messagesLastWeek: number;
  totalConversations: number;
  avgResponseTime: string;
  satisfactionRate: number;
}

export interface WeeklyMessageData {
  day: string;
  messages: number;
}

// ---------------------------------------------------------------------------
// Mock Agents
// ---------------------------------------------------------------------------

export const mockAgents: Agent[] = [
  {
    id: "agent-001",
    userId: "user-001",
    name: "Playa Azul Assistant",
    hotelName: "Hotel Playa Azul",
    status: "active",
    personality:
      "Conserje amigable y conocedor que disfruta ayudar a los huéspedes a descubrir atracciones locales y asegurar una estadía cómoda.",
    tone: "friendly",
    language: "es",
    whatsappConnected: true,
    whatsappPhoneNumber: "+52 998 123 4567",
    socialLinks: {
      website: "https://hotelplayaazul.com",
      facebook: "https://facebook.com/hotelplayaazul",
      instagram: "https://instagram.com/hotelplayaazul",
      tripadvisor: "https://tripadvisor.com/Hotel-Playa-Azul",
      googleMaps: "https://maps.google.com/?cid=123456789",
    },
    algorithmType: "hotel",
    communicationStyle: { region: "colombian", register: "professional" },
    messageCount: 1247,
    faqCount: 8,
    productCount: 0,
    createdAt: "2025-10-15T08:00:00Z",
    updatedAt: "2026-02-14T12:30:00Z",
  },
  {
    id: "agent-002",
    userId: "user-001",
    name: "Sierra Nevada Concierge",
    hotelName: "Hotel Sierra Nevada",
    status: "active",
    personality:
      "Asistente profesional y atento especializado en servicios de resort de montaña y turismo de aventura.",
    tone: "formal",
    language: "es",
    whatsappConnected: true,
    whatsappPhoneNumber: "+52 614 987 6543",
    algorithmType: "hotel",
    communicationStyle: { region: "neutral", register: "corporate" },
    messageCount: 834,
    faqCount: 6,
    productCount: 0,
    createdAt: "2025-11-02T10:00:00Z",
    updatedAt: "2026-02-13T09:15:00Z",
  },
  {
    id: "agent-003",
    userId: "user-001",
    name: "Roma Bot",
    hotelName: "Boutique Roma",
    status: "setup",
    personality:
      "Asistente moderno y relajado para un hotel boutique en la colonia Roma.",
    tone: "casual",
    language: "es",
    whatsappConnected: false,
    algorithmType: "restaurant",
    communicationStyle: { region: "mexican", register: "relaxed" },
    messageCount: 0,
    faqCount: 0,
    productCount: 3,
    createdAt: "2026-02-10T14:00:00Z",
    updatedAt: "2026-02-10T14:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Mock FAQs (for agent-001)
// ---------------------------------------------------------------------------

export const mockFaqs: FAQ[] = [
  {
    id: "faq-001",
    agentId: "agent-001",
    question: "¿Cuáles son los horarios de check-in y check-out?",
    answer:
      "El check-in es a las 3:00 PM y el check-out a las 12:00 PM. El check-in anticipado y el check-out tardío están disponibles bajo solicitud, sujetos a disponibilidad. Por favor contacta a recepción para coordinarlo.",
    category: "General",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "faq-002",
    agentId: "agent-001",
    question: "¿Hay WiFi disponible en el hotel?",
    answer:
      "¡Sí! WiFi de alta velocidad gratuito está disponible en todo el hotel, incluyendo habitaciones, lobby, área de alberca y restaurante. El nombre de la red y contraseña se proporcionan al hacer check-in.",
    category: "Amenidades",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "faq-003",
    agentId: "agent-001",
    question: "¿Cuál es el horario de la alberca?",
    answer:
      "Nuestra alberca está abierta todos los días de 7:00 AM a 10:00 PM. Las toallas se proporcionan en el área de la alberca. También contamos con un bar acuático abierto de 11:00 AM a 8:00 PM.",
    category: "Amenidades",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "faq-004",
    agentId: "agent-001",
    question: "¿El hotel tiene restaurante?",
    answer:
      "Sí, contamos con dos restaurantes. 'Mar Abierto' sirve desayuno (7-11 AM), comida (12-4 PM) y cena (6-10 PM). 'La Terraza' es nuestro bar y parrilla en la azotea, abierto de 5 PM a medianoche.",
    category: "Gastronomía",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "faq-005",
    agentId: "agent-001",
    question: "¿Tienen estacionamiento?",
    answer:
      "Sí, ofrecemos estacionamiento gratuito para todos los huéspedes. El servicio de valet también está disponible por $150 MXN por noche. Contamos con estaciones de carga para vehículos eléctricos en el estacionamiento.",
    category: "Servicios",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "faq-006",
    agentId: "agent-001",
    question: "¿Aceptan mascotas?",
    answer:
      "Recibimos mascotas pequeñas (menores de 10 kg) en habitaciones seleccionadas pet-friendly con un cargo adicional de $300 MXN por noche. Por favor infórmanos al momento de la reservación para preparar tu habitación.",
    category: "Políticas",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "faq-007",
    agentId: "agent-001",
    question: "¿Ofrecen servicio de traslado al aeropuerto?",
    answer:
      "Sí, ofrecemos servicio de traslado al aeropuerto por $450 MXN por viaje (sencillo). Los traslados se pueden reservar en recepción o enviándonos un mensaje de WhatsApp con al menos 24 horas de anticipación.",
    category: "Servicios",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "faq-008",
    agentId: "agent-001",
    question: "¿Cuál es la política de cancelación?",
    answer:
      "La cancelación gratuita está disponible hasta 48 horas antes del check-in. Las cancelaciones realizadas dentro de las 48 horas se cobrarán una noche de estadía. Los no-shows se cobran el monto total de la reservación.",
    category: "Políticas",
    sortOrder: 8,
    isActive: true,
  },
];

// ---------------------------------------------------------------------------
// Mock Products (for agent-003 restaurant)
// ---------------------------------------------------------------------------

export const mockProducts: Product[] = [
  {
    id: "prod-001",
    agentId: "agent-003",
    name: "Tacos al Pastor",
    description: "Tres tacos de cerdo adobado con piña, cilantro y cebolla. Servidos con salsa verde y limón.",
    price: 85,
    category: "Platillos principales",
    sku: "TAC-001",
    stock: 50,
    variants: [
      { name: "Tortilla", options: ["Maíz", "Harina"] },
      { name: "Picor", options: ["Sin chile", "Medio", "Extra picante"] },
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "prod-002",
    agentId: "agent-003",
    name: "Mezcal Artesanal",
    description: "Mezcal joven de Oaxaca, 100% agave espadín. Servido con naranja y sal de gusano.",
    price: 120,
    category: "Bebidas",
    sku: "BEB-001",
    stock: 30,
    variants: [
      { name: "Medida", options: ["Caballito", "Doble"] },
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "prod-003",
    agentId: "agent-003",
    name: "Churros con Chocolate",
    description: "Seis churros recién hechos con azúcar y canela, acompañados de chocolate caliente para dippear.",
    price: 65,
    category: "Postres",
    sku: "POS-001",
    stock: 25,
    variants: [],
    isActive: false,
    sortOrder: 3,
  },
];

// ---------------------------------------------------------------------------
// Mock Conversations
// ---------------------------------------------------------------------------

export const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    agentId: "agent-001",
    contactPhone: "+52 55 1234 5678",
    contactName: "Carlos Martinez",
    messageCount: 9,
    lastMessageAt: "2026-02-15T09:45:00Z",
    lastMessage: "Carlos, te confirmo que tu habitación pet-friendly está lista para el 20 de febrero.",
    status: "human_handling",
    tags: ["reserva", "vip"],
  },
  {
    id: "conv-002",
    agentId: "agent-001",
    contactPhone: "+1 310 555 0199",
    contactName: "Sarah Johnson",
    messageCount: 4,
    lastMessageAt: "2026-02-14T18:45:00Z",
    lastMessage: "I have noted your arrival for February 20 at 2:00 PM...",
    status: "bot_handling",
    tags: ["reserva"],
  },
  {
    id: "conv-003",
    agentId: "agent-001",
    contactPhone: "+52 33 9876 5432",
    contactName: "Ana Lopez",
    messageCount: 3,
    lastMessageAt: "2026-02-14T14:20:00Z",
    lastMessage: "Gracias!",
    status: "resolved",
    tags: ["info"],
  },
  {
    id: "conv-004",
    agentId: "agent-002",
    contactPhone: "+52 81 5555 1234",
    contactName: "Roberto Diaz",
    messageCount: 5,
    lastMessageAt: "2026-02-15T07:10:00Z",
    lastMessage: "La Ruta del Bosque por favor, para 2 personas.",
    status: "bot_handling",
    tags: ["reserva", "urgente"],
  },
  {
    id: "conv-005",
    agentId: "agent-002",
    contactPhone: "+44 7700 900123",
    contactName: "James Wilson",
    messageCount: 2,
    lastMessageAt: "2026-02-13T22:05:00Z",
    lastMessage: "Our cancellation policy allows free cancellation up to 48 hours before...",
    status: "resolved",
    tags: ["info"],
  },
];

// ---------------------------------------------------------------------------
// Mock Messages
// ---------------------------------------------------------------------------

export const mockMessages: Message[] = [
  // Conversation 001 - Carlos Martinez
  {
    id: "msg-001",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "user",
    content: "Hola, quisiera saber el horario de check-in por favor.",
    createdAt: "2026-02-15T09:10:00Z",
  },
  {
    id: "msg-002",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "assistant",
    content:
      "Hola Carlos! El check-in es a las 3:00 PM y el check-out a las 12:00 PM. Si necesitas un check-in temprano o check-out tarde, con gusto lo gestionamos sujeto a disponibilidad. Algo mas en lo que pueda ayudarte?",
    matchedFaqId: "faq-001",
    confidence: 0.95,
    createdAt: "2026-02-15T09:10:05Z",
  },
  {
    id: "msg-003",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "user",
    content: "Tienen estacionamiento?",
    createdAt: "2026-02-15T09:25:00Z",
  },
  {
    id: "msg-004",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "assistant",
    content:
      "Si, tenemos estacionamiento gratuito para todos los huespedes. Tambien ofrecemos servicio de valet por $150 MXN por noche. Contamos con estaciones de carga para vehiculos electricos en el estacionamiento.",
    matchedFaqId: "faq-005",
    confidence: 0.92,
    createdAt: "2026-02-15T09:25:04Z",
  },
  {
    id: "msg-005",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "user",
    content: "Perfecto, y aceptan mascotas?",
    createdAt: "2026-02-15T09:31:00Z",
  },
  {
    id: "msg-006",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "assistant",
    content:
      "Si, aceptamos mascotas pequenas (menores de 10 kg) en habitaciones seleccionadas con un cargo adicional de $300 MXN por noche. Te recomendamos avisarnos al momento de hacer tu reservacion para preparar la habitacion. Necesitas algo mas?",
    matchedFaqId: "faq-006",
    confidence: 0.97,
    createdAt: "2026-02-15T09:31:03Z",
  },

  // Conversation 001 - Human takeover messages
  {
    id: "msg-006b",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "human",
    content:
      "Carlos, te confirmo que tu habitación pet-friendly está lista para el 20 de febrero. Te asignamos la 305 con vista al mar.",
    createdAt: "2026-02-15T09:35:00Z",
  },
  {
    id: "msg-006c",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "user",
    content: "Excelente, muchas gracias por la atención personalizada!",
    createdAt: "2026-02-15T09:40:00Z",
  },
  {
    id: "msg-006d",
    conversationId: "conv-001",
    agentId: "agent-001",
    role: "human",
    content:
      "Con gusto Carlos. También te incluimos early check-in a las 12 PM sin cargo adicional. Te esperamos!",
    createdAt: "2026-02-15T09:45:00Z",
  },

  // Conversation 002 - Sarah Johnson
  {
    id: "msg-007",
    conversationId: "conv-002",
    agentId: "agent-001",
    role: "user",
    content: "Hi! Do you have airport shuttle service?",
    createdAt: "2026-02-14T18:30:00Z",
  },
  {
    id: "msg-008",
    conversationId: "conv-002",
    agentId: "agent-001",
    role: "assistant",
    content:
      "Hello Sarah! Yes, we offer airport shuttle service for $450 MXN per trip (one way). You can book through the front desk or via WhatsApp at least 24 hours in advance. Would you like me to help you arrange a transfer?",
    matchedFaqId: "faq-007",
    confidence: 0.94,
    createdAt: "2026-02-14T18:30:04Z",
  },
  {
    id: "msg-009",
    conversationId: "conv-002",
    agentId: "agent-001",
    role: "user",
    content: "Yes please! I arrive on Feb 20 at 2 PM.",
    createdAt: "2026-02-14T18:40:00Z",
  },
  {
    id: "msg-010",
    conversationId: "conv-002",
    agentId: "agent-001",
    role: "assistant",
    content:
      "I have noted your arrival for February 20 at 2:00 PM. Our driver will be waiting for you at the arrivals terminal with a sign. Please share your flight number when you have it so we can track any delays. Safe travels!",
    confidence: 0.78,
    createdAt: "2026-02-14T18:40:06Z",
  },

  // Conversation 003 - Ana Lopez
  {
    id: "msg-011",
    conversationId: "conv-003",
    agentId: "agent-001",
    role: "user",
    content: "Buenas tardes, tienen WiFi?",
    createdAt: "2026-02-14T14:15:00Z",
  },
  {
    id: "msg-012",
    conversationId: "conv-003",
    agentId: "agent-001",
    role: "assistant",
    content:
      "Buenas tardes Ana! Si, contamos con WiFi gratuito de alta velocidad en todo el hotel: habitaciones, lobby, area de alberca y restaurante. Al hacer check-in te proporcionamos el nombre de la red y contrasena.",
    matchedFaqId: "faq-002",
    confidence: 0.96,
    createdAt: "2026-02-14T14:15:03Z",
  },
  {
    id: "msg-013",
    conversationId: "conv-003",
    agentId: "agent-001",
    role: "user",
    content: "Gracias!",
    createdAt: "2026-02-14T14:20:00Z",
  },

  // Conversation 004 - Roberto Diaz
  {
    id: "msg-014",
    conversationId: "conv-004",
    agentId: "agent-002",
    role: "user",
    content: "Hola, que actividades ofrecen en el hotel?",
    createdAt: "2026-02-15T06:50:00Z",
  },
  {
    id: "msg-015",
    conversationId: "conv-004",
    agentId: "agent-002",
    role: "assistant",
    content:
      "Buenos dias Roberto. En Hotel Sierra Nevada ofrecemos senderismo guiado, rappel, ciclismo de montana y paseos a caballo. Durante el invierno contamos con acceso a pistas de esqui cercanas. Puedo ayudarle a reservar alguna actividad?",
    confidence: 0.85,
    createdAt: "2026-02-15T06:50:05Z",
  },
  {
    id: "msg-016",
    conversationId: "conv-004",
    agentId: "agent-002",
    role: "user",
    content: "Me interesa el senderismo, tienen guias disponibles manana?",
    createdAt: "2026-02-15T07:00:00Z",
  },
  {
    id: "msg-017",
    conversationId: "conv-004",
    agentId: "agent-002",
    role: "assistant",
    content:
      "Si senor, tenemos dos rutas disponibles manana: la Ruta del Bosque (3 horas, dificultad media) a las 8:00 AM y la Ruta Cumbre (5 horas, dificultad alta) a las 7:00 AM. Ambas incluyen guia certificado y equipo basico. Desea que le reserve un lugar?",
    confidence: 0.72,
    createdAt: "2026-02-15T07:00:06Z",
  },
  {
    id: "msg-018",
    conversationId: "conv-004",
    agentId: "agent-002",
    role: "user",
    content: "La Ruta del Bosque por favor, para 2 personas.",
    createdAt: "2026-02-15T07:08:00Z",
  },

  // Conversation 005 - James Wilson
  {
    id: "msg-019",
    conversationId: "conv-005",
    agentId: "agent-002",
    role: "user",
    content: "Hello, what is your cancellation policy?",
    createdAt: "2026-02-13T22:00:00Z",
  },
  {
    id: "msg-020",
    conversationId: "conv-005",
    agentId: "agent-002",
    role: "assistant",
    content:
      "Good evening, Mr. Wilson. Our cancellation policy allows free cancellation up to 48 hours before your scheduled check-in. Cancellations within 48 hours incur a charge of one night's stay. No-shows are charged the full reservation amount. May I assist you with anything else?",
    confidence: 0.91,
    createdAt: "2026-02-13T22:00:05Z",
  },
];

// ---------------------------------------------------------------------------
// Mock Conversation Tags
// ---------------------------------------------------------------------------

export const mockConversationTags: ConversationTag[] = [
  { id: "tag-001", agentId: "agent-001", name: "reserva", color: "#3b82f6" },
  { id: "tag-002", agentId: "agent-001", name: "pedido", color: "#f59e0b" },
  { id: "tag-003", agentId: "agent-001", name: "queja", color: "#ef4444" },
  { id: "tag-004", agentId: "agent-001", name: "urgente", color: "#dc2626" },
  { id: "tag-005", agentId: "agent-001", name: "info", color: "#6b7280" },
  { id: "tag-006", agentId: "agent-001", name: "vip", color: "#8b5cf6" },
  { id: "tag-007", agentId: "agent-002", name: "reserva", color: "#3b82f6" },
  { id: "tag-008", agentId: "agent-002", name: "urgente", color: "#dc2626" },
  { id: "tag-009", agentId: "agent-002", name: "info", color: "#6b7280" },
  { id: "tag-010", agentId: "agent-002", name: "queja", color: "#ef4444" },
];

// ---------------------------------------------------------------------------
// Mock CRM Clients
// ---------------------------------------------------------------------------

export const mockCRMClients: CRMClient[] = [
  {
    id: "client-001",
    agentId: "agent-001",
    name: "Carlos Martinez",
    phone: "+52 55 1234 5678",
    email: "carlos.martinez@email.com",
    firstContactAt: "2026-01-10T14:00:00Z",
    lastContactAt: "2026-02-15T09:32:00Z",
    totalConversations: 3,
    totalMessages: 18,
    tags: ["frecuente", "vip"],
    notes: "Huésped frecuente. Prefiere habitaciones con vista al mar. Viaja con mascota pequeña.",
    status: "vip",
  },
  {
    id: "client-002",
    agentId: "agent-001",
    name: "Sarah Johnson",
    phone: "+1 310 555 0199",
    email: "sarah.j@gmail.com",
    firstContactAt: "2026-02-14T18:30:00Z",
    lastContactAt: "2026-02-14T18:45:00Z",
    totalConversations: 1,
    totalMessages: 4,
    tags: ["nuevo"],
    notes: "Primera visita. Llega el 20 de febrero. Necesita traslado aeropuerto.",
    status: "active",
  },
  {
    id: "client-003",
    agentId: "agent-001",
    name: "Ana Lopez",
    phone: "+52 33 9876 5432",
    firstContactAt: "2026-02-14T14:15:00Z",
    lastContactAt: "2026-02-14T14:20:00Z",
    totalConversations: 1,
    totalMessages: 3,
    tags: ["nuevo"],
    status: "active",
  },
  {
    id: "client-004",
    agentId: "agent-002",
    name: "Roberto Diaz",
    phone: "+52 81 5555 1234",
    email: "roberto.diaz@empresa.mx",
    firstContactAt: "2025-12-20T10:00:00Z",
    lastContactAt: "2026-02-15T07:10:00Z",
    totalConversations: 5,
    totalMessages: 22,
    tags: ["frecuente", "vip"],
    notes: "Cliente corporativo. Reserva actividades de aventura regularmente para su equipo.",
    status: "vip",
  },
  {
    id: "client-005",
    agentId: "agent-002",
    name: "James Wilson",
    phone: "+44 7700 900123",
    email: "j.wilson@uk.co",
    firstContactAt: "2026-02-13T22:00:00Z",
    lastContactAt: "2026-02-13T22:05:00Z",
    totalConversations: 1,
    totalMessages: 2,
    tags: ["nuevo"],
    status: "inactive",
  },
];

// ---------------------------------------------------------------------------
// Mock Integrations
// ---------------------------------------------------------------------------

export const mockIntegrations: Integration[] = [
  // agent-001
  { id: "int-001", agentId: "agent-001", name: "wompi", description: "Pagos en línea y recaudos", category: "payments", icon: "CreditCard", requiredPlan: "pro", enabled: true, environment: "sandbox", configured: true, credentials: { publicKey: "pub_test_abc123", privateKey: "prv_test_xyz789", eventsKey: "evt_test_def456" } },
  { id: "int-002", agentId: "agent-001", name: "bold", description: "Pasarela de pagos Colombia", category: "payments", icon: "CreditCard", requiredPlan: "pro", enabled: false },
  { id: "int-005", agentId: "agent-001", name: "invoicing", description: "DIAN Colombia", category: "operations", icon: "FileText", requiredPlan: "business", enabled: false },
  { id: "int-006", agentId: "agent-001", name: "logistics", description: "Seguimiento de envíos", category: "operations", icon: "Package", requiredPlan: "business", enabled: false },
  { id: "int-013", agentId: "agent-001", name: "google-sheets", description: "Lectura de catálogos y productos", category: "productivity", icon: "Table2", requiredPlan: "pro", enabled: false },
  { id: "int-014", agentId: "agent-001", name: "google-calendar", description: "Agenda de reservas y citas", category: "productivity", icon: "Calendar", requiredPlan: "pro", enabled: false },
  { id: "int-015", agentId: "agent-001", name: "gmail", description: "Confirmaciones y seguimiento por email", category: "productivity", icon: "Mail", requiredPlan: "pro", enabled: false },
  { id: "int-016", agentId: "agent-001", name: "woocommerce", description: "Catálogo y pedidos WooCommerce", category: "ecommerce", icon: "Globe", requiredPlan: "business", enabled: false },
  { id: "int-017", agentId: "agent-001", name: "shopify", description: "Catálogo y pedidos Shopify", category: "ecommerce", icon: "ShoppingBag", requiredPlan: "business", enabled: false },
  // agent-002
  { id: "int-007", agentId: "agent-002", name: "wompi", description: "Pagos en línea y recaudos", category: "payments", icon: "CreditCard", requiredPlan: "pro", enabled: false },
  { id: "int-008", agentId: "agent-002", name: "bold", description: "Pasarela de pagos Colombia", category: "payments", icon: "CreditCard", requiredPlan: "pro", enabled: true, environment: "sandbox", configured: true, credentials: { apiKey: "bold_test_key_123", secretKey: "bold_test_secret_456" } },
  { id: "int-011", agentId: "agent-002", name: "invoicing", description: "DIAN Colombia", category: "operations", icon: "FileText", requiredPlan: "business", enabled: false },
  { id: "int-012", agentId: "agent-002", name: "logistics", description: "Seguimiento de envíos", category: "operations", icon: "Package", requiredPlan: "business", enabled: false },
  { id: "int-018", agentId: "agent-002", name: "google-sheets", description: "Lectura de catálogos y productos", category: "productivity", icon: "Table2", requiredPlan: "pro", enabled: false },
  { id: "int-019", agentId: "agent-002", name: "google-calendar", description: "Agenda de reservas y citas", category: "productivity", icon: "Calendar", requiredPlan: "pro", enabled: false },
  { id: "int-020", agentId: "agent-002", name: "gmail", description: "Confirmaciones y seguimiento por email", category: "productivity", icon: "Mail", requiredPlan: "pro", enabled: false },
  { id: "int-021", agentId: "agent-002", name: "woocommerce", description: "Catálogo y pedidos WooCommerce", category: "ecommerce", icon: "Globe", requiredPlan: "business", enabled: false },
  { id: "int-022", agentId: "agent-002", name: "shopify", description: "Catálogo y pedidos Shopify", category: "ecommerce", icon: "ShoppingBag", requiredPlan: "business", enabled: false },
];

// ---------------------------------------------------------------------------
// Dashboard Stats
// ---------------------------------------------------------------------------

export const mockDashboardStats: DashboardStats = {
  totalAgents: 3,
  activeAgents: 2,
  totalMessages: 2081,
  messagesThisWeek: 187,
  messagesLastWeek: 153,
  totalConversations: 124,
  avgResponseTime: "4.2s",
  satisfactionRate: 94.5,
};

// ---------------------------------------------------------------------------
// Weekly Message Data
// ---------------------------------------------------------------------------

export const mockWeeklyMessages: WeeklyMessageData[] = [
  { day: "Mon", messages: 32 },
  { day: "Tue", messages: 28 },
  { day: "Wed", messages: 35 },
  { day: "Thu", messages: 22 },
  { day: "Fri", messages: 41 },
  { day: "Sat", messages: 18 },
  { day: "Sun", messages: 11 },
];

// ---------------------------------------------------------------------------
// Mock Import Products (3 sources)
// ---------------------------------------------------------------------------

export const mockImportProducts = {
  ecommerce: [
    { name: "Camiseta Logo Premium", description: "Camiseta 100% algodón con logo bordado. Disponible en negro, blanco y gris.", price: 349, category: "Ropa", sku: "CAM-001", stock: 120, variants: [{ name: "Talla", options: ["S", "M", "L", "XL"] }, { name: "Color", options: ["Negro", "Blanco", "Gris"] }], isActive: true },
    { name: "Gorra Snapback", description: "Gorra ajustable con visera plana y logo bordado.", price: 199, category: "Accesorios", sku: "GOR-001", stock: 85, variants: [{ name: "Color", options: ["Negro", "Azul marino"] }], isActive: true },
    { name: "Tenis Running Pro", description: "Tenis deportivos con suela de gel y malla transpirable.", price: 1299, category: "Calzado", sku: "TEN-001", stock: 45, variants: [{ name: "Talla", options: ["25", "26", "27", "28", "29"] }], isActive: true },
    { name: "Mochila Urban 25L", description: "Mochila resistente al agua con compartimento para laptop 15\".", price: 599, category: "Accesorios", sku: "MOC-001", stock: 60, variants: [], isActive: true },
  ],
  sheets: [
    { name: "Aceite de Oliva Extra Virgen 500ml", description: "Aceite importado de España, primera prensada en frío.", price: 189, category: "Alimentos", sku: "ALI-001", stock: 200, variants: [], isActive: true },
    { name: "Jabón Artesanal Lavanda", description: "Jabón natural hecho a mano con aceites esenciales de lavanda.", price: 85, category: "Cuidado personal", sku: "JAB-001", stock: 150, variants: [{ name: "Peso", options: ["100g", "200g"] }], isActive: true },
    { name: "Vela Aromática Soja", description: "Vela de cera de soja con aroma a vainilla. 40 horas de duración.", price: 245, category: "Hogar", sku: "VEL-001", stock: 90, variants: [{ name: "Aroma", options: ["Vainilla", "Canela", "Lavanda"] }], isActive: true },
  ],
  scraping: [
    { name: "Suite Presidencial", description: "Habitación de lujo con vista panorámica al mar, sala de estar privada, jacuzzi en terraza y servicio de mayordomo incluido. Capacidad máxima 4 personas.", price: 8500, category: "Habitaciones", stock: 2, variants: [{ name: "Vista", options: ["Mar", "Ciudad"] }], isActive: true },
    { name: "Tour Snorkel + Cenote", description: "Excursión de día completo incluyendo snorkel en arrecife de coral, visita a cenote sagrado, comida típica y transporte ida y vuelta desde el hotel.", price: 1800, category: "Experiencias", stock: 20, variants: [{ name: "Horario", options: ["7:00 AM", "9:00 AM"] }], isActive: true },
    { name: "Paquete Spa Relajante", description: "Circuito completo de spa con masaje de piedras calientes 60 min, facial hidratante, acceso a sauna y vapor, y copa de vino espumoso de cortesía.", price: 2200, category: "Bienestar", stock: 10, variants: [{ name: "Duración", options: ["60 min", "90 min", "120 min"] }], isActive: true },
  ],
};

// ---------------------------------------------------------------------------
// FAQ Templates
// ---------------------------------------------------------------------------

export const faqTemplates: { question: string; answer: string; category: string }[] = [
  {
    question: "¿Cuáles son los horarios de check-in y check-out?",
    answer:
      "El check-in es a las 3:00 PM y el check-out a las 12:00 PM. El check-in anticipado y check-out tardío pueden estar disponibles bajo solicitud.",
    category: "General",
  },
  {
    question: "¿Hay WiFi disponible?",
    answer:
      "Sí, WiFi de alta velocidad gratuito está disponible en todas las habitaciones y áreas públicas.",
    category: "Amenidades",
  },
  {
    question: "¿Tienen alberca?",
    answer:
      "Sí, nuestra alberca está abierta todos los días de 7:00 AM a 10:00 PM. Las toallas se proporcionan en el área.",
    category: "Amenidades",
  },
  {
    question: "¿Qué opciones de comida tienen?",
    answer:
      "Contamos con un restaurante que sirve desayuno, comida y cena. También ofrecemos servicio a la habitación.",
    category: "Gastronomía",
  },
  {
    question: "¿Tienen estacionamiento?",
    answer:
      "Sí, ofrecemos estacionamiento gratuito para todos los huéspedes. El servicio de valet está disponible con cargo adicional.",
    category: "Servicios",
  },
  {
    question: "¿Aceptan mascotas?",
    answer:
      "Las mascotas pequeñas son bienvenidas en habitaciones pet-friendly designadas con un cargo adicional por noche. Por favor notifícanos al reservar.",
    category: "Políticas",
  },
  {
    question: "¿Ofrecen traslado al aeropuerto?",
    answer:
      "Sí, el servicio de traslado al aeropuerto está disponible. Por favor reserva con al menos 24 horas de anticipación en recepción.",
    category: "Servicios",
  },
  {
    question: "¿Cuál es la política de cancelación?",
    answer:
      "Cancelación gratuita hasta 48 horas antes del check-in. Las cancelaciones tardías se cobran una noche de estadía.",
    category: "Políticas",
  },
  {
    question: "¿Tienen gimnasio?",
    answer:
      "Sí, nuestro gimnasio está abierto las 24 horas e incluye máquinas de cardio, pesas libres y tapetes de yoga.",
    category: "Amenidades",
  },
  {
    question: "¿Tienen spa?",
    answer:
      "Sí, nuestro spa ofrece masajes, faciales y tratamientos corporales. Se recomienda hacer reservación.",
    category: "Amenidades",
  },
  {
    question: "¿Ofrecen servicio a la habitación?",
    answer:
      "Sí, el servicio a la habitación está disponible de 6:00 AM a 11:00 PM. Un menú nocturno está disponible hasta la 1:00 AM.",
    category: "Gastronomía",
  },
  {
    question: "¿Tienen transporte a atracciones cercanas?",
    answer:
      "Sí, ofrecemos transporte gratuito a las principales atracciones cercanas. Consulta en recepción los horarios disponibles.",
    category: "Servicios",
  },
];

// ---------------------------------------------------------------------------
// Mock Hotel Contacts (for agent-001)
// ---------------------------------------------------------------------------

export const mockContacts: HotelContact[] = [
  {
    id: "contact-001",
    agentId: "agent-001",
    name: "Recepción",
    phone: "+52 998 123 4567",
    category: "Hotel",
    description: "Atención 24 horas",
    isActive: true,
  },
  {
    id: "contact-002",
    agentId: "agent-001",
    name: "Restaurante Mar Abierto",
    phone: "+52 998 123 4568",
    category: "Gastronomía",
    description: "Reservaciones y servicio a habitación",
    isActive: true,
  },
  {
    id: "contact-003",
    agentId: "agent-001",
    name: "Spa & Bienestar",
    phone: "+52 998 123 4569",
    category: "Amenidades",
    description: "Citas y tratamientos",
    isActive: true,
  },
  {
    id: "contact-004",
    agentId: "agent-001",
    name: "Transporte aeropuerto",
    phone: "+52 998 555 1234",
    category: "Transporte",
    description: "Traslados y tours",
    isActive: true,
  },
  {
    id: "contact-005",
    agentId: "agent-001",
    name: "Emergencias",
    phone: "911",
    category: "Emergencias",
    description: "Policía, bomberos, ambulancia",
    isActive: true,
  },
];
