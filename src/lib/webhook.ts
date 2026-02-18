const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || "";

export type WebhookEvent =
  | "agent.created"
  | "agent.updated"
  | "agent.deleted"
  | "faq.created"
  | "faq.updated"
  | "faq.deleted"
  | "faq.templates_loaded"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "product.imported"
  | "settings.updated";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function sendWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  if (!WEBHOOK_URL) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`Webhook failed for event ${event}:`, error);
  }
}
