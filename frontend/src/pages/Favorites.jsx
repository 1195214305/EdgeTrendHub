import { Bookmark, Trash2, Clock } from 'lucide-react'
import { useStore } from '../store'
import { TrendCard } from '../components/TrendCard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function Favorites() {
  const { favorites, removeFavorite } = useStore()

  // 按保存时间分组
  const groupedFavorites = favorites.reduce((groups, item) => {
    const date = dayjs(item.savedAt).format('YYYY-MM-DD')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {})

  const formatDate = (date) => {
    const d = dayjs(date)
    if (d.isSame(dayjs(), 'day')) return '今天'
    if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return '昨天'
    return d.format('M月D日')
  }

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-8">
      {/* 标题栏 */}
      <div className="sticky top-14 z-40 bg-dark/95 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-medium">我的收藏</h1>
            </div>
            <span className="text-sm text-gray-500">{favorites.length} 条</span>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 空状态 */}
        {favorites.length === 0 && (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无收藏</p>
            <p className="text-gray-500 text-sm mt-2">浏览热榜时点击收藏按钮保存感兴趣的内容</p>
          </div>
        )}

        {/* 收藏列表（按日期分组） */}
        {Object.entries(groupedFavorites).map(([date, items]) => (
          <div key={date} className="mb-6">
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatDate(date)}</span>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <TrendCard item={item} />
                  {/* 删除按钮 */}
                  <button
                    onClick={() => removeFavorite(item.id)}
                    className="absolute top-2 right-2 p-2 bg-dark-card/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                    title="删除收藏"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
