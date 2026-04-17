# Genny.bot

## ✨ Overview

Genny.bot is a production-ready generative AI app for images and videos (Veo, Grok, Sora, Kling, Flux, and more).

## 🌐 Website

[https://genny.bot](https://genny.bot)

## ⭐ Features

- 🎨 **AI image generation** — Flux, Grok, and other image models
- 🎬 **AI video generation** — Veo, Sora, Kling, and more
- 🤖 **AI agents** — Chat UI with sidebar, message thread, composer, and attachments
- 📊 **Dashboard** — Signed-in overview with shortcuts to generate, files, usage, and tools
- 🛠️ **Tools** — Toolkits catalog and detail pages
- 🚀 **Server-side rendering** — React Router for fast, SEO-friendly pages
- ⚡ **Hot Module Replacement** — Instant feedback in development
- 🔒 **TypeScript** — Type-safe codebase
- 🧩 **Mantine UI** — Accessible components
- 💳 **Token-based billing** — Purchase and spend tokens for generations
- 📈 **Usage tracking** — Token usage and generation history
- 🔐 **Authentication** — Login and profile management

## 🎯 Supported AI brands

Google, Flux, Alibaba, Xai, Kling, Anthropic, Minimax, Vidu, ByteDance, Zai, LTX, Moonshot, OpenAI, DeepSeek

## 📁 Project structure

```
├── app/
│   ├── pages/
│   │   ├── account/     # Profile, billing, usage log, support tickets
│   │   ├── agents/    # Agent chat (sidebar, composer, messages)
│   │   ├── dashboard/ # Signed-in home / overview
│   │   ├── playground/  # Generation flows and schema-driven forms
│   │   ├── generations/
│   │   ├── files/
│   │   ├── tools/     # Toolkits catalog and detail
│   │   └── root/      # Landing, login, legal, contact
│   ├── shared/        # Layouts, nav, MarkdownRenderer, modals, pagination
│   ├── lib/
│   │   ├── hooks/
│   │   ├── stores/    # Zustand (app, chats, generate, files, …)
│   │   ├── themeUtils.ts
│   │   └── utils.tsx
│   └── routes.ts
├── public/
└── package.json
```

## 🎨 Theme and styling

Appearance is stored in Zustand (`useAppStore`) as `themeSettings`:

- **`colorScheme`**: `"light"` | `"dark"` | `"auto"` (system when `"auto"`)
- **`themeColor`**: Mantine primary token (e.g. `cyan`, `blue`)

`app/lib/themeUtils.ts` persists settings and `getColorSchemeBootstrapScript()` sets `data-mantine-color-scheme` in `<head>` before first paint. Components that need explicit branching read `themeSettings` from the store. The `useTheme()` hook syncs Mantine and calls `saveThemeSettings`.

## 🧭 Product areas

### 💳 Token system

- Purchase tokens, view transactions, and inspect usage logs

### 🖼️ Generations

- History, filters (model, type, tags), and bulk actions

### 📁 Files

- Organize assets, tags, and uploads

### 💬 Agents chat

- `chatsStore` drives sidebar, scrollable messages, composer, and attachment flows

## 🔗 Integrations

| Integration | Role |
|-------------|------|
| 🖥️ [Coolify](https://coolify.io/) | Server management, deployments, CI/CD |
| 🔗 [Composio](https://composio.dev/) | Tool and app connectors for agents |
| ▲ [Vercel AI Gateway](https://vercel.com/ai-gateway) | Unified AI model access for agents |
| 🗄️ [Supabase](https://supabase.com/) | Database and authentication |
| 💳 [Stripe](https://stripe.com/) | Payments |

## 🧱 Tech stack

- 🧭 **React Router** — Routing and loaders
- ⚛️ **React** — UI
- 🔷 **TypeScript**
- 🎨 **Mantine** — Components
- 🐻 **Zustand** — Client state
- ⚡ **Vite** — Build and dev server

## 📜 Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | ⚡ Dev server with HMR |
| `npm run build` | 📦 Production build |
| `npm run start` | 🚀 Serve production build |
| `npm run typecheck` | 🔷 React Router typegen + `tsc` |
| `npm run lint` | 🔍 ESLint |
| `npm run format` | ✨ Prettier write |

---

Built with ❤️ for generative AI content creation.
