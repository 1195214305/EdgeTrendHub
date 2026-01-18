import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flame, Search, Bookmark, Settings, Menu, X } from 'lucide-react'
import { useStore } from '../store'

export function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { lastRefresh } = useStore()

  const navItems = [
    { path: '/', icon: Flame, label: '热榜' },
    { path: '/search', icon: Search, label: '搜索' },
    { path: '/favorites', icon: Bookmark, label: '收藏' },
    { path: '/settings', icon: Settings, label: '设置' }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-sm border-b border-dark-border safe-area-top">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-select">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">EdgeTrendHub</span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                location.pathname === path
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {menuOpen && (
        <div className="md:hidden bg-dark-card border-b border-dark-border">
          <nav className="max-w-2xl mx-auto px-4 py-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* 最后刷新时间 */}
      {lastRefresh && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
          <div className="text-xs text-gray-500 bg-dark-card px-2 py-0.5 rounded-b-md">
            {new Date(lastRefresh).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 更新
          </div>
        </div>
      )}
    </header>
  )
}

// 底部导航栏（移动端）
export function BottomNav() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Flame, label: '热榜' },
    { path: '/search', icon: Search, label: '搜索' },
    { path: '/favorites', icon: Bookmark, label: '收藏' },
    { path: '/settings', icon: Settings, label: '设置' }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-card/95 backdrop-blur-sm border-t border-dark-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center flex-1 h-full no-select touch-feedback ${
              location.pathname === path ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
