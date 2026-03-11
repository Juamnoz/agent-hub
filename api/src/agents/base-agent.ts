import { anthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { z } from "zod";
import { db } from "../db/index.js";
import { reservations, orders } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { Agent, FAQ, Product } from "../db/schema.js";

export interface AgentContext {
  agent: Agent & { faqs?: FAQ[]; products?: Product[] };
  faqs: FAQ[];
  products: Product[];
  history: Array<{ role: "user" | "assistant"; content: string }>;
  incomingMessage: string;
}

export async function runAgent(ctx: AgentContext): Promise<string> {
  const tools = buildTools(ctx);

  const result = await generateText({
    model: anthropic("claude-sonnet-4-6") as any,
    system: buildSystemPrompt(ctx),
    messages: [
      ...ctx.history,
      { role: "user", content: ctx.incomingMessage },
    ],
    tools,
    maxSteps: 5,
  });

  return result.text;
}

function buildSystemPrompt(ctx: AgentContext): string {
  const { agent, faqs, products } = ctx;

  const faqSection =
    faqs.length > 0
      ? `\nPREGUNTAS FRECUENTES:\n${faqs
          .filter((f) => f.isActive)
          .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
          .join("\n\n")}`
      : "";

  const productSection =
    products.length > 0
      ? `\nPRODUCTOS/SERVICIOS DISPONIBLES:\n${products
          .filter((p) => p.isActive)
          .map(
            (p) =>
              `- ${p.name}: $${(p.price / 100).toFixed(0)} — ${p.description ?? ""}`
          )
          .join("\n")}`
      : "";

  return `
Eres ${agent.name}, el asistente de WhatsApp de ${agent.hotelName}.

PERSONALIDAD: ${agent.personality || "Amable y profesional"}
TONO: ${agent.tone}
IDIOMA: ${agent.language}
${agent.knowledgeBase ? `\nINFORMACIÓN DEL NEGOCIO:\n${agent.knowledgeBase}` : ""}
${faqSection}
${productSection}

INSTRUCCIONES CRÍTICAS:
- Responde SOLO en el idioma del cliente
- Mensajes cortos y claros para WhatsApp (máx 3 párrafos)
- Si no sabes algo, no inventes — di que consultarás
- Usa los tools disponibles para acciones concretas (reservas, pedidos)
- Sé empático y orientado a solucionar
`.trim();
}

function buildTools(ctx: AgentContext) {
  const agentId = ctx.agent.id;
  const algorithmType = ctx.agent.algorithmType;

  const commonTools = {
    get_business_info: tool({
      description:
        "Obtener información del negocio: horarios, ubicación, contacto",
      parameters: z.object({
        topic: z
          .string()
          .describe(
            "Tema a consultar: horarios, ubicacion, contacto, servicios"
          ),
      }),
      execute: async ({ topic }: { topic: string }) => ({
        topic,
        info: ctx.agent.knowledgeBase ?? "Información no disponible",
      }),
    }),
  };

  if (algorithmType === "hotel") {
    return {
      ...commonTools,
      check_availability: tool({
        description:
          "Verificar disponibilidad de habitaciones para las fechas solicitadas",
        parameters: z.object({
          checkIn: z.string().describe("Fecha de entrada YYYY-MM-DD"),
          checkOut: z.string().describe("Fecha de salida YYYY-MM-DD"),
          guests: z.number().default(1),
          roomType: z.string().optional(),
        }),
        execute: async ({
          checkIn,
          checkOut,
          guests,
        }: {
          checkIn: string;
          checkOut: string;
          guests: number;
          roomType?: string;
        }) => {
          const existing = await db.query.reservations.findMany({
            where: eq(reservations.agentId, agentId),
          });
          return {
            available: existing.filter((r) => r.status === "confirmed").length < 10,
            checkIn,
            checkOut,
            guests,
            roomTypes: ["Estándar", "Suite", "Deluxe"],
            pricePerNight: 150000,
          };
        },
      }),

      create_reservation: tool({
        description: "Crear una reserva cuando el cliente confirma",
        parameters: z.object({
          clientName: z.string(),
          clientPhone: z.string(),
          date: z.string(),
          time: z.string(),
          roomType: z.string(),
          partySize: z.number().default(1),
          notes: z.string().optional(),
        }),
        execute: async (data: {
          clientName: string;
          clientPhone: string;
          date: string;
          time: string;
          roomType: string;
          partySize: number;
          notes?: string;
        }) => {
          const [reservation] = await db
            .insert(reservations)
            .values({ agentId, ...data, status: "confirmed", source: "whatsapp" })
            .returning();
          return {
            success: true,
            reservationId: reservation.id,
            confirmationCode: reservation.id.slice(0, 8).toUpperCase(),
          };
        },
      }),
    };
  }

  if (algorithmType === "restaurant") {
    return {
      ...commonTools,
      get_menu: tool({
        description: "Obtener el menú del restaurante",
        parameters: z.object({
          category: z.string().optional(),
        }),
        execute: async ({ category }: { category?: string }) => {
          const items = ctx.products.filter(
            (p) => p.isActive && (!category || p.category === category)
          );
          return {
            items: items.map((p) => ({
              name: p.name,
              price: `$${(p.price / 100).toFixed(0)}`,
              description: p.description,
              category: p.category,
            })),
          };
        },
      }),

      create_order: tool({
        description: "Crear un pedido cuando el cliente selecciona items",
        parameters: z.object({
          clientName: z.string(),
          clientPhone: z.string(),
          items: z.array(
            z.object({
              name: z.string(),
              qty: z.number().int().min(1),
              price: z.number(),
            })
          ),
          notes: z.string().optional(),
        }),
        execute: async (data: {
          clientName: string;
          clientPhone: string;
          items: Array<{ name: string; qty: number; price: number }>;
          notes?: string;
        }) => {
          const total = data.items.reduce(
            (s: number, i: { price: number; qty: number }) => s + i.price * i.qty,
            0
          );
          const [order] = await db
            .insert(orders)
            .values({
              agentId,
              clientName: data.clientName,
              clientPhone: data.clientPhone,
              items: data.items,
              total,
              notes: data.notes,
              status: "pending",
            })
            .returning();
          return { success: true, orderId: order.id, total: `$${(total / 100).toFixed(0)}` };
        },
      }),

      create_reservation: tool({
        description: "Reservar mesa en el restaurante",
        parameters: z.object({
          clientName: z.string(),
          clientPhone: z.string(),
          date: z.string(),
          time: z.string(),
          partySize: z.number().int().min(1),
          notes: z.string().optional(),
        }),
        execute: async (data: {
          clientName: string;
          clientPhone: string;
          date: string;
          time: string;
          partySize: number;
          notes?: string;
        }) => {
          const [reservation] = await db
            .insert(reservations)
            .values({ agentId, ...data, status: "confirmed", source: "whatsapp" })
            .returning();
          return {
            success: true,
            reservationId: reservation.id,
            confirmationCode: reservation.id.slice(0, 8).toUpperCase(),
          };
        },
      }),
    };
  }

  if (algorithmType === "appointments") {
    return {
      ...commonTools,
      check_slots: tool({
        description: "Verificar horarios disponibles para una cita",
        parameters: z.object({
          date: z.string(),
          service: z.string().optional(),
        }),
        execute: async ({ date }: { date: string; service?: string }) => {
          const existing = await db.query.reservations.findMany({
            where: eq(reservations.agentId, agentId),
          });
          const takenTimes = existing
            .filter((r) => r.date === date && r.status !== "cancelled")
            .map((r) => r.time);
          const allSlots = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
          ];
          return { date, available: allSlots.filter((s) => !takenTimes.includes(s)) };
        },
      }),

      book_appointment: tool({
        description: "Agendar una cita cuando el cliente elige horario",
        parameters: z.object({
          clientName: z.string(),
          clientPhone: z.string(),
          date: z.string(),
          time: z.string(),
          service: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async (data: {
          clientName: string;
          clientPhone: string;
          date: string;
          time: string;
          service?: string;
          notes?: string;
        }) => {
          const [reservation] = await db
            .insert(reservations)
            .values({
              agentId,
              clientName: data.clientName,
              clientPhone: data.clientPhone,
              date: data.date,
              time: data.time,
              notes: data.notes ?? data.service,
              partySize: 1,
              status: "confirmed",
              source: "whatsapp",
            })
            .returning();
          return {
            success: true,
            appointmentId: reservation.id,
            confirmationCode: reservation.id.slice(0, 8).toUpperCase(),
          };
        },
      }),
    };
  }

  // ecommerce, whatsapp-store, inmobiliaria
  return {
    ...commonTools,
    search_products: tool({
      description: "Buscar productos o servicios disponibles",
      parameters: z.object({
        query: z.string().optional(),
        category: z.string().optional(),
      }),
      execute: async ({ query, category }: { query?: string; category?: string }) => {
        const results = ctx.products.filter((p) => {
          if (!p.isActive) return false;
          if (category && p.category !== category) return false;
          if (query) {
            const q = query.toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              (p.description?.toLowerCase().includes(q) ?? false)
            );
          }
          return true;
        });
        return {
          products: results.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.name,
            price: `$${(p.price / 100).toFixed(0)}`,
            description: p.description,
            category: p.category,
          })),
        };
      },
    }),
  };
}
