# InfoCenter — Unified Multi-Platform Social Feed Aggregator

**Group 17: ByteSquad**  
**Course:** Introduction to Software Engineering (`15031001`) — Mae Fah Luang University  
**SDLC Methodology:** Reuse-Oriented Software Engineering  

---

## 1. Project Overview

**InfoCenter** is a centralized, distraction-free bilingual (**Thai / English**) web application that aggregates announcements and updates from user-subscribed **Facebook pages**, **Instagram profiles**, and **TikTok accounts** into a single chronological feed.

Designed for university students, new hires, and digital professionals who suffer from scattered announcements across multiple apps, InfoCenter implements all four **Must-Have Functional Requirements** defined in our SRS:
- **FR-1 — Add & Subscribe to External Sources via Link:** Subscribe to Facebook, Instagram, and TikTok sources using URLs, `@handles`, or 1-click sample presets, and manage per-account post limits (`1–50` posts) or unsubscribe at any time.
- **FR-2 — View Aggregated Content Feed:** Read normalized posts across all 3 platforms in one unified feed with platform badges, author metadata, engagement counts (`Likes`, `Comments`, `Shares`), media lightbox preview, and a direct **View Original** link to the native post.
- **FR-3 — Categorize & Filter Subscriptions (Custom Multi-Tagging):** Freely create and attach multiple custom tags (e.g., `#MFU`, `#Academic`, `#News`, `#Creator`, or any user-typed tag) to subscribed accounts and filter the entire feed by tag in one click.
- **FR-4 — Information Sorting & Keyword Filtering System:** Filter posts in real time using comma-separated **Include Keywords** (`Must Contain`) and **Exclude Keywords** (`Hide Word`), and sort the feed by **Latest posts (Newest)** or **Most liked (Engagement)**.

---

## 2. Team Members (Group 17: ByteSquad)

