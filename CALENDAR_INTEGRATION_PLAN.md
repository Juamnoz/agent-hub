# Plan de Integración: Agentes de Citas con Cal.com

> Estado: EN PROGRESO — Cal.com OAuth app enviada (Pending approval)
> Fecha: 2026-03-13
> Responsable del plan: Claude (ventana principal)

---

## Contexto

- Cal.com self-hosted en `devcal.automatesolutions.tech` (ya instalado)
- Cal.com cloud OAuth app creada en `app.cal.com` — **estado: Pending**
- Google OAuth app creada (no verificada) — se usa Cal.com como intermediario para evitar expiración de tokens
- DB de LISA: `supabase_supabase_db` container en VPS 72.62.164.220
- `algorithm_type` enum ya existe en DB con valor `appointments`

## Credenciales Cal.com OAuth (GUARDAR SEGURO)

```
Cal.com OAuth Client ID:     20a06b2b014ddf7c4e4f1fef1a54b92ad6a2bbc4f24c086... (ver cal.com dashboard)
Cal.com OAuth Client Secret: 9969d533c0aa6a458f1d0c9d669712868085bfe8f3126dc... (ver cal.com dashboard)
Redirect URI:                https://[DOMINIO-LISA]/api/integrations/calcom/callback
Cal.com self-hosted DB:      postgresql://postgres:8810a1228305ce9a08781d39e5c97e60@postgres:5432/calcom
```

## Arquitectura general

```
WhatsApp usuario
      ↓
  n8n (ycloud) — Switch por algorithm_type
      ↓ (si appointments)
  Sub-workflow appointments
      ↓
  Detecta intent "agendar cita"
      ↓
  Envía calBookingUrl por WhatsApp
      ↓
  Cal.com (cloud) maneja booking + Google Calendar + emails
      ↓
  Cal.com webhook → n8n → WhatsApp confirmación
      ↑
  LISA Dashboard → /calendar (lee bookings via Cal.com API)
```

## Flujo OAuth Cal.com desde LISA

```
1. Cliente abre agente tipo "appointments" en LISA
2. Paso 4 del setup: "Conectar Calendario"
3. Clic → LISA llama GET /v1/integrations/calcom/connect?agentId=xxx
4. Backend genera URL: https://app.cal.com/oauth/authorize?client_id=...
5. Cliente autoriza en Cal.com → conecta su Google Calendar ahí
6. Cal.com redirige a: https://[DOMINIO-LISA]/api/integrations/calcom/callback?code=xxx&state=agentId
7. Backend intercambia code → access_token + refresh_token
8. Backend guarda tokens en agents table
9. Backend llama Cal.com API → obtiene event types del usuario
10. Cliente elige event type → se guarda calEventTypeId + calBookingUrl
```

---

## STREAM 1 — DB + Backend
**Agente asignado:** Claude ventana principal
**Sin conflictos con:** Stream 2, 3, 4

### Archivos a modificar/crear:
- `api/src/db/schema.ts`
- `api/src/routes/calendar.ts` (NUEVO)
- `api/src/routes/agents.ts` (solo agregar campos cal*)

### Tarea 1.1 — schema.ts
Agregar campos al pgTable `agents`:
```typescript
calAccessToken:  text("cal_access_token"),
calRefreshToken: text("cal_refresh_token"),
calEventTypeId:  text("cal_event_type_id"),
calBookingUrl:   text("cal_booking_url"),
calUsername:     text("cal_username"),
```

### Tarea 1.2 — Migración
Aplicar directamente en DB (supabase_supabase_db container):
```sql
ALTER TABLE agents
  ADD COLUMN cal_access_token text,
  ADD COLUMN cal_refresh_token text,
  ADD COLUMN cal_event_type_id text,
  ADD COLUMN cal_booking_url text,
  ADD COLUMN cal_username text;
```

