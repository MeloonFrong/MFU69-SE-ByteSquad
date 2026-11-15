# InfoCenter — QA & System Test Report (M3)

**Group 17: ByteSquad**  
**Course:** Introduction to Software Engineering (15031001)  

---

## 1. Functional Test Cases (Must FR-1 to FR-4)

All test cases below were executed against both the **Standalone Clickable Prototype (`prototype/index.html`)** and the **Full-Stack Application (`Frontend/src` + C# `.NET 8` Backend on Port `5030`)**.

| Test ID | Related FR | Test Scenario | Test Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **FR-1** | Add Facebook, Instagram, and TikTok sources via URL / Handle | 1. Click `+ Add Subscription` (`ScraperModal.tsx`).<br/>2. Enter `https://www.facebook.com/MFU2Connect`, `@humansofny`, and `https://www.tiktok.com/@khaby.lame` (or click Quick-Add preset pills).<br/>3. Click `Add to Feed`. | System parses each URL/handle into a normalized `SubscriptionItem`, adds it to `Followed Accounts`, and loads posts for those accounts. | All 3 platforms parsed accurately and added to `Followed Accounts` with posts rendered. | **PASS** |
| **TC-02** | **FR-1** | Configure per-account post limit (`RefreshConfigModal`) | 1. Click `Edit Refresh Config` in the Left Sidebar.<br/>2. Change `MFU2Connect` post limit from `2` to `1`.<br/>3. Click `Save & Refresh Feed`. | Feed strictly enforces the updated per-account post limit (`1` post from `MFU2Connect`). | Feed immediately updates to display at most `1` post for `MFU2Connect`. | **PASS** |
| **TC-03** | **FR-1** | Remove / Unsubscribe an account | 1. Open `Edit Refresh Config`.<br/>2. Click the Trash icon next to an account.<br/>3. Click `Save & Refresh Feed`. | Account is removed from `Followed Accounts` and all posts belonging to that source disappear from the feed. | Source and its posts are immediately removed from the feed. | **PASS** |
| **TC-04** | **FR-2** | View Unified Chronological Feed across FB, IG, and TikTok | 1. Subscribe to sources from Facebook, Instagram, and TikTok.<br/>2. Inspect `PostCard` items in `FeedView.tsx`. | Posts from all 3 platforms render in a single unified stream with platform badge, author avatar/name, timestamp, text caption, and engagement counts (`Likes`, `Comments`, `Shares`). | All 3 platform schemas normalized via `normalizeSocialPost()` and rendered consistently. | **PASS** |
| **TC-05** | **FR-2** | Expand long captions & preview media in Lightbox | 1. Click `Read more` on a post with a caption > 280 chars.<br/>2. Click on a post thumbnail image. | `Read more` expands full caption text (`Show less` collapses it); clicking an image opens `MediaGalleryModal.tsx`. | Full caption toggles cleanly and lightbox modal previews full-resolution media. | **PASS** |
| **TC-06** | **FR-2** | Navigate to Original Post on Native Platform | 1. Locate any post card in the feed.<br/>2. Click `View Original / ดูโพสต์ต้นฉบับ`. | Opens the original Facebook, Instagram, or TikTok post URL in a new browser tab (`target="_blank"`). | Original post URL opens in a new tab with `rel="noopener noreferrer"`. | **PASS** |
| **TC-07** | **FR-3** | Create and attach multiple custom tags to subscriptions | 1. Open `+ Add Subscription` or `Edit Refresh Config`.<br/>2. Type a new custom tag (e.g., `Urgent` or `Scholarship`) and press `Enter` / `Add`, plus toggle `#MFU` and `#Academic`.<br/>3. Save changes. | Multiple custom tags attach to the subscription and appear as `#Tag` badges both under the account in the Left Sidebar and on each `PostCard`. | Multi-tags saved on `SubscriptionItem.tags[]` and displayed in Sidebar and `PostCard`. | **PASS** |
| **TC-08** | **FR-3** | Filter feed by Custom Tag in Left Sidebar | 1. In Left Sidebar under `Filter by Tag (FR-3)`, click `#MFU`.<br/>2. Observe feed results.<br/>3. Click `All Tags` to reset. | Only posts from subscribed sources tagged with `#MFU` are shown; active tag filter pill appears in the top bar; `All Tags` restores all posts. | Feed filters strictly to `#MFU` sources and shows active filter indicator. | **PASS** |
| **TC-09** | **FR-4** | Filter posts using Include Keywords (`Must Contain`) | 1. In the top filter bar (`FeedView.tsx`), enter `scholarship, contest` in the `Include Keywords` field. | Feed displays only posts whose caption or author contains at least one of the included keywords. | Non-matching posts are hidden immediately in real time. | **PASS** |
| **TC-10** | **FR-4** | Filter posts using Exclude Keywords (`Hide Word`) | 1. In the top filter bar, enter `giveaway, sponsored` (or any term present in a post) in the `Exclude Keywords` field. | Any post containing an excluded keyword is immediately hidden from the feed. | Posts matching excluded keywords are filtered out immediately. | **PASS** |
| **TC-11** | **FR-4** | Sort feed by `Latest posts` vs `Most liked` | 1. Use the Sort dropdown in the top filter bar.<br/>2. Switch between `Latest posts (Newest)` and `Most liked (Engagement)`. | `Latest posts` sorts descending by post timestamp; `Most liked` sorts descending by `likes` count. | Posts reorder immediately by timestamp or like count. | **PASS** |

---

## 2. Non-Functional Requirement (NFR) Verification

| NFR ID | Category | Requirement Statement | Verification Method & Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-1** | Performance | Full application load in `< 8 seconds` on standard network / local machine. | Measured via Playwright headless Chromium & DevTools: `prototype/index.html` and Vite production build load in **< 0.9 seconds**. | **PASS** |
| **NFR-2** | Performance | Loading 10+ normalized posts completes in `< 10 seconds`. | Rendering 15+ multi-platform posts with images and metrics completes in **< 0.4 seconds** client-side. | **PASS** |
| **NFR-3** | Usability & Localization | First-time user can add a source within `1 minute`; full Thai (`TH`) and English (`EN`) UI support + Light/Dark mode. | Onboarding empty state provides a prominent CTA (`+ Add Subscription`) and 1-click preset pills; TH/EN toggle and Light/Dark mode verified across 100% of screens. | **PASS** |
| **NFR-4** | Reliability & Offline Resilience | Graceful fallback when live scraper API or backend is offline. | `FacebookApiClient` automatically falls back to normalized sample datasets (`DEMO_MOCK_POSTS`) when Port `5030` is unreachable or when running from `prototype/index.html`. | **PASS** |
| **NFR-5** | Privacy & Security | Only store subscribed URLs, user preferences (theme/language), and public post metadata. | Inspected `localStorage` and `facebook_posts.db`: zero personal credentials or private user data stored. | **PASS** |

---

## 3. Historical Bug & UX Resolution Log

1. **[Resolved] "Read more..." button responsiveness (`PostCard.tsx`):**
   - **Previous Issue:** Clicking `Read more...` on long post summaries did not expand the full caption text.
   - **Fix Implemented:** Added local `expanded` state inside `PostCard.tsx` (`shouldTruncate = postText.length > 280`) with full bilingual toggle (`อ่านเพิ่มเติม / Read more` ↔ `ย่อข้อความ / Show less`).
2. **[Resolved] Active Tag & Filter Highlighting (`FeedView.tsx`):**
   - **Previous Issue:** Users could not clearly see which tag or keyword filter was actively filtering the main feed.
   - **Fix Implemented:** Added active state styling (`bg-brand text-white`) in the Left Sidebar Tag Filter plus a live active-filter summary bar (`#Tag`, `+Include`, `-Exclude`, `Clear Filters`) directly above the post stream.