| Student ID | Full Name | GitHub Account | Role & Responsibilities |
| :--- | :--- | :--- | :--- |
| `6931503004` | **Htet Wai Yan** | [@htetwaiyan](https://github.com/htetwaiyan) | Lead Developer, C# .NET Backend (`Program.cs`), Apify & SQLite Integration, Frontend Redesign & Standalone Prototype |
| `6931503026` | **Kunut Wongtidatorn** | [@6931503026-netizen](https://github.com/6931503026-netizen) | Requirements Lead (SRS), Backend/API Integration, Traceability Matrix & QA Verification |
| `6931503084` | **Anansit Inta** | [@MeloonFrong](https://github.com/MeloonFrong) | System Architect, UML Diagrams (`docs/design/`) & Technical Documentation |
| `6931503091` | **Aung Phone Pyae Oo** | [@APPOfrom2069](https://github.com/APPOfrom2069) | UI/UX Designer, Multi-Tagging & Filtering Workflows, Bilingual (`TH`/`EN`) Localization |
| `6931503096` | **Swan Naing Aung** | [@Arkash-Drayven](https://github.com/Arkash-Drayven) | QA Engineer (`docs/Testing.md`), Demo Presentation Slides (`slides/`) & Final Report |

---

## 3. How to Open the Clickable Prototype (No Server Required)

For rapid M3 evaluation without installing `.NET` or `Node.js`, a **100% self-contained single-file clickable prototype** is pre-built at:

👉 **[`prototype/index.html`](./prototype/index.html)**

### Opening Instructions
1. Clone or download this repository.
2. Navigate to the [`prototype/`](./prototype/) folder and **double-click `index.html`** to open it directly in any modern web browser (`Chrome`, `Edge`, `Firefox`, or `Safari`) via `file://`.
3. **No backend server, local web server, or internet connection is required.** The prototype bundles all compiled UI components, styles, and normalized multi-platform sample datasets (`MFU2Connect`, `humansofny`, `khaby.lame`, `ISC MFU`, `zenlesszonezero`).

### 5-Step Happy-Path Walkthrough (Testing FR-1 to FR-4)
1. **Verify Unified Feed & Original Link (FR-2):** Upon opening `prototype/index.html`, inspect the unified feed containing normalized Facebook, Instagram, and TikTok posts. Click an image to open the Lightbox, or click **`ดูโพสต์ต้นฉบับ / View Original`** on any card to open the native post URL.
2. **Add a New Source with Custom Multi-Tags (FR-1 & FR-3):** Click **`+ เพิ่มรายการติดตาม / + Add Subscription`**, click one of the Quick-Add preset pills (e.g., `ISC MFU (FB)` or `Zenless Zone Zero (TikTok)`) or paste any URL, type a custom tag (e.g., `Urgent` or `Scholarship`) and press `Enter`, then click **`เพิ่มลงในฟีด / Add to Feed`**.
3. **Filter Feed by Custom Tag (FR-3):** In the Left Sidebar under **`กรองตามแท็ก (FR-3) / Filter by Tag (FR-3)`**, click `#MFU`, `#Academic`, or `#Creator` to display only posts from accounts carrying that tag.
4. **Filter by Include / Exclude Keywords & Sort (FR-4):** In the top filter bar, type a required keyword in **`ต้องมีคำว่า (Include)`**, type an unwanted word in **`ซ่อนคำว่า (Exclude)`**, and switch the Sort selector between **`โพสต์ล่าสุด / Latest posts`** and **`ยอดไลก์สูงสุด / Most liked`**.
5. **Adjust Per-Account Post Limits & Bilingual/Theme UX (FR-1 & NFR):** Click **`แก้ไขการตั้งค่ารีเฟรช / Edit Refresh Config`** in the Left Sidebar to change per-page post limits (`1–50`) or edit account tags, and use the top Navbar buttons to toggle **Thai / English (`TH` / `EN`)** and **Light / Dark Mode**.

---

## 4. How to Run the Full-Stack Application (C# Backend + React Frontend)

### Prerequisites
- **[.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)** (for the C# ASP.NET Core Web API & SQLite storage)
- **[Node.js 18+](https://nodejs.org/)** and `npm` (for the React 19 + TypeScript + Vite frontend)

### Step 1: Start the C# .NET Backend (Port `5030`)
From the root directory of the repository (`MFU69-SE-ByteSquad/`):

```bash
dotnet restore
dotnet run --urls "http://localhost:5030"
```

- The backend starts on **`http://localhost:5030`** (Swagger UI available at `http://localhost:5030/swagger`).
- Available REST API endpoints in [`Program.cs`](./Program.cs):
  - `POST /api/FacebookScraper/run` — Trigger Facebook page scrape & SQLite persistence
  - `POST /api/InstagramScraper/run` — Trigger Instagram profile scrape & SQLite persistence
  - `POST /api/TiktokScraper/run` — Trigger TikTok creator scrape & SQLite persistence
  - `GET /api/Storage/recent-posts` — Query normalized posts stored in `facebook_posts.db`
  - `GET /api/ApifyDataset/fetch` — Fetch dataset items from an Apify run

### Step 2: Start the React + Vite Frontend
Open a second terminal and run:

```bash
cd Frontend
npm install
npm run dev
```

- Open the printed local URL (default **`http://localhost:3000`** or **`http://localhost:5173`**) in your browser.
- By default, the frontend connects to the deployed Azure C# Backend (**`https://infocenter-c4a7fqdegrhecdee.eastasia-01.azurewebsites.net`**), or you can switch to `http://localhost:5030` for local backend development (with automatic fallback to normalized offline datasets if unreachable).

---

## 5. Repository Structure & Documentation Index

| Path / Document | Description |
| :--- | :--- |
| **Clickable Prototype** | |
| [`prototype/index.html`](./prototype/index.html) | **Standalone Clickable Prototype** (opens directly via double-click / `file://` with zero server) |
| **Milestone Reports & Core Docs (`docs/`)** | |
| [`docs/final-report.md`](./docs/final-report.md) | **M3 Final Project Report & Complete Golden Thread Table** (`Problem → FR → Design → Prototype → Test`) |
| [`docs/SRS.md`](./docs/SRS.md) | **Software Requirements Specification (Markdown)** with updated Section 7 Traceability Matrix |
| [`docs/Team17_M2_SRS.pdf`](./docs/Team17_M2_SRS.pdf) | **M2 SRS Official PDF Submission** |
| [`docs/Team17_M1_TeamCharter.pdf`](./docs/Team17_M1_TeamCharter.pdf) | **M1 Team Charter Official PDF Submission** |
| [`docs/Testing.md`](./docs/Testing.md) | **QA & System Test Report (`TC-01` to `TC-11`, NFR Checks, and Bug Resolution Log)** |
| [`docs/ai-use-statement.md`](./docs/ai-use-statement.md) | **M3 AI Use Statement & Reflection** (Where AI helped, What worked, AI mistakes caught, Verification) |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Team Git workflow, branching conventions, and contribution guidelines |
| [`docs/InfoCenter_Project_Documentation.pdf`](./docs/InfoCenter_Project_Documentation.pdf) | Supplementary compiled project documentation PDF |
| **System Design & UML Diagrams (`docs/design/`)** | |
| [`docs/design/Use Case Diagram.md`](./docs/design/Use%20Case%20Diagram.md) | **UML Use Case Diagram & Specifications** mapped to FR-1, FR-2, FR-3, FR-4 |
| [`docs/design/Class diagram.md`](./docs/design/Class%20diagram.md) | **UML Class & Data Model Diagram** (React TypeScript + C# .NET Backend + SQLite) |
| [`docs/design/Sequence and Component Diagram.md`](./docs/design/Sequence%20and%20Component%20Diagram.md) | **UML Sequence Diagrams (FR-1 to FR-4) & Component Architecture Diagram** |
| [`docs/design/Deployment Diagram.md`](./docs/design/Deployment%20Diagram.md) | **UML Deployment Diagram** (Standalone Prototype Mode + Full-Stack Mode) |
| **Presentation Slides (`slides/`)** | |
| [`slides/demo-slides.pdf`](./slides/demo-slides.pdf) | **M3 Final Demo Presentation Slides (PDF)** |
| [`slides/InfoCenter_M3_Demo_Slides_ByteSquad.pptx`](./slides/InfoCenter_M3_Demo_Slides_ByteSquad.pptx) | **M3 Final Demo Presentation Slides (PowerPoint `.pptx`)** |
| **Source Code** | |
| [`Program.cs`](./Program.cs) & [`FacebookScraperApi.csproj`](./FacebookScraperApi.csproj) | **C# ASP.NET Core (.NET 8) Backend** (`Port 5030`, Apify actors & SQLite persistence) |
| [`Frontend/src/`](./Frontend/src/) | **React 19 + TypeScript + Tailwind CSS Frontend Source Code** |
