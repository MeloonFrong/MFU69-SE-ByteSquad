# InfoCenter — Sequence & Component Diagrams (All Must FRs)

## 1. Sequence Diagram — FR-1 & FR-3: Add Subscriptions with Custom Multi-Tags & Aggregate Posts

Covers **FR-1 (Source Subscription & Aggregation)** and **FR-3 (Custom Multi-Tagging upon Subscription)**.

```mermaid
sequenceDiagram
    actor User
    participant Modal as ScraperModal.tsx
    participant Utils as subscriptionUtils.ts
    participant App as App.tsx
    participant API as FacebookApiClient (api.ts)
    participant Backend as C# .NET API (Port 5030)
    participant Mock as DEMO_MOCK_POSTS (mockData.ts)

    User->>Modal: Open "+ Add Subscription" Modal
    User->>Modal: Enter URLs / Click Quick-Add Preset (FB, IG, TikTok)
    User->>Modal: Type custom tags (e.g. "MFU", "Urgent") & press Enter (FR-3)
    Modal->>Utils: parseSubscriptionInput(url, platform, limit=1, tags)
    Utils-->>Modal: SubscriptionItem[] (normalized id, handle, tags)
    User->>Modal: Click "Add to Feed"
    Modal->>App: onAddSubscriptions(newItems)
    App->>App: Merge subscriptions & deduplicate tags (normalizeTagList)
    App->>API: scrapeSubscribedAccounts(nextSubscriptions)

    alt C# Backend Online (http://localhost:5030)
        API->>Backend: POST /api/{Facebook|Instagram|Tiktok}Scraper/run
        Backend-->>API: Scraped & stored posts JSON
        API->>Backend: GET /api/Storage/recent-posts
        Backend-->>API: RecentPostsResponse
    else Offline / Standalone Prototype Mode (file://)
        API->>Mock: Match subscribed accounts against DEMO_MOCK_POSTS
        Mock-->>API: Normalized FB / IG / TikTok posts
    end

    API-->>App: Return aggregated posts
    App->>Utils: filterPostsBySubscriptions(posts, nextSubscriptions, enforcePerSourceLimit=true)
    Utils-->>App: Strictly filtered & per-account capped posts
    App-->>User: Render Unified Feed with Source Tag Badges
```

---

## 2. Sequence Diagram — FR-2: Unified Feed Normalization, Media Gallery & Original Post Navigation

Covers **FR-2 (Unified Feed Display & Direct Link to Original Source)**.

```mermaid
sequenceDiagram
    actor User
    participant Raw as Raw Platform JSON (FB / IG / TikTok)
    participant Norm as normalizeSocialPost (mockData.ts)
    participant Feed as FeedView.tsx
    participant Card as PostCard.tsx
    participant Gallery as MediaGalleryModal.tsx
    participant External as Original Social Platform

    Raw->>Norm: Pass heterogeneous JSON item
    Norm->>Norm: Detect platform (facebook / instagram / tiktok)
    Norm->>Norm: Map author, timestamp, text, likes, comments, shares, mediaUrls
    Norm-->>Feed: Standardized FacebookPost[]
    Feed->>Card: Render PostCard(post, sourceTags)
    Card-->>User: Show Platform Badge, Author, Tag Badges, Metrics & Thumbnail

    opt User clicks post image
        User->>Card: Click media thumbnail
        Card->>Gallery: onImageClick(imageUrl)
        Gallery-->>User: Open Fullscreen Lightbox Modal
    end

    opt User clicks "View Original" (FR-2 Verification)
        User->>Card: Click "View Original / ดูโพสต์ต้นฉบับ"
        Card->>External: Open target="_blank" (post.url / post.postUrl)
    end
```

---

## 3. Sequence Diagram — FR-3: Edit Subscriptions, Per-Account Limits & Filter by Custom Tag

Covers **FR-3 (Manage Multi-Tags on Existing Sources & Filter Feed by Tag)**.

```mermaid
sequenceDiagram
    actor User
    participant Config as RefreshConfigModal.tsx
    participant App as App.tsx
    participant Feed as FeedView.tsx
    participant Utils as subscriptionUtils.ts

    User->>Config: Open "Edit Refresh Config"
    User->>Config: Adjust per-account post limit (1-50)
    User->>Config: Toggle or add new custom Tag (#Academic, #News) on account
    User->>Config: Click "Save & Refresh Feed"
    Config->>App: handleSaveRefreshConfig(updatedSubscriptions, true)
    App->>Utils: filterPostsBySubscriptions(posts, updatedSubscriptions, true)
    Utils-->>App: Updated posts respecting new limits & tags
    App-->>Feed: Pass updated subscriptions & posts

    User->>Feed: Click Tag chip (e.g. "#MFU") in Left Sidebar (FR-3)
    Feed->>Feed: setSelectedTag("MFU")
    Feed->>Utils: findMatchingSubscription(post, subscriptions)
    Utils-->>Feed: Return subscription with tags[]
    Feed-->>User: Display only posts whose source has tag "#MFU"
```

