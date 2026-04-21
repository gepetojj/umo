---
name: backend-server-actions
description: Define backend development patterns and conventions for implementing server actions. Use when creating or reviewing backend server actions, deciding between server actions and API routes, or when authoring entity-specific actions, schemas, and ownership checks.
---

# Backend — Server Actions

## Summary

This skill defines conventions and patterns for implementing the platform backend using Server Actions (Next.js / React Server Actions style). Prefer server actions for all backend logic unless an explicit, documented reason requires an API route (third-party library constraint, streaming edge-case, webhook semantics, etc.).

Use this skill when:
- Implementing new backend behavior that runs on the server
- Deciding whether to use server actions or API routes
- Creating or reviewing entity-scoped actions (chats, messages, users, etc.)

## Goals

- Consistency: predictable file layout and naming.
- Safety: ownership checks and least-privilege data returned.
- Validation: zod schemas for all inputs.
- Compatibility: forms (react-hook-form) must import schemas from non-server modules.
- Performance: minimal data returned, explicit reasons for non-server-action usage.

## Directory layout

All actions live under `server/actions/<entity_folder>/`.

Example:

- `server/actions/chats/`
  - `get-chats.action.ts`
  - `create-chat.action.ts`
  - `schemas/`
    - `create-chat.schema.ts`

Entity folder groups actions that operate on the same primary entity (chats, messages, users, etc.).

## File & export naming conventions

- File pattern: `operation-entity.action.ts` (kebab-case). Examples:
  - `get-chats.action.ts`
  - `delete-message.action.ts`

- Action function name: camelCase, `<operation><Entity>Action`. Examples:
  - `getChatsAction`
  - `deleteMessageAction`

- Schema name: `<operation><Entity>Schema`. Examples:
  - `getChatsSchema`
  - `createMessageSchema`

## Schemas & validation

- Every action that accepts input MUST validate it with zod.
- For actions used in forms (react-hook-form), place the schema in:
  `server/actions/<entity_folder>/schemas/<operation>-<entity>.schema.ts`
- Reason: files containing `"use server"` can only export async functions; zod schema exports must live outside those server-only modules so client code (forms) can import types and parsers.
- Schema files should export:
  - the zod schema (e.g. `export const createChatSchema = z.object({...})`)
  - no need to export a TypeScript type alias

## Action implementation rules

 - Use next-safe-action for all server actions. Wrap the implementation with the project's safe-action helper (for example `serverAction`) so actions run in a predictable, hardened environment.
 - Each action file MUST export exactly one server action. Name the exported symbol according to the conventions above (e.g. `export const createChatAction = serverAction(async (input) => { ... })`).
 - Do not export multiple server actions from the same file. Internal helper functions are allowed but must not be exported as actions.
 - Use `authActionClient` for actions that require authentication. Typical usage:
   - Use `user.id` from ctx for ownership checks and DB filters.
 - Return only the minimal, necessary data for the frontend. Do not return superficial success flags. Use domain objects or DTOs tailored to the UI.
 - Use structured errors (Error subclasses or TRPC-like error shapes if adopted) and include minimal internal details.

## Ownership & authorization

- Always verify ownership when a user accesses or mutates data that can be owned:
  - e.g., before delete/update, ensure currentUser.id === resource.ownerId or user has explicit permission.
- If a read returns data that should be filtered for ownership, apply DB-level filters (WHERE user_id = currentUser.id) instead of post-filtering whenever possible.
- Log unauthorized attempts but do not expose internal traces in error messages returned to the client.

## When to use API routes instead of server actions

Only choose API routes with an explicit, documented reason. Examples:
- External libraries that require an Express/Koa-compatible handler.
- Long-lived streaming that server actions cannot support.
- Public webhooks that must be addressed at a stable HTTP URL independent of server-rendering environment.

When you choose an API route, document the decision in a short comment at the top of the file explaining why the server action pattern was not used.

## Security & performance

- Principle of least privilege: return and select only required columns.
- Avoid N+1: eager-load relations used by the UI; use pagination and explicit projection.
- Rate-limit and debounce expensive operations where relevant (search, export).
- Use parameterized queries / ORM protections against injection.
- Sanitize any HTML or rich text before returning it to the client or render it server-side as sanitized output.

## Error handling

- Throw on failure. Do not return `{ success: false }` payloads.
- Prefer typed errors so frontend can map to UI states (validation error vs authorization vs not found).
- Validation errors: return field-level errors in a predictable structure when used by forms.

## Examples

Example: create chat (schema file)

```typescript
// server/actions/chats/schemas/create-chat.schema.ts
import { z } from "zod";

export const createChatSchema = z.object({
  title: z.string().min(1).max(200),
  participantsIds: z.array(z.string()).optional(),
});
```

Example: create chat action

```typescript
// server/actions/chats/create-chat.action.ts
"use server";

import crypto from "node:crypto";

import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { chatsTable } from "@/server/db/schema/chats.schema";

export const createChatAction = authActionClient.action(async ({ ctx }) => {
	const chatId = crypto.randomUUID();
	await db.insert(chatsTable).values({
		id: chatId,
		userId: ctx.user.id,
	});

	return {
		id: chatId,
	};
});

```

If an action accepts validated input, follow the same pattern but parse the schema inside the action and receive input as the second argument:

```typescript
// server/actions/chats/create-chat.action.ts
"use server";

import crypto from "node:crypto";

import { authActionClient } from "@/server/actions/safe-action";
import { createChatSchema } from "./schemas/create-chat.schema";
import { db } from "@/server/db";
import { chatsTable } from "@/server/db/schema/chats.schema";

export const createChatAction = authActionClient
	.inputSchema(createChatSchema)
	.action(async ({ ctx, parsedInput }) => {
		// parsedInput is already validated by next-safe-action
		const chatId = crypto.randomUUID();
		await db.insert(chatsTable).values({
			id: chatId,
			userId: ctx.user.id,
			title: parsedInput.title,
		});

		return { id: chatId };
	});
```

## Checklist for reviews

- [ ] Action under `server/actions/<entity>/`
- [ ] File name follows `operation-entity.action.ts`
- [ ] Exported function named `<operation><Entity>Action`
- [ ] Inputs validated with zod
- [ ] Form-used schemas exported from `schemas/` and importable by client code
- [ ] Ownership checks present where appropriate
- [ ] Returns minimal required data, no extraneous flags
- [ ] Performance considerations (pagination, projection, eager load) applied
- [ ] If API route chosen, decision documented in file header