### Tarea 1.3 — calendar.ts (NUEVO)
Rutas a implementar:
```
GET  /v1/integrations/calcom/connect?agentId=xxx
     → genera y redirige a URL OAuth de Cal.com

GET  /v1/integrations/calcom/callback?code=xxx&state=agentId
     → intercambia code por tokens
     → guarda en DB
     → obtiene event types del usuario
     → redirige al frontend con resultado

GET  /v1/agents/:id/calendar/bookings?from=&to=
     → llama Cal.com API con access_token del agente
     → devuelve lista de bookings

GET  /v1/agents/:id/calendar/event-types
     → lista event types del usuario Cal.com

POST /v1/agents/:id/calendar/event-type
     → body: { eventTypeId }
     → guarda calEventTypeId y calBookingUrl en DB

POST /v1/agents/:id/calendar/disconnect
     → revoca tokens, limpia campos cal* en DB
```

Cal.com API base URL: `https://api.cal.com/v1`
Headers: `Authorization: Bearer {calAccessToken}`

### Tarea 1.4 — agents.ts
- Incluir campos `cal*` en SELECT y UPDATE responses
- En GET /agents/:id devolver `calConnected: boolean` (true si calAccessToken existe)

---

## STREAM 2 — Frontend: Paso "Calendario" en setup del agente
**Agente asignado:** disponible
**Sin conflictos con:** Stream 3, 4
**Depende de:** Stream 1 (puede mockear APIs mientras)

### Archivos a modificar/crear:
- `src/app/(dashboard)/agents/new/page.tsx`
- `src/components/agent-setup/calendar-step.tsx` (NUEVO)
- `src/app/api/integrations/calcom/callback/route.ts` (NUEVO)

### Tarea 2.1 — agents/new/page.tsx
- El wizard de setup ya tiene pasos (círculos)
- Agregar paso 4 "Calendario" SOLO si `algorithmType === 'appointments'`
- El paso es obligatorio para poder avanzar al paso siguiente (WhatsApp)
- Si `algorithmType !== 'appointments'` el paso no existe y no bloquea

### Tarea 2.2 — calendar-step.tsx (NUEVO)
```
Estado A (no conectado):
  - Texto: "Conecta el calendario de tu negocio"
  - Botón: "Conectar con Cal.com" → llama GET /v1/integrations/calcom/connect?agentId=xxx

Estado B (conectado, eligiendo event type):
  - Muestra: "✓ Conectado como [calUsername]"
  - Dropdown: lista de event types del usuario
  - Botón: "Guardar" → POST /v1/agents/:id/calendar/event-type

Estado C (configurado):
  - Muestra: "✓ [Nombre del event type]"
  - Link: "[calBookingUrl]"
  - Botón: "Desconectar"
```

### Tarea 2.3 — api/integrations/calcom/callback/route.ts (NUEVO)
- Next.js route handler GET
- Recibe `?code=xxx&state=agentId` de Cal.com
- Llama backend `GET /v1/integrations/calcom/callback?code=xxx&state=agentId`
- Redirige a `/agents/new?step=4&agentId=xxx&cal=connected` o `cal=error`

---

## STREAM 3 — Frontend: Página /calendar en dashboard
**Agente asignado:** disponible
**Sin conflictos con:** Stream 1, 2, 4
**Completamente independiente (puede usar datos mock)**

### Archivos a modificar/crear:
- `src/app/(dashboard)/calendar/page.tsx` (NUEVO)
- `src/app/(dashboard)/calendar/_content.tsx` (NUEVO)
- `src/components/calendar/bookings-calendar.tsx` (NUEVO)
- `src/components/calendar/booking-list.tsx` (NUEVO)
- `src/app/(dashboard)/layout.tsx` — agregar ítem sidebar "Calendario"

### Tarea 3.1 — Instalar dependencia
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Tarea 3.2 — page.tsx + _content.tsx
- Layout igual al resto del dashboard
- Selector de agente (solo muestra agents con `algorithmType = 'appointments'` y `calConnected = true`)
- Toggle: vista Calendario / vista Lista
- Si no hay agentes appointments conectados: empty state con botón "Configurar agente de citas"

### Tarea 3.3 — bookings-calendar.tsx
- Calendario mensual/semanal con FullCalendar
- Eventos coloreados por status: confirmed (verde), pending (amarillo), cancelled (rojo)
- Click en evento → modal con detalles:
  - Nombre del cliente
  - Email
  - Teléfono
  - Fecha y hora
  - Event type
  - Link al booking en Cal.com

