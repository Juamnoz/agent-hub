# Workflows de n8n - LISA Platform

Documentacion de todos los workflows de n8n utilizados en la plataforma LISA.

## Indice

1. [Workflows principales de LISA](#workflows-principales-de-lisa)
   - [lisa (produccion)](#1-lisa---entrenamiento-produccion)
   - [ycloud pruebas (runtime)](#2-ycloud-pruebas---runtime-whatsapp)
   - [entrenamiento lisa setup](#3-entrenamiento-lisa-setup)
2. [Workflows de Instagram](#workflows-de-instagram)
3. [Otros workflows](#otros-workflows)
4. [Arquitectura general](#arquitectura-general)
5. [Tablas de base de datos utilizadas](#tablas-de-base-de-datos-utilizadas)
6. [Multi-tenant y enrutamiento](#multi-tenant-y-enrutamiento)

---

## Workflows principales de LISA

### 1. lisa - Entrenamiento (Produccion)

- **ID:** `o8O9K4oWZdyaJqOT`
- **Archivo:** `o8O9K4oWZdyaJqOT_lisa.json`
- **Estado:** Activo
- **Webhook:** `POST https://devwebhookn8n.automatesolutions.tech/webhook/lisa`
- **Nodos activos:** 40

Este es el workflow principal de entrenamiento de agentes. Recibe datos desde el backend de LISA (`/v1/agents/:agentId/train/deploy`) y configura todo lo necesario para que un agente funcione.

#### Flujo principal

```
Webhook (POST /lisa)
  └─> Router Update Type (switch por update_type)
        ├─ "full"          → Entrenamiento completo (todos los pasos abajo)
        ├─ "prompt"        → Solo regenerar prompt
        ├─ "faqs"          → Actualizar solo FAQs en Qdrant
        ├─ "products"      → Actualizar solo productos en Qdrant
        ├─ "phones"        → Actualizar solo telefonos
        └─ "social_links"  → Guardar links de redes sociales
```

#### Ramas del entrenamiento completo ("full")

El Router ejecuta en paralelo 5 ramas cuando `update_type = "full"`:

1. **Telefonos** → Procesa y guarda numeros de telefono (admin, escalacion, WABA) en `agent_phones` y `agents`.

2. **Separar imagenes** → Extrae URLs de imagenes del payload y las guarda en `agent_images`.

3. **Asegurar coleccion Qdrant** → Crea la coleccion en Qdrant (si no existe) → Borra chunks viejos → **Chunker Semantico** (divide FAQs, productos y catalogo en chunks semanticos) → Inserta en **Qdrant Conocimiento** (vector store con embeddings OpenAI).

4. **Agente 1 - Few Shot Generator** → Genera pares pregunta/respuesta de ejemplo usando LLM (Gemini) → **Parser Few-Shot a Chunks** → Inserta en **Qdrant Few-Shot** (coleccion separada de ejemplos).

5. **Agente 2 - Prompt Orquestador** → Genera el system prompt del agente usando LLM (Gemini) → **Validador Lite** (valida formato/estructura del prompt) → Si aprobado: guarda directamente. Si no: pasa al **Agente 3 - Fixer** (corrige el prompt) → **Guardar Prompt Final** en `agent_prompts` → **Verificar Qdrant** → **Resumen Final** → **Responder Webhook**.

#### Actualizaciones parciales

- **faqs:** Borrar FAQs viejas de Qdrant → Chunker FAQs Parcial → Insertar en Qdrant
- **products:** Borrar productos viejos de Qdrant → Chunker Products Parcial → Insertar en Qdrant
- **prompt:** Solo ejecuta Agente 2 (Prompt Orquestador) → validacion → guardado
- **phones:** Solo ejecuta rama de Telefonos
- **social_links:** Guarda links de redes sociales en BD

#### Payload esperado

```json
{
  "agent_id": "uuid",
  "agent_slug": "nombre-slug",
  "agent_name": "Nombre del Agente",
  "prompt": "Instrucciones del agente...",
  "tone": "profesional",
  "admin_phone": "+573001234567",
  "escalation_phone": "+573001234567",
  "faqs": [{ "question": "...", "answer": "..." }],
  "products": [{ "name": "...", "price": 100, "description": "..." }],
  "images": ["https://..."],
  "catalogs": ["texto del catalogo..."],
  "update_type": "full|prompt|faqs|products|phones|social_links"
}
```

---

### 2. ycloud pruebas - Runtime WhatsApp

- **ID:** `gAcBlzbvb525JWir`
- **Archivo:** `gAcBlzbvb525JWir_ycloud_pruebas.json`
- **Estado:** Activo
- **Webhook:** `POST https://devn8n.automatesolutions.tech/webhook/aic_ycloud`
- **Nodos activos:** 72

Este workflow maneja **todos los mensajes entrantes de WhatsApp** en tiempo real. YCloud (proveedor de WhatsApp API) envia eventos a este webhook.

#### Tipos de eventos soportados

- `whatsapp.inbound_message.received` — Mensajes entrantes del cliente
- `whatsapp.smb.message.echoes` — Ecos de mensajes enviados por el negocio

> **Nota sobre ecos:** En eventos de eco, los campos estan invertidos respecto a mensajes entrantes. El campo `from` es el numero del negocio y `to` es el cliente. Ademas, el objeto del mensaje esta en `body.whatsappMessage` en lugar de `body.whatsappInboundMessage`.

#### Flujo principal

```
Webhook (POST /aic_ycloud)
  │
  ├─> Extraer Datos del Mensaje2 (normaliza inbound vs echo)
  │     └─> Execute SQL query1 (busca conversacion existente)
  │           └─> Extraer Datos del Mensaje1 (extrae phoneNumber, conversationId, etc.)
  │                 └─> Es mensaje entrante?
  │                       ├─ SI → Normalizar Mensaje → Es Reply? → ...
  │                       └─ NO (echo) → traer los numeros → Filtro Modo Pruebas → ...
  │
  └─> (rama inbound)
        └─> traer los numeros (SQL: agent_phones por waba_id)
              └─> Filtro Modo Pruebas
                    └─> Permitir Mensaje?
                          ├─ TRUE → Es RESUELTO? → ... → Verificar Bot Global → ...
                          │           → Verificar Flag Humano → Humano Activo?
                          │             ├─ SI → Persona atendiendo (STOP)
                          │             └─ NO → Prompt (SQL) → AI Agent → JSON Parser
                          │                      └─> Es Escalar?
                          │                            ├─ SI → Avisar Cliente → Notificar Agente → Activar Flag Humano
                          │                            └─ NO → Es Imagen? → Es Documento? → Enviar Texto
                          └─ FALSE → Ignorar (Modo Pruebas)
```

#### Nodos clave

| Nodo | Tipo | Funcion |
|------|------|---------|
| **Extraer Datos del Mensaje2** | Code | Normaliza datos entre mensajes inbound y ecos. Extrae wabaId, from, to, messageType, messageText, audioLink, imageLink |
| **traer los numeros** | Postgres | `SELECT FROM agent_phones ap LEFT JOIN agents a ON a.id::text = ap.agent_id WHERE ap.waba_id = ?` — Obtiene agent_id, admin_phone, escalation_phone, agent_status |
| **Filtro Modo Pruebas** | Code | Controla acceso segun el estado del agente (ver seccion [Filtro Modo Pruebas](#filtro-modo-pruebas)) |
| **Permitir Mensaje?** | If | Evalua `allowed == true` del filtro anterior |
| **Verificar Bot Global** | Postgres | Consulta `bot_flags` para ver si el bot esta pausado globalmente |
| **Verificar Flag Humano** | Postgres | Consulta si hay un agente humano atendiendo la conversacion |
| **Prompt** | Postgres | `SELECT prompt FROM agent_prompts WHERE agent_id = ?` |
| **AI Agent** | Agent (Gemini) | Genera respuesta usando el prompt del agente + Qdrant (RAG) + memoria de chat (Postgres) |
| **JSON Parser** | Code | Parsea la respuesta del AI Agent (formato JSON con campos: response, escalate, images) |
| **Switch** | Switch | Enruta por tipo de mensaje: audio, imagen, texto |
| **Buffer (Redis)** | Redis | Acumula mensajes rapidos del usuario para enviarlos como un solo bloque al AI Agent |

#### Sistema de buffering (Redis)

Para evitar multiples respuestas cuando el usuario envia varios mensajes seguidos:

1. Cada mensaje se guarda en Redis con un TTL
2. **Wait4** espera unos segundos
3. Se obtienen todos los mensajes acumulados
4. **Switch4** decide: si hay mas mensajes pendientes espera, si no, concatena todo y lo procesa como un solo mensaje

#### Manejo de multimedia

- **Audio:** Descarga via YCloud API → Transcribe con OpenAI Whisper → Convierte a texto
- **Imagen:** Descarga via YCloud API → Interpreta con OpenAI Vision → Genera descripcion
- **Documento:** Parsea contenido → Envia como documento via YCloud
- **Reply (mensaje citado):** Obtiene el mensaje original via YCloud API → Lo incluye como contexto

#### Escalamiento a humano

Cuando el AI Agent detecta que debe escalar (responde con `[ESCALAR]` o `escalate: true`):

1. **Avisar Cliente Escalando** — Envia mensaje al cliente: "Te estoy conectando con un agente..."
2. **Notificar Agente WhatsApp** — Envia notificacion al telefono de escalacion
3. **Activar Flag Humano** — Marca la conversacion como atendida por humano en la BD

#### Comandos especiales

- **RESUELTO** — El agente humano envia esta palabra para devolver el control al bot
- **PAUSAR** — Pausa el bot globalmente para esa cuenta
- **ACTIVAR** — Reactiva el bot globalmente

---

### 3. entrenamiento lisa setup

- **ID:** `F5sB6ecvB8cJ4ZH5`
- **Archivo:** `F5sB6ecvB8cJ4ZH5_entrenamiento_lisa_setup.json`
- **Estado:** Activo
- **Webhook:** `POST https://devwebhookn8n.automatesolutions.tech/webhook/omghat`
- **Nodos activos:** ~30 (muchos nodos legacy deshabilitados)

Version anterior/alternativa del workflow de entrenamiento. Tiene la misma estructura que el workflow "lisa" pero usa modelos OpenAI en lugar de Gemini. Contiene multiples versiones legacy deshabilitadas del flujo.

> **Nota:** Este workflow se mantiene como respaldo. El workflow principal de entrenamiento es `lisa` (o8O9K4oWZdyaJqOT).

---

## Filtro Modo Pruebas

El nodo **Filtro Modo Pruebas** es critico para el sistema multi-tenant. Controla que mensajes procesar segun el estado del agente:

| Estado del agente | Comportamiento |
|-------------------|----------------|
| `active` (produccion) | Permite TODOS los mensajes |
| `setup` / `testing` | Solo permite mensajes del **admin_phone** y del **superadmin** (+573016050818) |
| `inactive` | Bloquea TODOS los mensajes |

La comparacion de telefonos se normaliza (solo digitos) y se comparan los ultimos 10 digitos para tolerar diferencias de codigo de pais.

---

## Workflows de Instagram

### 4. Instagram Meta - DMs

- **ID:** `i5SJLnEzS28acbZM`
- **Archivo:** `i5SJLnEzS28acbZM_Instagram_Meta_DMs.json`
- **Estado:** Activo
- **Webhook:** `POST /webhook/ivan`

Maneja mensajes directos de Instagram via la API de Meta. Recibe webhooks de Meta, verifica la firma, extrae el mensaje y responde usando un AI Agent.

### 5. Instagram - Auto Respuesta Comentarios

- **ID:** `1sJKefxmZ6mAPjPo`
- **Archivo:** `1sJKefxmZ6mAPjPo_Instagram_Auto_Respuesta_Comentarios.json`
- **Estado:** Activo
- **Webhook:** `POST /webhook/comentarios`

Responde automaticamente a comentarios en publicaciones de Instagram. Detecta palabras clave en los comentarios y envia respuestas o DMs automaticos.

### 6. Instagram Auto-Reply CREDENCIAL

- **ID:** `tULJSGUlRUXOEK1v`
- **Archivo:** `tULJSGUlRUXOEK1v_Instagram_Auto_Reply_CREDENCIAL.json`
- **Estado:** Activo

Variante del auto-reply de Instagram configurada para un cliente especifico (Credencial). Maneja respuestas automaticas a comentarios y DMs.

### 7. Respuesta Instagram palabra clave

- **ID:** `3shtcbXDn3KvcZBc`
- **Archivo:** `3shtcbXDn3KvcZBc_Respuesta_instagram_palabra_clave.json`
- **Estado:** Inactivo

Workflow de respuesta a comentarios de Instagram por palabra clave. Version anterior/prototipo, actualmente deshabilitado.

### 8. Automatizacion FB + IG con Gemini

- **ID:** `oYJctztbq2QIQE77`
- **Archivo:** `oYJctztbq2QIQE77_Automatizacion_FB_IG_Gemini.json`
- **Estado:** Inactivo

Prototipo de automatizacion para Facebook e Instagram usando Gemini como LLM.

---

## Otros workflows

### 9. Creditos El Paisa

- **ID:** `PySogxF40FMFgoUf`
- **Archivo:** `PySogxF40FMFgoUf_Creditos_El_Paisa.json`
- **Estado:** Activo

Workflow especifico para el cliente "El Paisa". Maneja recordatorios de creditos via WhatsApp usando Google Sheets como fuente de datos y plantillas de WhatsApp Business.

### 10. campana

- **ID:** `AViNLG8VyOFhOUQc`
- **Archivo:** `AViNLG8VyOFhOUQc_campana.json`
- **Estado:** Activo

Workflow para campanas de difusion de WhatsApp. Recibe datos via webhook, los inserta en la base de datos y gestiona el envio.

### 11. difusion comunidad

- **ID:** `SEbUUvTUf4U7PhOP`
- **Archivo:** `SEbUUvTUf4U7PhOP_difusion_comunidad.json`
- **Estado:** Inactivo

Workflow de difusion para comunidades. Actualmente deshabilitado.

### 12. Insertar datos en supabase proveniente de la web

- **ID:** `YgE2QtkLNUr5ak8S`
- **Archivo:** `YgE2QtkLNUr5ak8S_Insertar_datos_supabase_web.json`
- **Estado:** Activo

Recibe datos de formularios web via webhook y los inserta en tablas de PostgreSQL/Supabase.

### 13. la agencia

- **ID:** `uFej6OoU72j0Dy4W`
- **Archivo:** `uFej6OoU72j0Dy4W_la_agencia.json`
- **Estado:** Activo

Workflow legacy del cliente "La Agencia". Maneja mensajes de WhatsApp con un switch por cuenta (waba_id) para enrutar a diferentes AI Agents con diferentes prompts. Este es el predecesor del sistema multi-tenant actual.

### 14-18. Workflows de prueba

| ID | Nombre | Estado | Descripcion |
|----|--------|--------|-------------|
| `3FOsPfXQRiVf6zM0` | My workflow 2 | Inactivo | Workflow de prueba |
| `Y1yzfIdSgakXW9b6` | connection_to_test | Inactivo | Prueba de conexiones |
| `QwLSRK0RI2MBNTtT` | My workflow | Inactivo | Workflow de prueba |
| `cdxvjDhmOogclaQv` | My Sub-Workflow 1 | Inactivo | Sub-workflow de prueba |
| `twk0YTgD32xtowZw` | My workflow 3 | Inactivo | Workflow de prueba |

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────────┐
│                        LISA Platform                             │
│                                                                  │
│  Frontend (Next.js)          Backend (Hono)                      │
│  localhost:3002               localhost:3001                      │
│       │                           │                              │
│       │  POST /train/deploy       │                              │
│       └──────────────────────────>│                              │
│                                   │                              │
│                                   │  POST /webhook/lisa          │
│                                   └──────────────────────┐       │
│                                                          │       │
└──────────────────────────────────────────────────────────┼───────┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                          n8n                                     │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────────────────────┐  │
│  │ Workflow: lisa    │      │ Workflow: ycloud pruebas         │  │
│  │ (entrenamiento)   │      │ (runtime WhatsApp)               │  │
│  │                   │      │                                  │  │
│  │ POST /webhook/    │      │ POST /webhook/aic_ycloud         │  │
│  │      lisa         │      │                                  │  │
│  │                   │      │ YCloud envia eventos aqui        │  │
│  │ - Genera prompt   │      │                                  │  │
│  │ - Entrena Qdrant  │      │ - Recibe mensajes WhatsApp       │  │
│  │ - Guarda telefonos│      │ - Identifica agente (multi-tenant)│ │
│  │ - Guarda imagenes │      │ - Filtra por modo pruebas        │  │
│  └──────────────────┘      │ - Genera respuesta con AI         │  │
│                             │ - Envia respuesta via YCloud     │  │
│                             └──────────────────────────────────┘  │
│                                                                  │
│  Servicios externos:                                             │
│  - Qdrant (vector store para RAG)                                │
│  - PostgreSQL (prompts, telefonos, memoria de chat, flags)       │
│  - Redis (buffering de mensajes)                                 │
│  - OpenAI (embeddings, whisper, vision)                          │
│  - Google Gemini (LLM principal para agentes)                    │
│  - YCloud (WhatsApp Business API)                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tablas de base de datos utilizadas

Estas tablas son gestionadas por n8n (owner: `supabase_admin`):

| Tabla | Descripcion | Columnas clave |
|-------|-------------|----------------|
| `agent_prompts` | System prompts generados para cada agente | `agent_id`, `prompt` |
| `agent_phones` | Mapeo WABA → agente (multi-tenant) | `waba_id`, `agent_id`, `admin_phone`, `escalation_phone`, `phones_list` |
| `agent_images` | Imagenes de productos/catalogo | `agent_id`, `url` |
| `bot_flags` | Flags globales (bot pausado, etc.) | `agent_id`, `flag`, `value` |
| `waba_registry` | Registro de cuentas WABA | `waba_id`, `agent_id` |
| `n8n_chat_histories` | Memoria de conversaciones del AI Agent | `session_id`, `message` |

Todas las tablas usan `agent_id` (UUID) como identificador principal para vincular datos con los agentes de LISA.

---

## Multi-tenant y enrutamiento

### Como funciona el enrutamiento en runtime

1. **YCloud** recibe un mensaje de WhatsApp y envia un evento POST al webhook `/aic_ycloud`
2. El nodo **Extraer Datos del Mensaje2** extrae el `wabaId` del evento
3. El nodo **traer los numeros** busca en `agent_phones` usando `waba_id` para obtener el `agent_id`
4. Con el `agent_id`, se obtiene el prompt de `agent_prompts` y los vectores de `Qdrant`
5. El AI Agent responde usando el contexto especifico de ese agente

### Colecciones de Qdrant

Cada agente tiene su propia coleccion en Qdrant, nombrada por su `agent_id` (UUID). Esto asegura que el RAG solo recupere informacion relevante para ese agente especifico.

### Flujo de entrenamiento (desde LISA)

1. El usuario configura su agente en el frontend de LISA
2. Al hacer clic en "Entrenar", el frontend llama a `POST /v1/agents/:agentId/train/deploy`
3. El backend arma el payload completo (prompt, FAQs, productos, imagenes, telefonos)
4. El backend envia el payload a `POST https://devwebhookn8n.automatesolutions.tech/webhook/lisa`
5. n8n procesa todo en paralelo y responde con un resumen

---

## Endpoints de webhook

| Webhook | URL completa | Workflow | Uso |
|---------|-------------|----------|-----|
| Training | `POST https://devwebhookn8n.automatesolutions.tech/webhook/lisa` | lisa | Entrenamiento de agentes |
| Runtime | `POST https://devn8n.automatesolutions.tech/webhook/aic_ycloud` | ycloud pruebas | Mensajes WhatsApp en tiempo real |
| Training (legacy) | `POST https://devwebhookn8n.automatesolutions.tech/webhook/omghat` | entrenamiento lisa setup | Entrenamiento (respaldo) |
| Instagram DMs | `POST https://devn8n.automatesolutions.tech/webhook/ivan` | Instagram Meta - DMs | Mensajes directos de Instagram |
| Instagram Comments | `POST https://devn8n.automatesolutions.tech/webhook/comentarios` | Instagram Auto Respuesta | Comentarios de Instagram |
