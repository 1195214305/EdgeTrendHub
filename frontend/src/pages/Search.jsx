import { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import { searchTrends } from '../utils/api'
import { TrendCard, TrendCardSkeleton } from '../components/TrendCard'

export function Search() {
  const { searchHistory, addSearchHistory, clearSearchHistory, subscribedChannels } = useStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 执行搜索
  const handleSearch = async (searchQuery = query) => {
    const q = searchQuery.trim()
    if (!q) return

    setLoading(true)
    setSearched(true)
    addSearchHistory(q)

    try {
      const data = await searchTrends(q, { channels: subscribedChannels })
      setResults(data.items || [])
    } catch (err) {
      console.error('搜索失败:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // 回车搜索
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 点击历史记录
  const handleHistoryClick = (q) => {
    setQuery(q)
    handleSearch(q)
  }

  // 清空输入
  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-8">
      {/* 搜索框 */}
      <div className="sticky top-14 z-40 bg-dark/95 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索热榜内容..."
              className="w-full bg-dark-card border border-dark-border rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 搜索历史 */}
        {!searched && searchHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">搜索历史</span>
              </div>
              <button
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-white"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(q)}
                  className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-full text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors touch-feedback"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 热门搜索提示 */}
        {!searched && searchHistory.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">输入关键词搜索热榜内容</p>
            <p className="text-gray-500 text-sm mt-2">支持标题、描述等内容搜索</p>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <TrendCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* 搜索结果 */}
        {!loading && searched && (
          <>
            {results.length > 0 ? (
              <>
                <div className="text-sm text-gray-400 mb-4">
                  找到 {results.length} 条相关结果
                </div>
                <div className="space-y-3">
                  {results.map((item) => (
                    <TrendCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">未找到相关结果</p>
                <p className="text-gray-500 text-sm mt-2">换个关键词试试</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
