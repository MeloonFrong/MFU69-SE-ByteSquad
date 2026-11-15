# InfoCenter — Use Case Diagram (M3 Design)

## 1. Use Case Overview

The **InfoCenter** system provides a unified, distraction-free social media aggregation dashboard for students, researchers, and digital professionals who follow updates across **Facebook**, **Instagram**, and **TikTok**. All use cases map directly to the M2 SRS **Must-Have Functional Requirements (FR-1 to FR-4)** and Non-Functional Requirements (NFR-1 to NFR-3).

```mermaid
flowchart LR
    User(["👤 End User<br/>(Student / Professional)"])
    Apify(["☁️ Apify Scraper API<br/>(External Actor Service)"])
    Social(["🌐 Original Social Platforms<br/>(Facebook / Instagram / TikTok)"])

    subgraph InfoCenter["InfoCenter Unified Social Feed Aggregator"]
        direction TB

        subgraph FR1["FR-1: Source Subscription & Aggregation"]
            UC1["UC-1: Add Social Media Subscriptions<br/>(URLs, @handles, or Quick-Add Presets)"]
            UC2["UC-2: Configure Per-Account Post Limits<br/>& Remove Subscriptions (RefreshConfigModal)"]
            UC3["UC-3: Trigger Multi-Platform Feed Refresh<br/>(Scrape & Normalize FB / IG / TikTok)"]
        end

        subgraph FR2["FR-2: Unified Feed & Original Source Navigation"]
            UC4["UC-4: View Unified Chronological Feed<br/>(Normalized PostCard + Media Lightbox)"]
            UC5["UC-5: Open Original Post on Native Platform<br/>(Direct External Link Verification)"]
        end

        subgraph FR3["FR-3: Custom Multi-Tagging & Categorization"]
            UC6["UC-6: Create & Assign Multiple Custom Tags<br/>to Subscribed Accounts (#MFU, #News, etc.)"]
            UC7["UC-7: Filter Unified Feed by Custom Tag<br/>& Platform / Account"]
        end

        subgraph FR4["FR-4: Keyword Filtering & Feed Sorting"]
            UC8["UC-8: Filter Posts by Include & Exclude Keywords<br/>(Real-time Client-Side Filtering)"]
            UC9["UC-9: Sort Feed by Latest Posts<br/>or Most Liked Engagement"]
        end

        subgraph NFR["Cross-Cutting UX (NFR-1 & NFR-2)"]
            UC10["UC-10: Switch Language (TH / EN)<br/>& Theme Mode (Light / Dark)"]
        end
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10

    UC1 -.->|"«includes»"| UC6
    UC1 -.->|"«triggers»"| UC3
    UC3 -->|"POST /api/{platform}Scraper/run"| Apify
    UC5 -->|"Opens target URL"| Social
```

---

## 2. Use Case Specifications (Mapped to Must FRs)

| Use Case ID | Use Case Name | Mapped Requirement | Primary Actor | Key UI Component / Backend Endpoint |
| :--- | :--- | :--- | :--- | :--- |
| **UC-1** | Add Social Media Subscriptions | **FR-1** (Must) | End User | `ScraperModal.tsx`, `parseSubscriptionInput()` (`subscriptionUtils.ts`) |
| **UC-2** | Configure Per-Account Post Limits & Unsubscribe | **FR-1** (Must) | End User | `RefreshConfigModal.tsx`, `App.tsx` (`handleSaveRefreshConfig`) |
| **UC-3** | Trigger Multi-Platform Feed Refresh | **FR-1**, **FR-2** (Must) | End User, Apify API | `FacebookApiClient.scrapeSubscribedAccounts()` (`api.ts`), C# Controllers (`Program.cs`) |
| **UC-4** | View Unified Feed & Media Gallery | **FR-2** (Must) | End User | `FeedView.tsx`, `PostCard.tsx`, `MediaGalleryModal.tsx` |
| **UC-5** | Navigate to Original Social Post | **FR-2** (Must) | End User | `PostCard.tsx` (`View Original` anchor link) |
| **UC-6** | Create & Assign Multiple Custom Tags | **FR-3** (Must) | End User | `ScraperModal.tsx`, `RefreshConfigModal.tsx`, `normalizeTagList()` |
| **UC-7** | Filter Feed by Custom Tag / Account / Platform | **FR-3** (Must) | End User | `FeedView.tsx` (Left Sidebar Tag Filter & Followed Accounts list) |
| **UC-8** | Filter Posts by Include / Exclude Keywords | **FR-4** (Must) | End User | `FeedView.tsx` (Top Filter Bar: Search, Include, Exclude inputs) |
| **UC-9** | Sort Feed by Newest or Most Liked | **FR-4** (Must) | End User | `FeedView.tsx` (`sortOrder`: `'newest'` \| `'most_liked'`) |
| **UC-10** | Switch Bilingual UI (TH/EN) & Theme (Light/Dark) | **NFR-1**, **NFR-2** | End User | `Navbar.tsx`, `LanguageContext.tsx`, `strings.ts` |
