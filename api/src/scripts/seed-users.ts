import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { users, organizations, memberships } from "../db/schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding users and organizations...\n");

  // ── 1. Superadmin: aicstudioai ──────────────────────────────────
  const superEmail = "aicstudioai@admin.local";
  const superPass = "AICstudioi123_";

  let superUser = await db.query.users.findFirst({
    where: eq(users.email, superEmail),
  });

  if (!superUser) {
    const hash = await bcrypt.hash(superPass, 12);
    const [created] = await db
      .insert(users)
      .values({
        email: superEmail,
        passwordHash: hash,
        name: "AIC Studio AI",
        role: "superadmin",
        planTier: "enterprise",
      })
      .returning();
    superUser = created;
    console.log("✅ Superadmin creado: aicstudioai@admin.local");
  } else {
    // Update role to superadmin if not already
    await db
      .update(users)
      .set({ role: "superadmin", planTier: "enterprise" })
      .where(eq(users.id, superUser.id));
    console.log("↩️  Superadmin ya existía, rol actualizado");
  }

  // ── 2. Org: AIC Studio ──────────────────────────────────────────
  let aicOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "aicstudioai"),
  });

  if (!aicOrg) {
    const [created] = await db
      .insert(organizations)
      .values({
        slug: "aicstudioai",
        name: "AIC Studio AI",
      })
      .returning();
    aicOrg = created;
    console.log("✅ Org creada: aicstudioai");
  }

  // Membership superadmin → aicstudioai org
  const existingSuperMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, superUser.id),
  });
  if (!existingSuperMembership) {
    await db.insert(memberships).values({
      userId: superUser.id,
      organizationId: aicOrg.id,
      role: "superadmin",
    });
    console.log("✅ Membership: superadmin → aicstudioai");
  }

  // ── 3. Cliente: imperioacuatico ─────────────────────────────────
  const clientEmail = "imperioacuatico@cliente.local";
  const clientPass = "imperioacuatico123_";

  let clientUser = await db.query.users.findFirst({
    where: eq(users.email, clientEmail),
  });

  if (!clientUser) {
    const hash = await bcrypt.hash(clientPass, 12);
    const [created] = await db
      .insert(users)
      .values({
        email: clientEmail,
        passwordHash: hash,
        name: "Imperio Acuatico",
        role: "owner",
        planTier: "pro",
      })
      .returning();
    clientUser = created;
    console.log("✅ Cliente creado: imperioacuatico@cliente.local");
  } else {
    console.log("↩️  Cliente ya existía");
  }

  // ── 4. Org: Imperio Acuatico ────────────────────────────────────
  let clientOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "imperioacuatico"),
  });

  if (!clientOrg) {
    const [created] = await db
      .insert(organizations)
      .values({
        slug: "imperioacuatico",
        name: "Imperio Acuatico",
      })
      .returning();
    clientOrg = created;
    console.log("✅ Org creada: imperioacuatico");
  }

  // Membership cliente → imperioacuatico org
  const existingClientMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, clientUser.id),
  });
  if (!existingClientMembership) {
    await db.insert(memberships).values({
      userId: clientUser.id,
      organizationId: clientOrg.id,
      role: "owner",
    });
    console.log("✅ Membership: imperioacuatico → imperioacuatico org");
  }

  // ── 5. Cliente: La Agencia ──────────────────────────────────
  const agenciaEmail = "laagencia@agencia.local";
  const agenciaPass = "laagencia123";

  let agenciaUser = await db.query.users.findFirst({
    where: eq(users.email, agenciaEmail),
  });

  if (!agenciaUser) {
    const hash = await bcrypt.hash(agenciaPass, 12);
    const [created] = await db
      .insert(users)
      .values({
        email: agenciaEmail,
        passwordHash: hash,
        name: "La Agencia",
        username: "laagencia",
        role: "owner",
        planTier: "business",
      })
      .returning();
    agenciaUser = created;
    console.log("✅ Cliente creado: laagencia@agencia.local");
  } else {
    console.log("↩️  La Agencia ya existía");
  }

  let agenciaOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "laagencia"),
  });

  if (!agenciaOrg) {
    const [created] = await db
      .insert(organizations)
      .values({ slug: "laagencia", name: "La Agencia" })
      .returning();
    agenciaOrg = created;
    console.log("✅ Org creada: laagencia");
  }

  const existingAgenciaMembership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, agenciaUser.id),
  });
  if (!existingAgenciaMembership) {
    await db.insert(memberships).values({
      userId: agenciaUser.id,
      organizationId: agenciaOrg.id,
      role: "owner",
    });
    console.log("✅ Membership: laagencia → laagencia org");
  }

  console.log("\n🎉 Seed completado!\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  CREDENCIALES DE ACCESO                                 ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  SUPERADMIN (ve todos los agentes):                     ║");
  console.log("║    User: aicstudioai                                    ║");
  console.log("║    Email: aicstudioai@admin.local                       ║");
  console.log("║    Pass:  AICstudioi123_                                ║");
  console.log("║                                                         ║");
  console.log("║  LA AGENCIA (agentes: OMGHat, Max):                     ║");
  console.log("║    User: laagencia                                      ║");
  console.log("║    Email: laagencia@agencia.local                       ║");
  console.log("║    Pass:  laagencia123                                  ║");
  console.log("║                                                         ║");
  console.log("║  IMPERIO ACUATICO:                                      ║");
  console.log("║    User: imperioacuatico                                ║");
  console.log("║    Email: imperioacuatico@cliente.local                 ║");
  console.log("║    Pass:  imperioacuatico123_                           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
