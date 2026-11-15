# InfoCenter — M3 Final Project Report & Golden Thread

**Group 17: ByteSquad**  
**Course:** Introduction to Software Engineering (15031001) — Mae Fah Luang University  
**Project Title:** InfoCenter — Unified Multi-Platform Social Feed Aggregator  
**SDLC Model:** Reuse-Oriented Software Engineering (integrating ASP.NET Core 8, Apify Scraper Actors, SQLite, React 19, TypeScript, and Tailwind CSS)

---

## 1. Executive Summary & Problem Statement

University students, new hires, and digital professionals rely on announcements scattered across multiple social media platforms—primarily **Facebook pages** (e.g., university faculties and student affairs), **Instagram accounts**, and **TikTok creators**. Checking each platform separately causes two critical pain points:
1. **Fragmented Information:** Important academic or community announcements are missed because they are buried across separate apps.
2. **Algorithmic Noise & Distraction:** Native social media feeds mix high-priority announcements with unrelated entertainment posts, lacking custom topic tagging or include/exclude keyword filtering.

**InfoCenter** solves this by aggregating posts from user-subscribed **Facebook**, **Instagram**, and **TikTok** sources into a single, distraction-free bilingual (**TH / EN**) dashboard with **Custom Multi-Tagging (FR-3)** and **Include/Exclude Keyword Filtering & Sorting (FR-4)**.

---

## 2. The Golden Thread (End-to-End Traceability Matrix)

Every **Must-Have Functional Requirement (FR-1 to FR-4)** traces continuously from the user pain point defined in M1/M2 through UML design diagrams, concrete UI/Backend implementation components, interactive prototype screens, and verified M3 test cases:

