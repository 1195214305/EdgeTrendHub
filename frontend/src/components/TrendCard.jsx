import { useState } from 'react'
import { Flame, ExternalLink, Sparkles, Bookmark, BookmarkCheck, Share2, X } from 'lucide-react'
import { useStore, PLATFORMS } from '../store'
import { generateSummary } from '../utils/api'

export function TrendCard({ item, rank }) {
  const { userId, hasApiKey, qwenApiKey, addFavorite, removeFavorite, isFavorite, summaryCache, setSummaryCache, blockedKeywords } = useStore()
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [error, setError] = useState(null)

  const platform = PLATFORMS[item.source] || { name: item.source, color: '#666' }
  const saved = isFavorite(item.id)

  // 检查是否被屏蔽
  const isBlocked = blockedKeywords.some(keyword =>
    item.title.toLowerCase().includes(keyword.toLowerCase())
  )

  if (isBlocked) return null

  // 格式化热度
  const formatHot = (hot) => {
    if (!hot) return ''
    if (hot >= 100000000) return `${(hot / 100000000).toFixed(1)}亿`
    if (hot >= 10000) return `${(hot / 10000).toFixed(1)}万`
    return hot.toString()
  }

  // 生成AI摘要
  const handleSummary = async () => {
    if (!hasApiKey) {
      setError('请先在设置中配置千问API Key')
      return
    }

    if (summaryCache[item.id]) {
      setShowSummary(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await generateSummary(userId, item.title, item.desc || '', qwenApiKey)
      setSummaryCache(item.id, result.summary)
      setShowSummary(true)
    } catch (err) {
      setError('摘要生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 收藏/取消收藏
  const handleFavorite = () => {
    if (saved) {
      removeFavorite(item.id)
    } else {
      addFavorite(item)
    }
  }

  // 分享
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} - 来自${platform.name}热榜`,
          url: item.url
        })
      } catch (err) {
        // 用户取消分享
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(item.url)
      alert('链接已复制')
    }
  }

  return (
    <div className="bg-dark-card border border-dark-border hover:border-primary/30 transition-all card-hover">
      {/* 主内容区 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 排名 */}
          {rank && (
            <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
              rank <= 3 ? 'bg-primary text-white' : 'bg-dark-hover text-gray-400'
            }`}>
              {rank}
            </div>
          )}

          {/* 封面图 */}
          {item.cover && (
            <img
              src={item.cover}
              alt=""
              className="w-16 h-16 object-cover flex-shrink-0 rounded"
              loading="lazy"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}

          {/* 标题和信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
              >
                {platform.name}
              </span>
              {item.hot && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Flame className="w-3 h-3 flame-icon" />
                  {formatHot(item.hot)}
                </span>
              )}
              {item.tag && (
                <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                  {item.tag}
                </span>
              )}
            </div>

            <h3 className="text-white text-sm leading-relaxed line-clamp-2 hover:text-primary transition-colors">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </h3>

            {item.desc && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-1">{item.desc}</p>
            )}
          </div>
        </div>

        {/* AI摘要展示 */}
        {showSummary && summaryCache[item.id] && (
          <div className="mt-3 p-3 bg-dark rounded-lg border border-accent/20 relative">
            <button
              onClick={() => setShowSummary(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 text-accent text-xs mb-2">
              <Sparkles className="w-3 h-3" />
              AI 摘要
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {summaryCache[item.id]}
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-2 text-xs text-red-400">{error}</div>
        )}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-dark-border">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSummary}
            disabled={loading}
            className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 disabled:opacity-50 touch-feedback"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '生成中...' : 'AI摘要'}
          </button>

          <button
            onClick={handleFavorite}
            className={`text-xs flex items-center gap-1 touch-feedback ${
              saved ? 'text-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {saved ? '已收藏' : '收藏'}
          </button>

          <button
            onClick={handleShare}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 touch-feedback"
          >
            <Share2 className="w-3.5 h-3.5" />
            分享
          </button>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 touch-feedback"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          原文
        </a>
      </div>
    </div>
  )
}

// 骨架屏
export function TrendCardSkeleton() {
  return (
    <div className="bg-dark-card border border-dark-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded skeleton" />
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            <div className="w-12 h-5 rounded skeleton" />
            <div className="w-16 h-5 rounded skeleton" />
          </div>
          <div className="h-4 rounded skeleton mb-2" />
          <div className="h-4 w-3/4 rounded skeleton" />
        </div>
      </div>
    </div>
  )
}