---

## 4. Sequence Diagram — FR-4: Include / Exclude Keyword Filtering & Feed Sorting

Covers **FR-4 (Search, Include Keywords, Exclude Keywords, and Sort by Latest vs Most Liked)**.

```mermaid
sequenceDiagram
    actor User
    participant Feed as FeedView.tsx
    participant Memo as useMemo Filter & Sort Pipeline

    User->>Feed: Enter Search Query (optional)
    User->>Feed: Enter Include Keywords (e.g. "scholarship, mfu")
    User->>Feed: Enter Exclude Keywords (e.g. "sponsored, giveaway")
    User->>Feed: Select Sort Order ("Latest posts" or "Most liked")

    Feed->>Memo: Recompute filteredPosts
    Memo->>Memo: 1. Filter by selectedPlatform & selectedPage
    Memo->>Memo: 2. Filter by selectedTag (FR-3)
    Memo->>Memo: 3. Filter by searchQuery (author, pageName, caption)
    Memo->>Memo: 4. Require ALL/ANY matching Include tokens (FR-4)
    Memo->>Memo: 5. Exclude any post containing Exclude tokens (FR-4)
    Memo->>Memo: 6. Sort by Timestamp DESC (newest) or Likes DESC (most_liked) (FR-4)
    Memo-->>Feed: Return filtered & sorted FacebookPost[]
    Feed-->>User: Immediately update Feed & Result Counter
```

---

## 5. Component Diagram — InfoCenter Architecture

```mermaid
flowchart TB
    User(["👤 User"])

    subgraph Frontend["Frontend SPA (Frontend/src) & Standalone Prototype (prototype/index.html)"]
        App["App.tsx<br/>Subscription & Feed State Orchestrator"]

        subgraph Components["UI Components (Frontend/src/components)"]
            Navbar["Navbar.tsx<br/>Brand, Theme Toggle (Light/Dark), Language Toggle (TH/EN)"]
            FeedView["FeedView.tsx<br/>Sidebar (Platforms, Tags FR-3, Followed Accounts)<br/>+ Top Filter Bar (Search, Include/Exclude, Sort FR-4)"]
            PostCard["PostCard.tsx<br/>Unified Post Layout, Tag Badges, Metrics & Original Link (FR-2)"]
            ScraperModal["ScraperModal.tsx<br/>Add URLs/Presets + Custom Multi-Tagging (FR-1, FR-3)"]
            RefreshModal["RefreshConfigModal.tsx<br/>Per-Account Post Limits, Multi-Tag Editor & Unsubscribe (FR-1, FR-3)"]
            GalleryModal["MediaGalleryModal.tsx<br/>Image Lightbox Preview"]
        end

        subgraph Services["Services & i18n Layer"]
            Api["services/api.ts<br/>FacebookApiClient (Port 5030 + Fallback)"]
            SubUtils["services/subscriptionUtils.ts<br/>URL Parser, Strict Filter & Tag Normalizer"]
            MockData["services/mockData.ts<br/>Real FB/IG/TikTok JSON Normalizer"]
            I18n["i18n/LanguageContext.tsx & strings.ts<br/>Bilingual TH / EN Dictionary"]
        end
    end

    subgraph Backend["C# ASP.NET Core Backend (Program.cs — Port 5030)"]
        FBights["FacebookScraperController<br/>POST /api/FacebookScraper/run"]
        IGCtrl["InstagramScraperController<br/>POST /api/InstagramScraper/run"]
        TTCtrl["TiktokScraperController<br/>POST /api/TiktokScraper/run"]
        StoreCtrl["StorageController<br/>GET /api/Storage/recent-posts"]
        Proc["PostDataProcessor & SQLite (facebook_posts.db)"]
    end

    User --> App
    App --> Navbar
    App --> FeedView
    FeedView --> PostCard
    App --> ScraperModal
    App --> RefreshModal
    App --> GalleryModal

    App --> Api
    App --> SubUtils
    FeedView --> SubUtils
    ScraperModal --> SubUtils
    RefreshModal --> SubUtils
    Api --> MockData
    Components --> I18n

    Api -->|"HTTP REST"| FBights
    Api -->|"HTTP REST"| IGCtrl
    Api -->|"HTTP REST"| TTCtrl
    Api -->|"HTTP REST"| StoreCtrl
    FBights --> Proc
    IGCtrl --> Proc
    TTCtrl --> Proc
    StoreCtrl --> Proc
```
