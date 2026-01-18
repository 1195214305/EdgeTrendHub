import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header, BottomNav } from './components/Header'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { Favorites } from './pages/Favorites'
import { Settings } from './pages/Settings'
import { useStore } from './store'
import { useEffect } from 'react'

function App() {
  const { fontSize, theme } = useStore()

  // 应用字号设置
  useEffect(() => {
    const root = document.documentElement
    const sizes = {
      small: '14px',
      normal: '16px',
      large: '18px'
    }
    root.style.fontSize = sizes[fontSize] || '16px'
  }, [fontSize])

  // 应用主题设置
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark text-white">
        <Header />
        <main className="pt-14">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
