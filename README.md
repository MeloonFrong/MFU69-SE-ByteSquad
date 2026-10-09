# InfoCenter — Aggregated Social Updates in One Place

InfoCenter รวมประกาศและข่าวสารจากหลายแหล่ง (Facebook, Instagram, TikTok) มาไว้ในฟีดเดียว ผู้ใช้แค่วางลิงก์ของเพจที่ต้องการติดตาม แล้วจัดกลุ่มด้วยแท็กและกรองด้วยคีย์เวิร์ดได้ ทำขึ้นเพื่อแก้ปัญหาที่นักศึกษาใหม่และคนที่เพิ่งเข้าองค์กรพลาดประกาศสำคัญ เพราะข้อมูลกระจายอยู่หลายแพลตฟอร์ม

> Developed by **Team 17 — ByteSquad** · Introduction to Software Engineering (15031001), Mae Fah Luang University

---

## 📌 Features & Highlights

- 🔗 **Add & Subscribe via Link** — วาง URL ของเพจ Facebook / Instagram / TikTok เพื่อเพิ่มเป็นแหล่งข่าว
- 📰 **Aggregated Feed** — โพสต์จากทุกแหล่งที่ติดตามจะแสดงในฟีดเดียว กดเพื่อไปยังโพสต์ต้นฉบับได้
- 🏷️ **Tagging & Filtering** — สร้างแท็กเอง (เช่น `#MFU`, `#TechNews`) ผูกกับแต่ละแหล่ง และเปิด/ปิดการแสดงตามแท็กหรือแพลตฟอร์ม
- 🔍 **Keyword Sorting** — กรองโพสต์ด้วยคีย์เวิร์ดแบบ *Must include* / *Exclude* และค้นหาข้อความ
- 🗂️ **Feed Tabs** — All / Important / Unread / Bookmarked พร้อมเรียงลำดับแบบ Newest / Oldest / Important
- 🛠️ **Manage Sources & Tags** — เปิด/ปิด ลบ และแก้ไขแท็กของแต่ละแหล่ง
- 🌐 **Thai / English UI** และ 🌙 **Dark / Light theme** (บันทึกค่าไว้ใน `localStorage`)
- 🔌 **Backend-ready** — เรียก REST API ที่ `/api/*` และถ้าไม่มี backend จะใช้ mock data แทนโดยอัตโนมัติ

**Tech stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS 3 · lucide-react

---

## ⚙️ Installation & Run

### Prerequisites
- [Node.js](https://nodejs.org/) 18 ขึ้นไป (มาพร้อม npm) — หรือจะใช้ [Bun](https://bun.sh/) ก็ได้
- *(ไม่บังคับ)* Python 3 ถ้าต้องการรัน backend

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd MFU69-SE-ByteSquad

# 2. Install dependencies
npm install          # or: bun install

# 3. Set up environment variables
cp .env.example .env # on Windows PowerShell: Copy-Item .env.example .env

# 4. Start the dev server
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

### Available scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | รัน dev server ที่พอร์ต 3000 |
| `npm run build` | ตรวจ type แล้ว build สำหรับ production ไปที่ `dist/` |
| `npm run preview` | เปิดดูผลจาก build ที่พอร์ต 3000 |
| `npm run lint` | ตรวจ type ด้วย `tsc --noEmit` |

> [!NOTE]
> ตอนรัน dev server, [`vite.config.ts`](vite.config.ts) จะพยายามเปิด `python3 backend/server.py` ที่พอร์ต **5001** และ proxy `/api` ไปที่นั่น ตอนนี้ยังไม่มีโฟลเดอร์ `backend/` ใน repo แอปจึงใช้ mock data จาก [`src/data/mockData.ts`](src/data/mockData.ts) แทน

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
│   ├── index.css / styles.css # Global styles & theme variables
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

- **Type checking:** `npm run lint` เรียก TypeScript compiler (`tsc --noEmit`) เพื่อหา type error โดยไม่สร้างไฟล์ output
- **Build check:** `npm run build` จะตรวจ type ก่อน build ถ้ามี error ตัว build จะล้มเหลว
- **Automated tests:** ยังไม่มี *(แผนที่วางไว้: เพิ่ม unit test ด้วย Vitest + React Testing Library)*
- **Manual / acceptance testing:** ทดสอบตาม Non-Functional Requirements ใน [SRS](Docs/SRS.md) เช่น จับเวลาโหลดหน้า และให้ผู้ใช้ที่ไม่เคยเห็นแอปลองเพิ่มแหล่งข่าวเองแล้วจับเวลา
- **Code review:** ทุกการเปลี่ยนแปลงต้องผ่าน Pull Request ก่อน merge เข้า `main` (ดูหัวข้อถัดไป)
