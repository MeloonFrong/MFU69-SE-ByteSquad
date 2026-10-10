import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "./components/Navbar";
import { FeedTabs } from "./components/FeedTabs";
import { FilterSidebar } from "./components/FilterSidebar";
import { PostCard } from "./components/PostCard";
import { AddSourceModal } from "./components/AddSourceModal";
import { ManageSourcesModal } from "./components/ManageSourcesModal";
import { ManageTagsModal } from "./components/ManageTagsModal";
import { AboutModal } from "./components/AboutModal";
import {
  Source,
  Post,
  Tag,
  Language,
  ViewTab,
  SortOption,
  Theme,
} from "./types";
import { INITIAL_SOURCES, INITIAL_POSTS, INITIAL_TAGS } from "./data/mockData";
import { TRANSLATIONS } from "./data/translations";
import { api } from "./api";
import {
  SlidersHorizontal,
  RefreshCw,
  SearchX,
  PlusCircle,
} from "lucide-react";

const STORAGE_KEYS = {
  THEME: "infocenter_theme_v2",
  LANG: "infocenter_lang_v2",
  SOURCES: "infocenter_sources_v1",
};

export const App: React.FC = () => {
  // Theme state: DEFAULT IS DARK (🌙)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme;
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  // Apply theme attribute to root HTML document element and body for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    api.savePreference("theme", theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // State initialized with defaults, then updated from Python backend
  const [sources, setSources] = useState<Source[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
      return saved ? (JSON.parse(saved) as Source[]) : INITIAL_SOURCES;
    } catch {
      return INITIAL_SOURCES;
    }
  });
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem("infocenter_posts_v1");
      return saved ? (JSON.parse(saved) as Post[]) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [pythonBackendOnline, setPythonBackendOnline] =
    useState<boolean>(false);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
  }, [sources]);
  useEffect(() => {
    localStorage.setItem("infocenter_posts_v1", JSON.stringify(posts));
  }, [posts]);

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG) as Language;
      return saved === "th" ? "th" : "en";
    } catch {
      return "en";
    }
  });

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<ViewTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [mustIncludeKeywords, setMustIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);

  // Left Filter & Subscriptions popup drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals state
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Fetch from Python backend on mount
  useEffect(() => {
    async function loadBackendData() {
      const health = await api.getHealth();
      if (health && health.backend === "python") {
        setPythonBackendOnline(true);
        const [backendSources, backendPosts, backendTags] = await Promise.all([
          api.getSources(),
          api.getPosts(),
          api.getTags(),
        ]);
        if (backendSources.length > 0) setSources(backendSources);
        if (backendPosts.length > 0) setPosts(backendPosts);
        if (backendTags.length > 0) setTags(backendTags);
      }
    }
    loadBackendData();
  }, []);

  const t = TRANSLATIONS[language];

  // Actions wired to Python backend
  const handleToggleSource = async (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s)),
    );
    await api.toggleSource(sourceId);
  };

  const handleDeleteSource = async (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    setPosts((prev) => prev.filter((p) => p.sourceId !== sourceId));
    await api.deleteSource(sourceId);
  };

  const handleUpdateSourceTags = async (
    sourceId: string,
    updatedTags: string[],
  ) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, tags: updatedTags } : s)),
    );
    await api.updateSourceTags(sourceId, updatedTags);
  };

  const handleAddSource = async (
    newSource: Source,
    generateSamplePosts: boolean,
  ) => {
    setSources((prev) => [newSource, ...prev]);

    if (generateSamplePosts) {
      const newPost1: Post = {
        id: `post-${Date.now()}-1`,
        sourceId: newSource.id,
        sourceName: newSource.name,
        sourceHandle: newSource.handle,
        platform: newSource.platform,
        title: `📢 New update from ${newSource.name}`,
        titleTh: `📢 ข่าวประชาสัมพันธ์ล่าสุดจาก ${newSource.name}`,
        content: `Subscribed successfully to ${newSource.url}. All upcoming announcements and updates from this channel will now be synchronized directly to your InfoCenter feed.`,
        contentTh: `ติดตามแหล่งข่าวเรียบร้อยแล้ว ทุกการประกาศและข่าวสารจากช่องทางนี้จะถูกนำมารวมไว้ที่หน้าฟีดของ InfoCenter โดยอัตโนมัติ`,
        url: newSource.url,
        publishedAt: new Date().toISOString(),
        tags: newSource.tags,
        isPinned: false,
        isImportant: true,
        isRead: false,
        isBookmarked: false,
        engagement: {
          likes: Math.floor(Math.random() * 80 + 20),
          shares: Math.floor(Math.random() * 20 + 5),
        },
      };
      setPosts((prev) => [newPost1, ...prev]);
    }

    await api.addSource(newSource);
  };

  const handleAddTag = async (newTag: Tag) => {
    setTags((prev) => {
      if (
        prev.some((t) => t.name.toLowerCase() === newTag.name.toLowerCase())
      ) {
        return prev;
      }
      return [...prev, newTag];
    });
    await api.addTag(newTag);
  };

  const handleDeleteTag = async (tagId: string) => {
    const tagToDelete = tags.find((t) => t.id === tagId);
    if (!tagToDelete) return;
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setSelectedTags((prev) => prev.filter((name) => name !== tagToDelete.name));
    await api.deleteTag(tagId);
  };

  const handleToggleBookmark = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p,
      ),
    );
    await api.toggleBookmark(postId);
  };

  const handleToggleRead = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isRead: !p.isRead } : p)),
    );
    await api.toggleRead(postId);
  };

  const handleToggleTagFilter = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  const handleResetData = async () => {
    await api.resetBackend();
    setSources(INITIAL_SOURCES);
    setPosts(INITIAL_POSTS);
    setTags(INITIAL_TAGS);
    setSelectedTags([]);
    setSelectedPlatform("all");
    setMustIncludeKeywords([]);
    setExcludeKeywords([]);
    setSearchQuery("");
    setCurrentTab("all");
  };

  const handleResetAllFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setSelectedPlatform("all");
    setMustIncludeKeywords([]);
    setExcludeKeywords([]);
    setCurrentTab("all");
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedTags.length > 0 ||
    selectedPlatform !== "all" ||
    mustIncludeKeywords.length > 0 ||
    excludeKeywords.length > 0 ||
    currentTab !== "all",
  );

  // Enabled sources map
  const enabledSourceIds = useMemo(() => {
    return new Set(sources.filter((s) => s.enabled).map((s) => s.id));
  }, [sources]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const activePosts = posts.filter((p) => enabledSourceIds.has(p.sourceId));
    return {
      all: activePosts.length,
      important: activePosts.filter((p) => p.isImportant || p.isPinned).length,
      unread: activePosts.filter((p) => !p.isRead).length,
      bookmarked: activePosts.filter((p) => p.isBookmarked).length,
    };
  }, [posts, enabledSourceIds]);

  // Filtering & Sorting Pipeline
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (!enabledSourceIds.has(post.sourceId)) return false;

        if (currentTab === "important" && !post.isImportant && !post.isPinned)
          return false;
        if (currentTab === "unread" && post.isRead) return false;
        if (currentTab === "bookmarked" && !post.isBookmarked) return false;

        if (selectedPlatform !== "all" && post.platform !== selectedPlatform) {
          return false;
        }

        if (selectedTags.length > 0) {
          const matchesAnyTag = post.tags.some((t) => selectedTags.includes(t));
          if (!matchesAnyTag) return false;
        }

        const fullText =
          `${post.title} ${post.titleTh || ""} ${post.content} ${post.contentTh || ""} ${post.sourceName} ${post.sourceHandle} ${post.tags.join(" ")}`.toLowerCase();

        if (searchQuery.trim()) {
          const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
          const matchesQuery = queryWords.every((word) =>
            fullText.includes(word),
          );
          if (!matchesQuery) return false;
        }

        if (mustIncludeKeywords.length > 0) {
          const matchesMustInclude = mustIncludeKeywords.every((kw) =>
            fullText.includes(kw.toLowerCase().trim()),
          );
          if (!matchesMustInclude) return false;
        }

        if (excludeKeywords.length > 0) {
          const hasExcluded = excludeKeywords.some((kw) =>
            fullText.includes(kw.toLowerCase().trim()),
          );
          if (hasExcluded) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
          );
        }
        if (sortBy === "important") {
          const scoreA = (a.isPinned ? 4 : 0) + (a.isImportant ? 2 : 0);
          const scoreB = (b.isPinned ? 4 : 0) + (b.isImportant ? 2 : 0);
          if (scoreB !== scoreA) return scoreB - scoreA;
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        }
        return 0;
      });
  }, [
    posts,
    enabledSourceIds,
    currentTab,
    selectedPlatform,
    selectedTags,
    searchQuery,
    mustIncludeKeywords,
    excludeKeywords,
    sortBy,
  ]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Navbar */}
      <Navbar
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddSource={() => setIsAddSourceOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        activeSourceCount={enabledSourceIds.size}
        totalSourceCount={sources.length}
        postCount={posts.length}
        bookmarkedCount={tabCounts.bookmarked}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Floating Fixed Left Button: Filters & Subscriptions (Locked to screen on scroll) */}
      <button
        type="button"
        onClick={() => setIsFilterDrawerOpen(true)}
        className="fixed left-3 sm:left-5 top-24 z-30 css-btn-secondary !py-2.5 !px-3 sm:!px-4 !text-xs sm:!text-sm font-bold flex items-center gap-2.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group"
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: hasActiveFilters
            ? "var(--accent-color)"
            : "var(--border-default)",
          boxShadow:
            "0 12px 32px -4px rgba(0, 0, 0, 0.45), 0 4px 12px -2px rgba(0, 0, 0, 0.3)",
        }}
        title="Open Filters & Subscriptions"
        aria-label="Filters and Subscriptions"
      >
        <div className="relative flex items-center">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-950 animate-pulse"></span>
          )}
        </div>
        <span className="font-bold hidden sm:inline">
          {language === "th"
            ? "ตัวกรอง & แหล่งข่าว"
            : "Filters & Subscriptions"}
        </span>
        <span className="font-bold sm:hidden">
          {language === "th" ? "ตัวกรอง" : "Filters"}
        </span>
        {hasActiveFilters && (
          <span className="px-1.5 py-0.2 rounded-full text-2xs font-mono font-bold bg-indigo-500/20 text-indigo-400">
            Active
          </span>
        )}
      </button>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Feed Content (Clean, Focused, Full Width) */}
        <div className="space-y-5">
          {/* Feed Tabs & Sort Controls */}
          <FeedTabs
            language={language}
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            sortBy={sortBy}
            onSortChange={setSortBy}
            counts={tabCounts}
          />

          {/* Posts Stream */}
          {filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  language={language}
                  onToggleBookmark={handleToggleBookmark}
                  onToggleRead={handleToggleRead}
                  onTagClick={handleToggleTagFilter}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="css-card p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <SearchX className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3
                  className="text-base sm:text-lg font-bold"
                  style={{ color: "var(--text-heading)" }}
                >
                  {t.noPostsFound}
                </h3>
                <p
                  className="text-xs sm:text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t.noPostsSuggestion}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetAllFilters}
                  className="css-btn-secondary"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.emptyFeedAction}</span>
                </button>
                <button
                  onClick={() => setIsAddSourceOpen(true)}
                  className="css-btn-primary"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t.addSourceBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* POPUP LEFT DRAWER: Filters, Tags, Keywords, Platforms (IG/FB/TikTok), and Subscriptions */}
      <FilterSidebar
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        language={language}
        sources={sources}
        tags={tags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTagFilter}
        onClearTags={() => setSelectedTags([])}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        mustIncludeKeywords={mustIncludeKeywords}
        onAddMustInclude={(kw) => {
          if (!mustIncludeKeywords.includes(kw)) {
            setMustIncludeKeywords([...mustIncludeKeywords, kw]);
          }
        }}
        onRemoveMustInclude={(kw) => {
          setMustIncludeKeywords(mustIncludeKeywords.filter((k) => k !== kw));
        }}
        excludeKeywords={excludeKeywords}
        onAddExclude={(kw) => {
          if (!excludeKeywords.includes(kw)) {
            setExcludeKeywords([...excludeKeywords, kw]);
          }
        }}
        onRemoveExclude={(kw) => {
          setExcludeKeywords(excludeKeywords.filter((k) => k !== kw));
        }}
        onToggleSource={handleToggleSource}
        onOpenManageSources={() => setIsManageSourcesOpen(true)}
        onOpenManageTags={() => setIsManageTagsOpen(true)}
        onResetAllFilters={handleResetAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Modals */}
      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        language={language}
        tags={tags}
        onAddSource={handleAddSource}
        onAddNewTag={handleAddTag}
        existingSourceUrls={sources.map((s) => s.url)}
      />

      <ManageSourcesModal
        isOpen={isManageSourcesOpen}
        onClose={() => setIsManageSourcesOpen(false)}
        language={language}
        sources={sources}
        tags={tags}
        onToggleSource={handleToggleSource}
        onDeleteSource={handleDeleteSource}
        onUpdateSourceTags={handleUpdateSourceTags}
      />

      <ManageTagsModal
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
        language={language}
        tags={tags}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        language={language}
        onResetData={handleResetData}
      />

      {/* Footer */}
      <footer
        className="mt-auto border-t py-6 text-xs"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              InfoCenter — Full-Stack Python Backend & CSS Theming
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              Designed by ByteSquad (Group 17) • Mae Fah Luang University (MFU)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              System Specs & Team
            </button>
            <button
              onClick={handleResetData}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Reset Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