| Problem / Pain Point | Functional Requirement (Must FR) | System Design & Diagrams (`docs/design/`) | Prototype & Implementation Component (`prototype/index.html` & `Frontend/src/`) | Verification Test Case & Result (`docs/Testing.md`) |
| :--- | :--- | :--- | :--- | :--- |
| **P-1: Scattered Sources**<br/>Important announcements are spread across Facebook, Instagram, and TikTok, forcing users to check multiple apps manually. | **FR-1: Add & Subscribe to External Source via Link**<br/>Users can subscribe to Facebook, Instagram, and TikTok sources via URL, `@handle`, or quick-add presets, and configure per-account post limits or unsubscribe at any time. | • [Use Case Diagram](./design/Use%20Case%20Diagram.md) (`UC-1`, `UC-2`, `UC-3`)<br/>• [Sequence Diagram §1](./design/Sequence%20and%20Component%20Diagram.md) (Add Subscriptions & Scrape)<br/>• [Class Diagram](./design/Class%20diagram.md) (`ScraperModal`, `RefreshConfigModal`, `SubscriptionItem`) | • **Add Subscription Modal:** `ScraperModal.tsx` (URL/handle input + 1-click sample presets)<br/>• **Refresh Config Modal:** `RefreshConfigModal.tsx` (per-page post limit `1–50` & unsubscribe)<br/>• **Parser & API:** `subscriptionUtils.ts` (`parseSubscriptionInput`), `api.ts`, `Program.cs` (`*ScraperController`) | • **TC-01:** Add FB, IG, and TikTok URLs/handles → **PASS**<br/>• **TC-02:** Adjust per-account post limit (`1–50`) → **PASS**<br/>• **TC-03:** Unsubscribe source & remove its posts → **PASS** |
| **P-2: App-Switching Fatigue**<br/>Switching between heterogeneous apps with different layouts wastes time and makes verifying original posts cumbersome. | **FR-2: View Aggregated Content Feed**<br/>Users view normalized posts from all subscribed sources in one unified chronological feed with media previews and a direct link to the original post. | • [Use Case Diagram](./design/Use%20Case%20Diagram.md) (`UC-4`, `UC-5`)<br/>• [Sequence Diagram §2](./design/Sequence%20and%20Component%20Diagram.md) (Normalize & Render Feed)<br/>• [Deployment Diagram](./design/Deployment%20Diagram.md) (Client SPA + C# API + SQLite) | • **Unified Feed & Cards:** `FeedView.tsx`, `PostCard.tsx` (Platform badge, avatar, timestamp, expandable caption, engagement metrics, `View Original` link)<br/>• **Media Lightbox:** `MediaGalleryModal.tsx`<br/>• **Normalizer:** `normalizeSocialPost()` (`mockData.ts`) & `PostDataProcessor` (`Program.cs`) | • **TC-04:** Render normalized FB, IG, TikTok cards in one feed → **PASS**<br/>• **TC-05:** Expand long captions & open image lightbox → **PASS**<br/>• **TC-06:** Click `View Original` to open native URL → **PASS** |
| **P-3: Topic Overload**<br/>Posts from academic pages, news outlets, and creators mix together without user-defined topic grouping. | **FR-3: Categorize and Filter Subscriptions (Custom Multi-Tagging)**<br/>Users can freely create and attach multiple custom tags (e.g., `#MFU`, `#Academic`, `#News`) to any subscribed source and filter the feed by tag. | • [Use Case Diagram](./design/Use%20Case%20Diagram.md) (`UC-6`, `UC-7`)<br/>• [Sequence Diagram §1 & §3](./design/Sequence%20and%20Component%20Diagram.md) (Multi-Tagging & Tag Filter)<br/>• [Class Diagram](./design/Class%20diagram.md) (`SubscriptionItem.tags`, `normalizeTagList`) | • **Tag Creation & Assignment:** `ScraperModal.tsx` & `RefreshConfigModal.tsx` (custom tag input + multi-tag chips)<br/>• **Sidebar Tag Filter & Badges:** `FeedView.tsx` (Left Sidebar `Filter by Tag` card + `#Tag` badges under each account & on `PostCard.tsx`) | • **TC-07:** Create custom tags & assign multiple tags per source → **PASS**<br/>• **TC-08:** Filter unified feed by clicking `#Tag` in Left Sidebar → **PASS** |
| **P-4: Irrelevant Posts & Noise**<br/>Subscribed pages frequently post off-topic content, making it hard to isolate high-priority announcements or top-engagement posts. | **FR-4: Information Sorting & Keyword Filtering System**<br/>Users can filter posts using comma-separated **Include** (`Must Contain`) and **Exclude** (`Hide Word`) keywords and sort the feed by **Latest posts** or **Most liked**. | • [Use Case Diagram](./design/Use%20Case%20Diagram.md) (`UC-8`, `UC-9`)<br/>• [Sequence Diagram §4](./design/Sequence%20and%20Component%20Diagram.md) (Include/Exclude & Sort Pipeline)<br/>• [Class Diagram](./design/Class%20diagram.md) (`FeedView` filter state & `SortOrder`) | • **Top Filter & Sort Control Bar:** `FeedView.tsx` (`searchQuery`, `includeKeywords` input, `excludeKeywords` input, `sortOrder` selector: `newest` vs `most_liked`, active filter summary strip) | • **TC-09:** Filter posts with `Include` keywords → **PASS**<br/>• **TC-10:** Hide posts matching `Exclude` keywords → **PASS**<br/>• **TC-11:** Sort feed by `Latest posts` vs `Most liked` → **PASS** |

---

## 3. System Architecture Summary

InfoCenter is architected as a modular **Reuse-Oriented** system supporting both full-stack execution and zero-install evaluation:

1. **Standalone Clickable Prototype (`prototype/index.html`):**
   - Self-contained single HTML5 bundle that opens directly in any browser via `file://` (double-click, no server required).
   - Pre-seeded with 3 multi-platform subscriptions (`MFU2Connect` [`#MFU`, `#Academic`], `humansofny` [`#News`, `#Creator`], `khaby.lame` [`#Creator`]) and real normalized Apify JSON datasets (`FacebookOutput.txt`, `InstaOutput.txt`, `Tiktokoutput.txt`) so evaluators can immediately test **FR-1, FR-2, FR-3, and FR-4**.
2. **React 19 + TypeScript Frontend (`Frontend/src/`):**
   - Built with Vite and Tailwind CSS following the **Editorial Daylight & Obsidian Slate** design system (Plus Jakarta Sans + Noto Sans Thai + JetBrains Mono).
   - Supports instant **Thai / English (`TH` / `EN`)** language switching and **Light / Dark** theme persistence.
3. **C# ASP.NET Core (.NET 8) Backend (`Program.cs` on Port `5030`):**
   - Provides REST endpoints (`/api/FacebookScraper/run`, `/api/InstagramScraper/run`, `/api/TiktokScraper/run`, `/api/Storage/recent-posts`, `/api/ApifyDataset/fetch`).
   - Integrates with Apify Scraper Actors and persists normalized social posts into a local **SQLite** database (`facebook_posts.db`).

---

## 4. Non-Functional Requirements (NFR) Summary

| NFR ID | Requirement | Target Metric | Measured Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-1** | Initial Application Load Time | `< 8.0 seconds` | **< 0.9 seconds** (Vite bundle & `prototype/index.html`) | **PASS** |
| **NFR-2** | Feed Rendering per 10 Posts | `< 10.0 seconds` | **< 0.4 seconds** for 15 normalized multi-platform posts | **PASS** |
| **NFR-3** | First-Time User Onboarding & Bilingual UX | Add first source in `< 60 seconds`; full `TH`/`EN` UI | **< 20 seconds** via `+ Add Subscription` & 1-click preset pills; 100% `TH`/`EN` coverage | **PASS** |
| **NFR-4** | Offline & Demo Resilience | Graceful fallback when backend/Apify is unreachable | Automatic fallback to normalized dataset in `api.ts` | **PASS** |
| **NFR-5** | Data Privacy | Store only subscribed URLs, tags, and public post data | Verified in `localStorage` and `facebook_posts.db` | **PASS** |

---

## 5. Team Members & Responsibilities (Group 17: ByteSquad)

| Student ID | Name | GitHub Account | Primary Contributions |
| :--- | :--- | :--- | :--- |
| `6931503004` | **Htet Wai Yan** | [@htetwaiyan](https://github.com/htetwaiyan) | System Architecture, C# .NET Backend (`Program.cs`), Apify & SQLite Integration, Frontend Redesign & Standalone Prototype |
| `6931503026` | **Kunut Wongtidatorn** | [@6931503026-netizen](https://github.com/6931503026-netizen) | Requirements Engineering (SRS), Traceability Matrix, QA Testing & Verification |
| `6931503084` | **Anansit Inta** | [@MeloonFrong](https://github.com/MeloonFrong) | UML System Design Diagrams (Class, Sequence, Component, Deployment, Use Case) & Documentation |
| `6931503091` | **Aung Phone Pyae Oo** | [@APPOfrom2069](https://github.com/APPOfrom2069) | UI/UX Design, Multi-Tagging & Filtering Workflows, Bilingual Localization |
| `6931503096` | **Swan Naing Aung** | [@Arkash-Drayven](https://github.com/Arkash-Drayven) | QA Test Execution (`docs/Testing.md`), Demo Slides & Final Report Review |
