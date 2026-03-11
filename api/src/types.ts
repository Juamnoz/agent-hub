import { Hono } from "hono";

// Variables que el middleware de auth inyecta en el contexto
export type HonoVariables = {
  userId: string;
  userEmail: string;
  planTier: string;
  role: string;
  orgId: string;
};

export type HonoEnv = { Variables: HonoVariables };

// Helper para crear Hono con tipos correctos
export function createRouter() {
  return new Hono<HonoEnv>();
}
