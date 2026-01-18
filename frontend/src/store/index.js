import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 支持的热榜平台配置
export const PLATFORMS = {
  weibo: { name: '微博', color: '#ff4d4f', icon: 'weibo' },
  zhihu: { name: '知乎', color: '#0084ff', icon: 'zhihu' },
  bilibili: { name: 'B站', color: '#fb7299', icon: 'bilibili' },
  douyin: { name: '抖音', color: '#00f2ea', icon: 'douyin' },
  baidu: { name: '百度', color: '#306cff', icon: 'baidu' },
  toutiao: { name: '头条', color: '#ff0000', icon: 'toutiao' },
  douban: { name: '豆瓣', color: '#00b51d', icon: 'douban' },
  juejin: { name: '掘金', color: '#1e80ff', icon: 'juejin' },
  github: { name: 'GitHub', color: '#ffffff', icon: 'github' },
  v2ex: { name: 'V2EX', color: '#778087', icon: 'v2ex' }
}

// 全局状态管理
export const useStore = create(
  persist(
    (set, get) => ({
      // 用户ID（用于存储设置）
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      // 当前选中的频道
      activeChannel: 'all',
      setActiveChannel: (channel) => set({ activeChannel: channel }),

      // 订阅的频道列表
      subscribedChannels: ['weibo', 'zhihu', 'bilibili', 'baidu', 'toutiao'],
      toggleChannel: (channel) => set((state) => {
        const channels = state.subscribedChannels
        if (channels.includes(channel)) {
          return { subscribedChannels: channels.filter(c => c !== channel) }
        }
        return { subscribedChannels: [...channels, channel] }
      }),

      // 热榜数据
      trends: [],
      setTrends: (trends) => set({ trends }),

      // 加载状态
      loading: false,
      setLoading: (loading) => set({ loading }),

      // 错误信息
      error: null,
      setError: (error) => set({ error }),

      // 收藏列表
      favorites: [],
      addFavorite: (item) => set((state) => ({
        favorites: [{ ...item, savedAt: Date.now() }, ...state.favorites]
      })),
      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter(f => f.id !== id)
      })),
      isFavorite: (id) => get().favorites.some(f => f.id === id),

      // 屏蔽关键词
      blockedKeywords: [],
      addBlockedKeyword: (keyword) => set((state) => ({
        blockedKeywords: [...new Set([...state.blockedKeywords, keyword.trim()])]
      })),
      removeBlockedKeyword: (keyword) => set((state) => ({
        blockedKeywords: state.blockedKeywords.filter(k => k !== keyword)
      })),

      // 千问API Key（本地存储）
      qwenApiKey: '',
      setQwenApiKey: (key) => set({ qwenApiKey: key, hasApiKey: !!key }),
      hasApiKey: false,
      setHasApiKey: (has) => set({ hasApiKey: has }),

      // 主题设置
      theme: 'dark',
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
      })),

      // 字号设置
      fontSize: 'normal', // small, normal, large
      setFontSize: (size) => set({ fontSize: size }),

      // 搜索历史
      searchHistory: [],
      addSearchHistory: (query) => set((state) => ({
        searchHistory: [query, ...state.searchHistory.filter(q => q !== query)].slice(0, 10)
      })),
      clearSearchHistory: () => set({ searchHistory: [] }),

      // AI摘要缓存
      summaryCache: {},
      setSummaryCache: (id, summary) => set((state) => ({
        summaryCache: { ...state.summaryCache, [id]: summary }
      })),

      // 刷新时间
      lastRefresh: null,
      setLastRefresh: (time) => set({ lastRefresh: time })
    }),
    {
      name: 'edge-trend-hub-storage',
      partialize: (state) => ({
        userId: state.userId,
        subscribedChannels: state.subscribedChannels,
        favorites: state.favorites,
        blockedKeywords: state.blockedKeywords,
        qwenApiKey: state.qwenApiKey,
        hasApiKey: state.hasApiKey,
        theme: state.theme,
        fontSize: state.fontSize,
        searchHistory: state.searchHistory
      })
    }
  )
)
