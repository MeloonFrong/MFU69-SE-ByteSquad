import { useState } from 'react';
import { Search, Filter, RefreshCw, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { FacebookPost } from '../types/facebook';
import { FacebookApiClient } from '../services/api';
import { PostCard } from './PostCard';

interface FeedViewProps {
  posts: FacebookPost[];
  totalScanned: number;
  isLoading: boolean;
  selectedPage: string;
  onPageChange: (page: string) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  onOpenScraper: () => void;
  onImageClick: (url: string) => void;
  isSimulated: boolean;
  errorNotice?: string;
}

export function FeedView({
  posts,
  totalScanned,
  isLoading,
  selectedPage,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  onOpenScraper,
  onImageClick,
  isSimulated,
  errorNotice,
}: FeedViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const caption = (post.caption || post.text || post.message || '').toLowerCase();
    const author = (post.user?.name || post.pageName || '').toLowerCase();
    return caption.includes(query) || author.includes(query);
  });

  const duplicatesFiltered = Math.max(0, totalScanned - posts.length);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Notice Banner when in Simulator Mode */}
      {isSimulated && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed flex-1">
            <p className="font-semibold text-amber-950">
              {errorNotice || 'กำลังทำงานในโหมด C# Backend Simulator'}
            </p>
            <p className="mt-0.5 text-amber-800">
              ข้อมูลโพสต์และผลลัพธ์การ Scrape ถูกจำลองตามอัลกอริทึมของ C# Backend
              (รวมถึงการเรียงเวลาและตัดโพสต์ซ้ำ) หากคุณเปิดรัน C# Backend
              ที่พอร์ต 5030 แล้ว สามารถกดทดสอบการเชื่อมต่อได้ที่มุมขวาบน
            </p>
          </div>
        </div>
      )}

      {/* Control Bar: Page Tabs & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Page Tabs - Interactive segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              onClick={() => onPageChange('MFU2Connect')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedPage === 'MFU2Connect'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เพจ MFU2Connect
            </button>
            <button
              onClick={() => onPageChange('profile.php?id=61563364138740')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedPage.includes('61563364138740')
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เพจ อบ.กน. มฟล. (ID: 61563364138740)
            </button>
            <button
              onClick={() => onPageChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedPage === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทุกโปรไฟล์
            </button>
          </div>

          {/* Quick Action Button: Trigger Scraper */}
          <button
            onClick={onOpenScraper}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>สั่ง Scrape เพิ่มด้วย Apify</span>
          </button>
        </div>

        {/* Filter Bar: Search & Limit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาข้อความในแคปชั่น หรือชื่อผู้โพสต์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>แสดง:</span>
            </div>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="จำนวนโพสต์สูงสุดที่แสดง"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value={5}>5 โพสต์ล่าสุด</option>
              <option value={10}>10 โพสต์ล่าสุด</option>
              <option value={20}>20 โพสต์ล่าสุด</option>
              <option value={50}>50 โพสต์ล่าสุด</option>
            </select>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="ดึงข้อมูลใหม่"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Deduplication & Feed Metrics Strip (Anti-slop unboxed metadata) */}
      <div className="bg-slate-100/80 border border-slate-200/80 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            แสดงผล <strong className="font-semibold text-slate-900 tabular-nums">{filteredPosts.length}</strong> โพสต์ที่ไม่ซ้ำ
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>
            สแกนจากระบบ <span className="tabular-nums font-mono">{totalScanned}</span> โพสต์
          </span>
          {duplicatesFiltered > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500">
                ตัดโพสต์ซ้ำแล้ว <span className="tabular-nums font-mono font-medium text-emerald-700">{duplicatesFiltered}</span> โพสต์
              </span>
            </>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Endpoint: GET /api/posts/recent
        </div>
      </div>

      {/* Feed Content Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-200 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-4 bg-slate-200 rounded-sm" />
                  <div className="w-24 h-3 bg-slate-200 rounded-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3.5 bg-slate-200 rounded-sm" />
                <div className="w-4/5 h-3.5 bg-slate-200 rounded-sm" />
                <div className="w-2/3 h-3.5 bg-slate-200 rounded-sm" />
              </div>
              <div className="w-full h-56 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="space-y-5">
          {filteredPosts.map((post) => (
            <PostCard
              key={FacebookApiClient.getPostKey(post)}
              post={post}
              onImageClick={onImageClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">ไม่พบโพสต์ที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `ไม่พบโพสต์ที่มีคำว่า "${searchQuery}" ลองค้นหาด้วยคำอื่น หรือกดล้างการค้นหา`
              : 'ยังไม่มีโพสต์ในหน้านี้ สามารถกดปุ่มสั่ง Scrape ด้านล่างเพื่อดึงโพสต์ล่าสุดจาก Apify'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ล้างการค้นหา
              </button>
            )}
            <button
              onClick={onOpenScraper}
              className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              สั่ง Scrape โพสต์ใหม่
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
