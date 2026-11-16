# InfoCenter — Unified Multi-Platform Social Feed Aggregator

**Group 17: ByteSquad**  
**Course:** Introduction to Software Engineering (`15031001`) — Mae Fah Luang University  
**SDLC Methodology:** Reuse-Oriented Software Engineering  

---

## 1. Project Overview

**InfoCenter** is a centralized, distraction-free bilingual (**Thai / English**) web application that aggregates announcements and updates from user-subscribed **Facebook pages**, **Instagram profiles**, and **TikTok accounts** into a single chronological feed.

Designed for university students, new hires, and digital professionals who suffer from scattered announcements across multiple apps, InfoCenter implements all four **Must-Have Functional Requirements** defined in our SRS:
- **FR-1 — Add & Subscribe to External Sources via Link:** Subscribe to Facebook pages, Instagram profiles, and TikTok accounts by pasting their URLs, and configure per-account **Scrape limits** (default `1` new post) and **View limits** (default `10` stored posts) or unsubscribe at any time.
- **FR-2 — View Aggregated Content Feed:** Read normalized posts across all 3 platforms in one unified feed with platform badges, author metadata, engagement counts (`Likes`, `Comments`, `Shares`, `Views`), media lightbox preview, and a direct **View original** link to the native post.
- **FR-3 — Categorize & Filter Subscriptions (Custom Multi-Tagging):** Freely create custom `#tags`, attach or detach multiple tags per subscribed source, filter the feed via the **Show tags (`แสดงแท็ก`)** panel, and delete tags (`X`) at any time.
- **FR-4 — Search & Keyword Filtering System:** Search captions and account names in real time, and filter posts using comma-separated **Include Keywords (`ต้องมีคำว่า`)** and **Exclude Keywords (`ยกเว้นคำว่า`)**.

---

## 2. Team Members (Group 17: ByteSquad)

| Student ID | Full Name | GitHub Account |
| :--- | :--- | :--- |
| `6931503004` | **Htet Wai Yan** | [@htetwaiyan](https://github.com/htetwaiyan) |
| `6931503026` | **Kunut Wongtidatorn** | [@6931503026-netizen](https://github.com/6931503026-netizen) |
| `6931503084` | **Anansit Inta** | [@MeloonFrong](https://github.com/MeloonFrong) |
| `6931503091` | **Aung Phone Pyae Oo** | [@APPOfrom2069](https://github.com/APPOfrom2069) |
| `6931503096` | **Swan Naing Aung** | [@Arkash-Drayven](https://github.com/Arkash-Drayven) |

---

## 3. How to Open the Clickable Prototype

Click the link below to open the live web application directly in your browser (no local setup required):

👉 **[clickable prototype](https://proud-mud-0b9904600.5.azurestaticapps.net/)**

### 5-Step Happy-Path Walkthrough (Testing FR-1 to FR-4)
1. **Add a Subscribed Source & Custom Tags (FR-1 & FR-3):** Click **`+ เพิ่มแหล่งข้อมูล / + Add source`** in the Left Sidebar (or on the initial onboarding card). Paste a Facebook page, Instagram profile, or TikTok account URL (e.g., `https://www.facebook.com/MFU2Connect`, `https://www.instagram.com/humansofny`, or `https://www.tiktok.com/@khaby.lame`) and click **`เพิ่ม URL / Add URL`**. Optionally type a new custom tag (e.g., `#MFU`) and click **`+ สร้างแท็ก / + Create tag`** (you can also delete any tag using the **`X`** button on the tag chip), then click **`เพิ่มแหล่งข้อมูล / Subscribe & fetch posts`**.
2. **Verify Unified Feed & Original Link (FR-2):** Inspect the unified feed containing normalized Facebook, Instagram, and TikTok posts from your subscribed sources. Click any post image to open the full-screen Lightbox preview, or click **`ดูต้นฉบับบน... / View original on...`** on any card to open the native post URL.
3. **Manage & Filter by Custom Tags (FR-3):** In the Left Sidebar under *Platforms*, click **`แสดงแท็ก / Show tags`** to create new tags, check/uncheck tags (or use **`แสดงทั้งหมด / Show all`** and **`ซ่อนทั้งหมด / Hide all`**) to filter the feed by tag, or click **`X`** to remove a tag. You can also click any account under **`เพจและแอคเคาท์ที่ติดตาม / Followed accounts`** to expand its tag panel and assign or unassign tags for that specific source.
4. **Search & Filter by Include / Exclude Keywords (FR-4):** In the center **`ค้นหาและกรองโพสต์ / Search & filter posts`** card, use the full-width search bar to search captions or account names, type required words in **`ต้องมีคำว่า (Include)`**, and type unwanted words in **`ยกเว้นคำว่า (Exclude)`** (comma-separated) to filter posts in real time.
5. **Refresh Feed & Configure Scrape/View Limits (FR-1 & NFR):** In the Right Sidebar, click **`Edit Refresh Config`** to configure each subscribed source's **Scrape limit (`ขอดึง`, default `1` new post)** and **View limit (`ขอดู`, default `10` existing posts)** or unsubscribe an account. Click **`Refresh`** to both scrape new posts and fetch stored posts from the C# Backend, and use the top Navbar buttons to toggle **Thai / English (`TH` / `EN`)** and **Light / Dark Mode**.

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
| [clickable prototype](https://proud-mud-0b9904600.5.azurestaticapps.net/) | **Live Clickable Prototype** (`https://proud-mud-0b9904600.5.azurestaticapps.net/') |
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
| **Source Code** | |
| [`Program.cs`](./Program.cs) & [`FacebookScraperApi.csproj`](./FacebookScraperApi.csproj) | **C# ASP.NET Core (.NET 8) Backend** (`Port 5030`, Apify actors & SQLite persistence) |
| [`Frontend/src/`](./Frontend/src/) | **React 19 + TypeScript + Tailwind CSS Frontend Source Code** |
