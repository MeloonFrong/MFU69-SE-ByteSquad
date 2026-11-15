# AI Use Statement & Reflection (M3)

**Group 17: ByteSquad — InfoCenter**  
**Course:** Introduction to Software Engineering (15031001)  

---

## 1. Overview & AI Tools Used

Throughout the development of **InfoCenter** (Milestones 1–3), our team used generative AI tools as engineering assistants for boilerplate generation, multi-platform JSON normalization, UI/UX refactoring, and documentation formatting, while keeping architectural decisions, requirements alignment, and verification under human control.

| Tool / Platform | Model | Primary Use Cases |
| :--- | :--- | :--- |
| **ChatGPT** | GPT-6 Astra / GPT-4o | Scaffolding C# ASP.NET Core Web API (`Program.cs`, `PostDataProcessor.cs`, `ApifyDatasetService.cs`) and SQLite persistence queries. |
| **Google AI Studio / Antigravity** | Gemini | Scaffolding initial React + TypeScript frontend, refactoring the Editorial Daylight / Obsidian Slate UI design system, implementing FR-3/FR-4 filtering, and bundling `prototype/index.html`. |
| **Mermaid.js + AI Assistant** | ChatGPT / Gemini | Drafting initial Mermaid syntax for UML Use Case, Class, Sequence, Component, and Deployment diagrams (`docs/design/`). |

---

## 2. Chronological AI Usage Log (Backend & Frontend Evolution)

1. **Phase 1 — Backend Scaffolding (`Backend` branch — Kunut):**
   - **AI Tool:** ChatGPT (`GPT-6 Astra`)
   - **Scope:** Assisted in writing the initial C# .NET backend services and Apify integration:
     - `ApifyDatasetService.cs`
     - `PostDataProcessor.cs`
     - `Program.cs`
