import { Source, Post, Tag } from './types';

export const api = {
  async getHealth(): Promise<{ status: string; backend: string } | null> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[Python API] Health check failed, using local sync', e);
    }
    return null;
  },

  async getSources(): Promise<Source[]> {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        return data.sources;
      }
    } catch (e) {
      console.warn('[Python API] getSources fallback', e);
    }
    return [];
  },

  async addSource(source: Source): Promise<boolean> {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      return res.ok;
    } catch (e) {
      console.warn('[Python API] addSource fallback', e);
      return false;
    }
  },

  async toggleSource(sourceId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sources/${sourceId}/toggle`, {
        method: 'PATCH',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async updateSourceTags(sourceId: string, tags: string[]): Promise<boolean> {
    try {
      const res = await fetch(`/api/sources/${sourceId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async deleteSource(sourceId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async getPosts(): Promise<Post[]> {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        return data.posts;
      }
    } catch (e) {
      console.warn('[Python API] getPosts fallback', e);
    }
    return [];
  },

  async toggleBookmark(postId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'PATCH',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async toggleRead(postId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/posts/${postId}/read`, {
        method: 'PATCH',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async getTags(): Promise<Tag[]> {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        return data.tags;
      }
    } catch (e) {
      console.warn('[Python API] getTags fallback', e);
    }
    return [];
  },

  async addTag(tag: Tag): Promise<boolean> {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async deleteTag(tagId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async savePreference(key: string, value: string): Promise<boolean> {
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async resetBackend(): Promise<boolean> {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      return res.ok;
    } catch (e) {
      return false;
    }
  },
};
