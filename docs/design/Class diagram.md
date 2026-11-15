# InfoCenter — UML Class & Data Model Diagram

## 1. Class Diagram (Frontend + C# .NET Backend)

This diagram illustrates the object-oriented data models, React components, TypeScript service layer (`Frontend/src/`), and C# ASP.NET Core Web API classes (`Program.cs`) that implement **FR-1 through FR-4**.

```mermaid
classDiagram
direction LR

class AppShell {
    <<React Root Component>>
    -SubscriptionItem[] subscriptions
    -FacebookPost[] posts
    -boolean isLoading
    -boolean isRefreshing
    -string selectedPage
    -number limit
    -boolean isSimulated
    +checkStatus() Promise~boolean~
    +handleRefresh(subsOverride) Promise~void~
    +handleAddSubscriptions(newItems) Promise~void~
    +handleSaveRefreshConfig(updatedSubs, triggerRefresh) void
}

class FeedView {
    <<React Component>>
    -PlatformFilter selectedPlatform
    -string selectedTag
    -SortOrder sortOrder
    -string searchQuery
    -string includeKeywords
    -string excludeKeywords
    +filteredPosts FacebookPost[]
}

class ScraperModal {
    <<React Component>>
    -PlatformChoice platformChoice
    -string rawUrls
    -string[] selectedTags
    -string customTagInput
    +handleAddCustomTag() void
    +handlePresetClick(url, tags) void
    +handleSubmit(e) Promise~void~
}

class RefreshConfigModal {
    <<React Component>>
    -SubscriptionItem[] draftList
    -Record~string,string~ tagInputByItem
    +handleLimitChange(id, limit) void
    +handleToggleItemTag(id, tag) void
    +handleAddCustomTagToItem(id) void
    +handleRemoveItem(id) void
}

class PostCard {
    <<React Component>>
    +FacebookPost post
    +string[] sourceTags
    +onImageClick(url) void
}

class SubscriptionItem {
    <<Data Model (FR-1, FR-3)>>
    +string id
    +SubscriptionPlatform platform
    +string handle
    +string displayName
    +string url
    +number postsLimit
    +string[] tags
}

class FacebookPost {
    <<Normalized Post Model (FR-2)>>
    +string postId
    +string url
    +string postUrl
    +string pageName
    +string text
    +string captionText
    +number timestamp
    +string time
    +number likes
    +number comments
    +number shares
    +string[] mediaUrls
    +FacebookAuthor user
}

class FacebookApiClient {
    <<TypeScript Service (api.ts)>>
    -string baseUrl
    +checkConnection() Promise~ConnectionResult~
    +scrapeSubscribedAccounts(subscriptions) Promise~ScrapeResult~
    +getRecentPosts(pageName, limit) Promise~RecentPostsResponse~
    +runFacebookScraper(input) Promise~ScraperResult~
    +runInstagramScraper(input) Promise~ScraperResult~
    +runTiktokScraper(input) Promise~ScraperResult~
    +getPostTimestamp(post) number
    +getPostImages(post) string[]
}

class SubscriptionUtils {
    <<Utility Module (subscriptionUtils.ts)>>
    +parseSubscriptionInput(raw, platform, limit, tags) SubscriptionItem
    +doesPostMatchSubscription(post, sub) boolean
    +filterPostsBySubscriptions(posts, subs, enforcePerSourceLimit) FacebookPost[]
    +normalizeTagList(tags) string[]
}

class DotNetControllers {
    <<C# ASP.NET Core API (Program.cs)>>
    +FacebookScraperController.Run(request)
    +InstagramScraperController.Run(request)
    +TiktokScraperController.Run(request)
    +StorageController.GetRecentPosts(pageName, limit)
    +ApifyDatasetController.FetchDataset(datasetId)
}

class PostDataProcessor {
    <<C# Service (Program.cs)>>
    +ProcessAndStorePostsAsync(rawJson, platform) Task~int~
    +NormalizeTimestamp(rawValue) long
    +ExtractMediaUrls(item) List~string~
}

class SQLiteStorage {
    <<SQLite Database (facebook_posts.db)>>
    +Table Posts (PostId PK, Platform, PageName, Text, Timestamp, Likes, Shares, MediaJson, RawJson)
}

AppShell "1" *-- "1" FeedView : renders
AppShell "1" *-- "1" ScraperModal : renders
AppShell "1" *-- "1" RefreshConfigModal : renders
FeedView "1" *-- "0..*" PostCard : displays
AppShell "1" o-- "0..*" SubscriptionItem : manages
AppShell "1" o-- "0..*" FacebookPost : stores
SubscriptionItem "1" --> "0..*" FacebookPost : filters & tags
AppShell --> FacebookApiClient : calls
AppShell --> SubscriptionUtils : uses
FeedView --> SubscriptionUtils : matches tags & accounts
FacebookApiClient --> DotNetControllers : HTTP REST (Port 5030)
DotNetControllers --> PostDataProcessor : normalizes JSON
PostDataProcessor --> SQLiteStorage : persists & queries
```

---

## 2. Core Data Entities & Responsibilities

1. **`SubscriptionItem` (`Frontend/src/types/facebook.ts`) — FR-1 & FR-3:**
   - Represents a subscribed social media page/account across `facebook`, `instagram`, or `tiktok`.
   - Holds `postsLimit` (per-account display cap) and `tags: string[]` (custom multi-tag categories created or selected by the user).
2. **`FacebookPost` (`Frontend/src/types/facebook.ts` & `mockData.ts`) — FR-2:**
   - Unified schema normalized by `normalizeSocialPost()` from raw Facebook (`pageName`, `topLevelUrl`, `likes`), Instagram (`ownerUsername`, `shortCode`, `likesCount`), and TikTok (`authorMeta.name`, `webVideoUrl`, `diggCount`) payloads.
3. **`FacebookApiClient` (`Frontend/src/services/api.ts`) — FR-1 & FR-2:**
   - Connects to the C# .NET 8 Web API on `http://localhost:5030` (`/api/Storage/recent-posts`, `/api/FacebookScraper/run`, `/api/InstagramScraper/run`, `/api/TiktokScraper/run`) and provides automatic simulation fallback (`DEMO_MOCK_POSTS`) when running offline or inside `prototype/index.html`.
4. **`DotNetControllers` & `PostDataProcessor` (`Program.cs`) — FR-1 & FR-2:**
   - C# backend controllers that orchestrate Apify actor runs, parse heterogeneous social media JSON responses, and persist normalized records into SQLite (`facebook_posts.db`).
