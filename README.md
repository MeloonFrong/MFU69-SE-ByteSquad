# InfoCenter — Aggregated Social Updates in One Place

InfoCenter collects announcements and updates from multiple sources (Facebook, Instagram, TikTok) into a single feed. Users paste the link of a page they want to follow, then organize sources with tags and filter posts by keyword. It is built for new students and newcomers to an organization, who often miss important announcements because information is scattered across many platforms.

> Developed by **Team 17 — ByteSquad** · Introduction to Software Engineering (15031001), Mae Fah Luang University

---

## 📌 Features & Highlights

- 🔗 **Add & Subscribe via Link** — Paste a Facebook / Instagram / TikTok page URL to add it as a source
- 📰 **Aggregated Feed** — Posts from every subscribed source appear in one feed, with a link back to the original post
- 🏷️ **Tagging & Filtering** — Create custom tags (e.g. `#MFU`, `#TechNews`), assign them to sources, and show or hide posts by tag or platform
- 🔍 **Keyword Sorting** — Filter posts with *Must include* / *Exclude* keywords, plus full-text search
- 🗂️ **Feed Tabs** — All / Important / Unread / Bookmarked, sortable by Newest / Oldest / Important
- 🛠️ **Manage Sources & Tags** — Enable/disable, delete, and edit the tags of each source
- 🌐 **Thai / English UI** and 🌙 **Dark / Light theme** (saved in `localStorage`)
- 🔌 **Backend-ready** — Calls a REST API at `/api/*` and automatically falls back to mock data when no backend is running

**Tech stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · lucide-react

---

## ⚙️ Installation & Run

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later (includes npm) — or [Bun](https://bun.sh/)
- *(Optional)* Python 3, if you want to run the backend

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/MeloonFrong/MFU69-SE-ByteSquad.git
cd MFU69-SE-ByteSquad
git checkout frontend-ui
git pull

# 2. Install dependencies
npm install          # or: bun install

# 3. Set up environment variables
cp .env.example .env # on Windows PowerShell: Copy-Item .env.example .env

# 4. Start the dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Available scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Preview the production build on port 3000 |
| `npm run lint` | Type-check with `tsc --noEmit` |

> [!NOTE]
> When the dev server starts, [`vite.config.ts`](vite.config.ts) tries to launch `python3 backend/server.py` on port **5001** and proxies `/api` to it. The `backend/` folder is not in the repo yet, so the app uses mock data from [`src/data/mockData.ts`](src/data/mockData.ts) instead.

---

## 📁 Project Structure

```
MFU69-SE-ByteSquad/
├── Docs/                      # Project documents
│   ├── CONTRIBUTING.md        # Git workflow & branching guidelines
│   ├── SRS.md                 # Software Requirements Specification (Markdown)
│   ├── Team17_M1_TeamCharter.pdf
│   └── Team17_M2_SRS.pdf
├── src/
│   ├── components/            # UI components
│   │   ├── Navbar.tsx
│   │   ├── FeedTabs.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── PostCard.tsx
│   │   ├── AddSourceModal.tsx
│   │   ├── ManageSourcesModal.tsx
│   │   ├── ManageTagsModal.tsx
│   │   └── AboutModal.tsx
│   ├── data/
│   │   ├── mockData.ts        # Default sources, posts, and tags
│   │   └── translations.ts    # TH / EN UI strings
│   ├── api.ts                 # REST client for /api/* (with fallbacks)
│   ├── types.ts               # Shared TypeScript types
│   ├── App.tsx                # Root component & state management
│   ├── main.tsx               # Entry point
│   └── index.css / styles.css # Global styles & theme variables
├── index.html
├── vite.config.ts             # Vite config + /api proxy
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🧪 Testing & Code Quality

- **Type checking:** `npm run lint` runs the TypeScript compiler (`tsc --noEmit`) to catch type errors without emitting output files
- **Build check:** `npm run build` type-checks before building; the build fails if there are any errors
- **Automated tests:** None yet *(planned: unit tests with Vitest + React Testing Library)*
- **Manual / acceptance testing:** Based on the Non-Functional Requirements in the [SRS](Docs/SRS.md), e.g. timing page load, and timing a first-time user adding a source without help
- **Code review:** Every change must go through a Pull Request before being merged into `main` (see [CONTRIBUTING.md](Docs/CONTRIBUTING.md))