### Tarea 3.4 — booking-list.tsx
- Tabla: Cliente, Fecha, Hora, Tipo, Status, Acciones
- Filtros: por fecha, por status
- Paginación

### Tarea 3.5 — Sidebar
En `src/app/(dashboard)/layout.tsx` agregar ítem "Calendario" con ícono de calendario.
Solo visible si el usuario tiene al menos un agente con `algorithmType = 'appointments'`.

---

## STREAM 4 — n8n Workflows
**Agente asignado:** disponible
**Sin conflictos con:** Stream 1, 2, 3
**Completamente independiente**

### Archivos a modificar/crear:
- `n8n-workflows/appointments_subworkflow.json` (NUEVO)
- `n8n-workflows/gAcBlzbvb525JWir_ycloud_pruebas.json` (modificar)

### Tarea 4.1 — Sub-workflow appointments (nuevo workflow en n8n)
Nodos:
```
[Webhook entrada]
  Input: { message, agentId, sessionId, phone, agentData }
      ↓
[Postgres: obtener cal_booking_url del agente]
      ↓
[LLM: clasificar intent]
  System: "Clasifica el mensaje en: AGENDAR | CANCELAR | CONSULTAR | OTRO"
      ↓
[Switch por intent]
  ├── AGENDAR   → enviar calBookingUrl por WhatsApp
  ├── CANCELAR  → respuesta + link Cal.com para cancelar
  ├── CONSULTAR → respuesta con disponibilidad
  └── OTRO      → LLM responde con prompt del agente
      ↓
[YCloud: enviar respuesta WhatsApp]
```

### Tarea 4.2 — Webhook Cal.com → n8n
En Cal.com del usuario → Settings → Webhooks:
```
URL: https://devwebhookn8n.automatesolutions.tech/webhook/calcom-booking
Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
```
Crear workflow n8n que recibe el evento y envía WhatsApp de confirmación al cliente.

### Tarea 4.3 — Modificar ycloud_pruebas
Después del nodo que carga datos del agente, agregar nodo Switch:
```
[Switch: agent.algorithm_type]
  ├── appointments → Execute Sub-workflow (4.1)
  ├── hotel        → flujo actual
  ├── restaurant   → flujo actual
  └── default      → flujo actual (LLM genérico)
```
**IMPORTANTE:** No modificar el flujo actual — solo envolverlo en la rama `default`.

---

## Variables de entorno a agregar

### Backend (`api/.env`)
```env
CALCOM_CLIENT_ID=20a06b2b014ddf7c4e4f1fef1a54b92ad6a2bbc4f24c086...
CALCOM_CLIENT_SECRET=9969d533c0aa6a458f1d0c9d669712868085bfe8f3126dc...
CALCOM_REDIRECT_URI=https://[DOMINIO-LISA]/api/integrations/calcom/callback
CALCOM_API_URL=https://api.cal.com/v1
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_CALCOM_CLIENT_ID=20a06b2b014ddf7c4e4f1fef1a54b92ad6a2bbc4f24c086...
```

---

## Estado de cada stream

| Stream | Estado | Bloqueado por |
|--------|--------|---------------|
| 1 — DB + Backend | ✅ Completado | — |
| 2 — Frontend Setup | ✅ Completado | — |
| 3 — Frontend Calendar | ✅ Completado | — |
| 4 — n8n | ⬜ Pendiente | Nada |
| Cal.com OAuth approval | 🟡 Pending | Cal.com review (2-7 días) |

---

## Notas importantes

- **No modificar** lógica existente del workflow ycloud — solo agregar Switch al inicio
- **No tocar** tablas `reservations` ni `orders` — coexisten con Cal.com
- El campo `hotelName` en agents se mantiene — no renombrar
- Cuando Cal.com apruebe el OAuth app, actualizar vars de entorno con Client ID y Secret completos
- La DB de Cal.com (`calcom` en postgres container) se puede consultar directamente como fallback
- SSH VPS: `ssh root@72.62.164.220` pass: en infra-credentials.md
