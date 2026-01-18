import { useEffect, useCallback, useState } from 'react'
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useStore } from '../store'
import { fetchTrends } from '../utils/api'
import { ChannelTabs } from '../components/ChannelTabs'
import { TrendCard, TrendCardSkeleton } from '../components/TrendCard'

export function Home() {
  const {
    trends,
    setTrends,
    loading,
    setLoading,
    error,
    setError,
    activeChannel,
    subscribedChannels,
    setLastRefresh
  } = useStore()

  const [refreshing, setRefreshing] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 加载热榜数据
  const loadTrends = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const data = await fetchTrends(subscribedChannels)
      setTrends(data.items || [])
      setLastRefresh(Date.now())
    } catch (err) {
      setError(err.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [subscribedChannels, setTrends, setLoading, setError, setLastRefresh])

  // 初始加载
  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTrends(false)
  }

  // 过滤当前频道的数据
  const filteredTrends = activeChannel === 'all'
    ? trends
    : trends.filter(item => item.source === activeChannel)

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-8">
      {/* 频道切换 */}
      <ChannelTabs />

      {/* 网络状态提示 */}
      {!online && (
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">网络已断开，显示缓存数据</span>
          </div>
        </div>
      )}

      {/* 刷新按钮 */}
      <div className="max-w-2xl mx-auto px-4 py-3 flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 touch-feedback"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 内容区 */}
      <main className="max-w-2xl mx-auto px-4">
        {/* 加载状态 */}
        {loading && !refreshing && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <TrendCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => loadTrends()}
              className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && filteredTrends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Wifi className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400">暂无热榜数据</p>
            <p className="text-gray-500 text-sm mt-2">请检查网络连接或稍后重试</p>
          </div>
        )}

        {/* 热榜列表 */}
        {!loading && !error && filteredTrends.length > 0 && (
          <div className="space-y-3">
            {filteredTrends.map((item, index) => (
              <TrendCard
                key={item.id}
                item={item}
                rank={activeChannel !== 'all' ? index + 1 : null}
              />
            ))}
          </div>
        )}

        {/* 底部提示 */}
        {!loading && filteredTrends.length > 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            共 {filteredTrends.length} 条热榜 · 数据来源于各平台公开API
          </div>
        )}
      </main>
    </div>
  )
}
