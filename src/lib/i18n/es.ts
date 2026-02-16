import type { Translations } from "./types";

export const es: Translations = {
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    back: "Volver",
    loading: "Cargando...",
    notFound: "No encontrado",
    signOut: "Cerrar sesión",
    signIn: "Iniciar sesión",
    getStarted: "Comenzar",
    learnMore: "Más información",
    search: "Buscar",
    noResults: "Sin resultados",
    success: "Operación exitosa",
    error: "Ocurrió un error",
    confirm: "Confirmar",
    language: "Idioma",
  },
  nav: {
    dashboard: "Panel",
    agents: "Agentes",
    billing: "Facturación",
    settings: "Configuración",
  },
  landing: {
    badge: "Plataforma de agentes IA para hoteles",
    heroTitle: "Automatiza la atención al huésped con",
    heroHighlight: "agentes inteligentes",
    heroDescription:
      "Crea agentes de IA personalizados que responden las preguntas de tus huéspedes por WhatsApp, las 24 horas del día, los 7 días de la semana.",
    startTrial: "Prueba gratis",
    seeHow: "Ver cómo funciona",
    featuresTitle: "Todo lo que necesitas",
    featuresDescription:
      "Herramientas potentes para gestionar la comunicación con tus huéspedes de forma automatizada.",
    features: {
      whatsapp: {
        title: "Integración con WhatsApp",
        description:
          "Conecta tu número de WhatsApp Business y responde a tus huéspedes automáticamente.",
      },
      customAgents: {
        title: "Agentes personalizados",
        description:
          "Configura agentes con la personalidad y tono de tu hotel para una experiencia única.",
      },
      instantResponses: {
        title: "Respuestas instantáneas",
        description:
          "Tus huéspedes reciben respuestas al momento, sin importar la hora del día.",
      },
      multilingual: {
        title: "Soporte multilingüe",
        description:
          "Atiende a huéspedes en español, inglés, portugués y francés sin esfuerzo.",
      },
      selfHosted: {
        title: "Autoalojado",
        description:
          "Mantén el control total de tus datos con una solución que puedes alojar en tu propia infraestructura.",
      },
      faqTemplates: {
        title: "Plantillas de FAQs",
        description:
          "Usa plantillas predefinidas para hoteles y personalízalas según tus necesidades.",
      },
    },
    pricingTitle: "Precio simple y transparente",
    pricingDescription:
      "Un solo plan con todo incluido. Sin sorpresas ni costes ocultos.",
    proPlan: "Plan Pro",
    perMonth: "/mes",
    planFeatures: [
      "Hasta 5 agentes",
      "10,000 mensajes/mes",
      "Integración con WhatsApp",
      "FAQs ilimitadas",
      "Analíticas avanzadas",
      "Soporte prioritario",
    ],
    footer: "Hecho con dedicación para la industria hotelera.",
  },
  dashboard: {
    title: "Panel de control",
    totalAgents: "Total de agentes",
    activeAgents: "Agentes activos",
    messagesThisWeek: "Mensajes esta semana",
    avgResponseTime: "Tiempo medio de respuesta",
    yourAgents: "Tus agentes",
    createAgent: "Crear agente",
    noAgentsTitle: "No tienes agentes aún",
    noAgentsDescription:
      "Crea tu primer agente para empezar a automatizar la atención al huésped.",
    createFirstAgent: "Crear primer agente",
    vsLastWeek: "vs. semana pasada",
  },
  agents: {
    title: "Agentes",
    newAgent: "Nuevo agente",
    createTitle: "Crear nuevo agente",
    agentName: "Nombre del agente",
    agentNamePlaceholder: "Ej: Asistente del Hotel Sol",
    hotelName: "Nombre del hotel",
    hotelNamePlaceholder: "Ej: Hotel Sol Playa",
    language: "Idioma",
    tone: "Tono",
    toneOptions: {
      formal: "Formal",
      friendly: "Amigable",
      casual: "Casual",
    },
    languageOptions: {
      es: "Español",
      en: "Inglés",
      pt: "Portugués",
      fr: "Francés",
    },
    status: {
      active: "Activo",
      inactive: "Inactivo",
      setup: "Configurando",
    },
    msgs: "msgs",
    faqs: "FAQs",
    noAgentsTitle: "Sin agentes",
    noAgentsDescription:
      "Todavía no has creado ningún agente. Crea uno para empezar.",
    agentNotFound: "Agente no encontrado",
    agentNotFoundDescription:
      "El agente que buscas no existe o fue eliminado.",
    backToAgents: "Volver a agentes",
    overview: "Resumen",
    agentInfo: "Información del agente",
    hotel: "Hotel",
    personality: "Personalidad",
    personalityPlaceholder:
      "Describe cómo debe comportarse el agente con los huéspedes...",
    systemPrompt: "Prompt del sistema",
    systemPromptDescription:
      "Instrucciones avanzadas que definen el comportamiento del agente.",
    quickStats: "Estadísticas rápidas",
    messages: "Mensajes",
    whatsappConnected: "WhatsApp conectado",
    connected: "Conectado",
    notConnected: "No conectado",
    editSettings: "Editar configuración",
  },
  faqEditor: {
    title: "Preguntas frecuentes",
    addFaq: "Agregar FAQ",
    editFaq: "Editar FAQ",
    loadTemplates: "Cargar plantillas",
    useHotelTemplates: "Usar plantillas para hoteles",
    noFaqsTitle: "Sin preguntas frecuentes",
    noFaqsDescription:
      "Agrega preguntas frecuentes para que tu agente pueda responder consultas comunes.",
    addFirstFaq: "Agregar primera FAQ",
    question: "Pregunta",
    questionPlaceholder: "Ej: ¿Cuál es el horario de check-in?",
    answer: "Respuesta",
    answerPlaceholder:
      "Ej: El check-in es a partir de las 15:00 horas.",
    category: "Categoría",
    categoryPlaceholder: "Ej: Check-in / Check-out",
    saveChanges: "Guardar cambios",
    faqUpdated: "FAQ actualizada correctamente",
    faqAdded: "FAQ agregada correctamente",
    faqDeleted: "FAQ eliminada correctamente",
    templatesLoaded: "Plantillas cargadas correctamente",
    required: "Este campo es obligatorio",
  },
  whatsapp: {
    title: "Conexión con WhatsApp",
    description:
      "Conecta tu cuenta de WhatsApp Business para que tu agente pueda recibir y responder mensajes.",
    connectedTitle: "WhatsApp conectado",
    connectedDescription:
      "Tu agente está recibiendo y respondiendo mensajes de WhatsApp.",
    disconnect: "Desconectar",
    steps: {
      createApp: {
        title: "Crear aplicación en Meta",
        description:
          "Ve a Meta for Developers y crea una nueva aplicación de tipo Business.",
      },
      configure: {
        title: "Configurar WhatsApp",
        description:
          "Agrega el producto WhatsApp a tu aplicación y configura un número de teléfono.",
      },
      webhook: {
        title: "Configurar webhook",
        description:
          "Copia la URL del webhook y configúrala en tu aplicación de Meta.",
      },
      credentials: {
        title: "Ingresar credenciales",
        description:
          "Ingresa tu token de acceso y el ID de tu número de teléfono.",
      },
      test: {
        title: "Probar conexión",
        description:
          "Envía un mensaje de prueba para verificar que todo funciona correctamente.",
      },
    },
    accessToken: "Token de acceso",
    phoneNumberId: "ID del número de teléfono",
    connect: "Conectar",
    webhookUrl: "URL del webhook",
    webhookCopied: "URL del webhook copiada al portapapeles",
    connectionSuccess: "Conexión con WhatsApp establecida correctamente",
    openMeta: "Abrir Meta for Developers",
    next: "Siguiente",
    back: "Anterior",
    fillCredentials: "Completa las credenciales para continuar",
  },
  analytics: {
    title: "Analíticas",
    totalMessages: "Total de mensajes",
    conversations: "Conversaciones",
    avgConfidence: "Confianza promedio",
    responseTime: "Tiempo de respuesta",
    messagesThisWeek: "Mensajes esta semana",
    recentConversations: "Conversaciones recientes",
    latestInteractions: "Últimas interacciones",
    noConversations: "Aún no hay conversaciones registradas",
    messagesCount: "mensajes",
    performanceMetrics: "Métricas de rendimiento",
  },
  billing: {
    title: "Facturación",
    currentPlan: "Plan actual",
    proPlan: "Plan Pro",
    perMonth: "/mes",
    active: "Activo",
    usage: "Uso",
    agentsUsage: "Agentes utilizados",
    messagesUsage: "Mensajes utilizados",
    whatsappLines: "Líneas de WhatsApp",
    manageSubscription: "Gestionar suscripción",
    cancelPlan: "Cancelar plan",
    paymentMethod: "Método de pago",
    visaEnding: "Visa terminada en",
    expires: "Expira",
    updatePayment: "Actualizar método de pago",
    subscriptionManaged: "Redirigido al portal de suscripción",
    planCancelled: "Plan cancelado correctamente",
  },
  settingsPage: {
    title: "Configuración",
    profile: "Perfil",
    profileDescription: "Gestiona tu información personal y preferencias.",
    name: "Nombre",
    email: "Correo electrónico",
    notifications: "Notificaciones",
    emailNotifications: "Notificaciones por correo",
    emailNotificationsDesc:
      "Recibe notificaciones importantes en tu correo electrónico.",
    weeklyReports: "Reportes semanales",
    weeklyReportsDesc:
      "Recibe un resumen semanal del rendimiento de tus agentes.",
    agentAlerts: "Alertas de agentes",
    agentAlertsDesc:
      "Recibe alertas cuando un agente necesite atención o tenga problemas.",
    saved: "Configuración guardada correctamente",
    dangerZone: "Zona de peligro",
    deleteAccount: "Eliminar cuenta",
    deleteAccountDescription:
      "Elimina permanentemente tu cuenta y todos los datos asociados.",
    deleteAccountConfirm:
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.",
    deleteAccountWarning:
      "Todos tus agentes, FAQs y configuraciones serán eliminados permanentemente.",
  },
  agentSettings: {
    title: "Configuración del agente",
    configure: "Configurar",
    basicInfo: "Información básica",
    basicInfoDescription:
      "Configura el nombre, hotel e idioma de tu agente.",
    personalityTone: "Personalidad y tono",
    personalityToneDescription:
      "Define cómo se comunica tu agente con los huéspedes.",
    dangerZone: "Zona de peligro",
    dangerZoneDescription:
      "Acciones irreversibles relacionadas con este agente.",
    deleteAgent: "Eliminar agente",
    deleteConfirmTitle: "¿Eliminar este agente?",
    deleteConfirmDescription:
      "Esta acción es permanente. Se eliminarán todas las FAQs, conversaciones y configuraciones del agente.",
    deletePermanently: "Eliminar permanentemente",
    settingsSaved: "Configuración del agente guardada",
    agentDeleted: "Agente eliminado correctamente",
    agentCreated: "Agente creado correctamente",
    fillRequired: "Completa todos los campos obligatorios",
  },
};
