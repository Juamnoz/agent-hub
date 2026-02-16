export type AgentStatus = "active" | "inactive" | "setup";

export interface SocialLinks {
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  tripadvisor?: string;
  googleMaps?: string;
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
  socialLinks?: SocialLinks;
  messageCount: number;
  faqCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface Conversation {
  id: string;
  agentId: string;
  contactPhone: string;
  contactName: string;
  messageCount: number;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  agentId: string;
  role: "user" | "assistant";
  content: string;
  matchedFaqId?: string;
  confidence?: number;
  createdAt: string;
}

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
      "Friendly and knowledgeable concierge who loves helping guests discover local attractions and ensures a comfortable stay.",
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
    messageCount: 1247,
    faqCount: 8,
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
      "Professional and attentive assistant specializing in mountain resort services and adventure tourism.",
    tone: "formal",
    language: "es",
    whatsappConnected: true,
    whatsappPhoneNumber: "+52 614 987 6543",
    messageCount: 834,
    faqCount: 6,
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
      "Trendy and laid-back assistant for a boutique hotel in the Roma neighborhood.",
    tone: "casual",
    language: "es",
    whatsappConnected: false,
    messageCount: 0,
    faqCount: 0,
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
    question: "What are the check-in and check-out times?",
    answer:
      "Check-in is at 3:00 PM and check-out is at 12:00 PM. Early check-in and late check-out are available upon request, subject to availability. Please contact the front desk to arrange.",
    category: "General",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "faq-002",
    agentId: "agent-001",
    question: "Is WiFi available at the hotel?",
    answer:
      "Yes! Complimentary high-speed WiFi is available throughout the hotel, including all rooms, the lobby, pool area, and restaurant. The network name and password are provided at check-in.",
    category: "Amenities",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "faq-003",
    agentId: "agent-001",
    question: "What are the pool hours?",
    answer:
      "Our pool is open daily from 7:00 AM to 10:00 PM. Towels are provided poolside. We also offer a swim-up bar open from 11:00 AM to 8:00 PM.",
    category: "Amenities",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "faq-004",
    agentId: "agent-001",
    question: "Does the hotel have a restaurant?",
    answer:
      "Yes, we have two on-site restaurants. 'Mar Abierto' serves breakfast (7-11 AM), lunch (12-4 PM), and dinner (6-10 PM). 'La Terraza' is our rooftop bar and grill open from 5 PM to midnight.",
    category: "Dining",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "faq-005",
    agentId: "agent-001",
    question: "Is parking available?",
    answer:
      "Yes, we offer complimentary self-parking for all guests. Valet parking is also available for $150 MXN per night. Electric vehicle charging stations are located in the parking garage.",
    category: "Services",
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "faq-006",
    agentId: "agent-001",
    question: "Are pets allowed?",
    answer:
      "We welcome small pets (under 10 kg) in select pet-friendly rooms for an additional fee of $300 MXN per night. Please inform us at the time of booking so we can prepare your room accordingly.",
    category: "Policies",
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "faq-007",
    agentId: "agent-001",
    question: "Do you offer airport transfer services?",
    answer:
      "Yes, we provide airport shuttle service for $450 MXN per trip (one way). Transfers can be booked through the front desk or by sending us a WhatsApp message at least 24 hours in advance.",
    category: "Services",
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "faq-008",
    agentId: "agent-001",
    question: "What is the cancellation policy?",
    answer:
      "Free cancellation is available up to 48 hours before check-in. Cancellations made within 48 hours will be charged one night's stay. No-shows are charged the full reservation amount.",
    category: "Policies",
    sortOrder: 8,
    isActive: true,
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
    messageCount: 6,
    lastMessageAt: "2026-02-15T09:32:00Z",
  },
  {
    id: "conv-002",
    agentId: "agent-001",
    contactPhone: "+1 310 555 0199",
    contactName: "Sarah Johnson",
    messageCount: 4,
    lastMessageAt: "2026-02-14T18:45:00Z",
  },
  {
    id: "conv-003",
    agentId: "agent-001",
    contactPhone: "+52 33 9876 5432",
    contactName: "Ana Lopez",
    messageCount: 3,
    lastMessageAt: "2026-02-14T14:20:00Z",
  },
  {
    id: "conv-004",
    agentId: "agent-002",
    contactPhone: "+52 81 5555 1234",
    contactName: "Roberto Diaz",
    messageCount: 5,
    lastMessageAt: "2026-02-15T07:10:00Z",
  },
  {
    id: "conv-005",
    agentId: "agent-002",
    contactPhone: "+44 7700 900123",
    contactName: "James Wilson",
    messageCount: 2,
    lastMessageAt: "2026-02-13T22:05:00Z",
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
// FAQ Templates
// ---------------------------------------------------------------------------

export const faqTemplates: { question: string; answer: string; category: string }[] = [
  {
    question: "What are the check-in and check-out times?",
    answer:
      "Check-in is at 3:00 PM and check-out is at 12:00 PM. Early check-in and late check-out may be available upon request.",
    category: "General",
  },
  {
    question: "Is WiFi available?",
    answer:
      "Yes, complimentary high-speed WiFi is available in all rooms and public areas.",
    category: "Amenities",
  },
  {
    question: "Do you have a swimming pool?",
    answer:
      "Yes, our pool is open daily from 7:00 AM to 10:00 PM. Towels are provided poolside.",
    category: "Amenities",
  },
  {
    question: "What dining options are available?",
    answer:
      "We have an on-site restaurant serving breakfast, lunch, and dinner. Room service is also available.",
    category: "Dining",
  },
  {
    question: "Is parking available?",
    answer:
      "Yes, we offer complimentary self-parking for all guests. Valet parking is available for an additional fee.",
    category: "Services",
  },
  {
    question: "Are pets allowed?",
    answer:
      "Small pets are welcome in designated pet-friendly rooms for an additional nightly fee. Please notify us at booking.",
    category: "Policies",
  },
  {
    question: "Do you offer airport transfers?",
    answer:
      "Yes, airport shuttle service is available. Please book at least 24 hours in advance through the front desk.",
    category: "Services",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      "Free cancellation up to 48 hours before check-in. Late cancellations are charged one night's stay.",
    category: "Policies",
  },
  {
    question: "Do you have a gym or fitness center?",
    answer:
      "Yes, our fitness center is open 24 hours and includes cardio machines, free weights, and yoga mats.",
    category: "Amenities",
  },
  {
    question: "Is there a spa at the hotel?",
    answer:
      "Yes, our spa offers massages, facials, and body treatments. Reservations are recommended.",
    category: "Amenities",
  },
  {
    question: "Do you offer room service?",
    answer:
      "Yes, room service is available from 6:00 AM to 11:00 PM daily. A late-night menu is available until 1:00 AM.",
    category: "Dining",
  },
  {
    question: "Is there a shuttle to nearby attractions?",
    answer:
      "Yes, we offer a complimentary shuttle to major nearby attractions. Please check with the front desk for the schedule.",
    category: "Services",
  },
];
