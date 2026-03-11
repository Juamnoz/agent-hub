import { createRouter } from "../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, agents } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const productsRoute = createRouter();
productsRoute.use("*", authMiddleware);

async function verifyAgentOwnership(
  agentId: string,
  userId: string,
  role: string,
  c: any
): Promise<boolean> {
  const agent = await db.query.agents.findFirst({
    where: role === "superadmin"
      ? eq(agents.id, agentId)
      : and(eq(agents.id, agentId), eq(agents.userId, userId)),
  });
  if (!agent) {
    c.json({ message: "Agente no encontrado" }, 404);
    return false;
  }
  return true;
}

// GET /agents/:agentId/products
productsRoute.get("/:agentId/products", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");

  if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

  const result = await db.query.products.findMany({
    where: eq(products.agentId, agentId),
    orderBy: (p, { asc }) => [asc(p.sortOrder), asc(p.createdAt)],
  });

  return c.json(result);
});

// POST /agents/:agentId/products
productsRoute.post(
  "/:agentId/products",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().int().min(0),
      category: z.string().optional().default(""),
      imageUrl: z.string().optional(),
      sku: z.string().optional(),
      stock: z.number().int().optional(),
      variants: z.array(z.unknown()).optional(),
      isActive: z.boolean().optional().default(true),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const data = c.req.valid("json");

    if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

    const existing = await db.query.products.findMany({
      where: eq(products.agentId, agentId),
    });

    const [product] = await db
      .insert(products)
      .values({ ...data, agentId, sortOrder: existing.length })
      .returning();

    await db
      .update(agents)
      .set({ productCount: existing.length + 1, updatedAt: new Date() })
      .where(eq(agents.id, agentId));

    return c.json(product, 201);
  }
);

// PATCH /agents/:agentId/products/:productId
productsRoute.patch(
  "/:agentId/products/:productId",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().int().min(0).optional(),
      category: z.string().optional(),
      imageUrl: z.string().optional(),
      sku: z.string().optional(),
      stock: z.number().int().optional(),
      isActive: z.boolean().optional(),
    })
  ),
  async (c) => {
    const userId = c.get("userId") as string;
    const role = c.get("role") as string;
    const agentId = c.req.param("agentId");
    const productId = c.req.param("productId");
    const data = c.req.valid("json");

    if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

    const [updated] = await db
      .update(products)
      .set(data)
      .where(and(eq(products.id, productId), eq(products.agentId, agentId)))
      .returning();

    if (!updated) return c.json({ message: "Producto no encontrado" }, 404);

    return c.json(updated);
  }
);

// DELETE /agents/:agentId/products/:productId
productsRoute.delete("/:agentId/products/:productId", async (c) => {
  const userId = c.get("userId") as string;
  const role = c.get("role") as string;
  const agentId = c.req.param("agentId");
  const productId = c.req.param("productId");

  if (!(await verifyAgentOwnership(agentId, userId, role, c))) return;

  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.agentId, agentId)));

  const remaining = await db.query.products.findMany({
    where: eq(products.agentId, agentId),
  });
  await db
    .update(agents)
    .set({ productCount: remaining.length, updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  return c.body(null, 204);
});

export default productsRoute;