2. **Phase 2 — Initial Frontend Placeholder (Kunut & Team):**
   - **AI Tool:** Google AI Studio (`Gemini 4 Hydrogen`)
   - **Scope:** Generated the initial React placeholder frontend ([Frontend-Placeholder Archive](https://drive.google.com/drive/folders/1KoV6SCDnvSbDoaQqwjIZCYHJPtxe0x2l?usp=sharing)) to test backend API connectivity.
3. **Phase 3 — Backend Integration & API Wiring (`BackendFix_&_PlaceholderFrontend` branch):**
   - **AI Tool:** ChatGPT (`GPT-6 Astra`)
   - **Scope:** Refined C# controllers (`Program.cs`, `PostDataProcessor.cs`, `ApifyDatasetService.cs`) and wired `Frontend/src/services/api.ts`, `Frontend/src/components/PostCard.tsx`, and `DatasetViewer.tsx` to communicate over `http://localhost:5030`.
4. **Phase 4 — M3 Frontend Redesign, Must FR-1..FR-4 Completion & Standalone Prototype (`frontend-polish` branch):**
   - **AI Tool:** Google Antigravity (`Gemini`)
   - **Scope:**
     - Normalized real Apify JSON outputs from Facebook (`FacebookOutput.txt`), Instagram (`InstaOutput.txt`), and TikTok (`Tiktokoutput.txt`) in `Frontend/src/services/mockData.ts`.
     - Implemented **FR-3 (Custom Multi-Tagging & Tag Filter)** and **FR-4 (Include/Exclude Keyword Filtering & Sorting)** across `ScraperModal.tsx`, `RefreshConfigModal.tsx`, `FeedView.tsx`, and `subscriptionUtils.ts`.
     - Built the zero-server single-file clickable prototype (`prototype/index.html`) for direct `file://` evaluation.

---

## 3. What Worked Well

- **Heterogeneous JSON Normalization (FR-2):** Feeding real sample JSON outputs from Apify's Facebook, Instagram, and TikTok scrapers into the AI assistant allowed us to rapidly map divergent field names (`pageName` vs. `ownerUsername` vs. `authorMeta.name`, and `likes` vs. `likesCount` vs. `diggCount`) into a single strongly-typed `FacebookPost` TypeScript interface.
- **Bilingual Dictionary Generation (TH/EN):** AI accelerated translating and maintaining 140+ UI keys across Thai and English in `Frontend/src/i18n/strings.ts` with consistent terminology.
- **Boilerplate C# Controller & SQLite Setup:** AI quickly generated the standard `Microsoft.Data.Sqlite` table creation and parameterized `INSERT OR REPLACE` statements in `Program.cs`.

---

## 4. What Did Not Work (AI Mistakes Caught & Corrected by the Team)

1. **Outdated Architecture in Early AI-Generated Diagrams:**
   - **Mistake:** Early AI-generated Mermaid diagrams in `Docs/` assumed a "Python Backend Server" and referenced placeholder component names (`AddSourceModal`, `ManageSourcesModal`) that did not match our actual C# `.NET 8` backend (`Program.cs`) and `Frontend/src/` components.
   - **How We Fixed It:** We audited every diagram in `docs/design/` (`Use Case Diagram.md`, `Class diagram.md`, `Deployment Diagram.md`, `Sequence and Component Diagram.md`) and rewrote them to match the actual C# controllers and React TypeScript components.
2. **Broken `file://` Standalone Prototype due to Vite ES Module CORS:**
   - **Mistake:** Standard `vite build` outputs `<script type="module" crossorigin src="/assets/index-*.js">`. When double-clicked via `file://`, modern browsers block external ES module scripts with a CORS error and resolve `/assets/...` to the root drive (`C:/assets/`).
   - **How We Fixed It:** We built a custom bundler step that inlines the compiled CSS and JavaScript directly into `prototype/index.html` with pre-seeded multi-platform subscriptions so the prototype opens cleanly via `file://` with zero external network or server dependencies.
3. **Strict Subscription Filtering & Per-Account Limits:**
   - **Mistake:** Initial AI code loaded all cached/mock posts on startup even when the user had 0 subscribed accounts, and ignored per-account post limits during feed refresh.
   - **How We Fixed It:** We implemented `filterPostsBySubscriptions(posts, subscriptions, true)` in `subscriptionUtils.ts` so `Frontend/src` starts with a clean zero-account state and strictly enforces each subscribed account's `postsLimit` and custom `tags`.
4. **External CDN Image Blocking (Instagram & TikTok Thumbnails):**
   - **Mistake:** Raw Instagram (`fbcdn.net`) and TikTok (`tiktokcdn.com`) CDN URLs in scraped JSON expire or block cross-origin hotlinking (`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`).
   - **How We Fixed It:** We added reliable fallback media URLs and an `onError` image handler in `PostCard.tsx` so broken external CDN links degrade gracefully without breaking card layouts.

---

## 5. How We Checked and Verified AI Output

Every piece of AI-assisted code and documentation was verified through four concrete checks before acceptance:
1. **Static Type & Build Verification:** Ran `npm run lint` (`tsc --noEmit`) and `npm run build` in `Frontend/` as well as `dotnet build` on `FacebookScraperApi.csproj` to ensure zero TypeScript or C# compiler errors.
2. **End-to-End API & Port 5030 Contract Testing:** Verified that `Frontend/src/services/api.ts` preserves exact endpoint paths (`/api/FacebookScraper/run`, `/api/InstagramScraper/run`, `/api/TiktokScraper/run`, `/api/Storage/recent-posts`) matching `Program.cs`.
3. **Automated Visual & DOM Auditing (Playwright):** Rendered both the Vite build and `file:///.../prototype/index.html` in headless Chromium at Desktop (`1440×900`) and Mobile (`390×844`) viewports in both Light (`TH`) and Dark (`EN`) themes, verifying zero console errors, zero horizontal overflow, and WCAG AA contrast compliance.
4. **Manual Golden Thread Test Execution (`TC-01` to `TC-11`):** Manually executed all 11 functional test cases documented in [`docs/Testing.md`](./Testing.md) across FR-1, FR-2, FR-3, and FR-4.
