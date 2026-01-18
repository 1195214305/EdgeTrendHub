import { useState } from 'react'
import { Settings as SettingsIcon, Key, Save, Check, Plus, X, Layers, Type, Info, ExternalLink } from 'lucide-react'
import { useStore } from '../store'
import { ChannelManager } from '../components/ChannelTabs'

export function Settings() {
  const {
    hasApiKey,
    qwenApiKey,
    setQwenApiKey,
    fontSize,
    setFontSize,
    blockedKeywords,
    addBlockedKeyword,
    removeBlockedKeyword
  } = useStore()

  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  // 保存API Key（本地存储）
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return
    setQwenApiKey(apiKey.trim())
    setApiKey('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 添加屏蔽词
  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addBlockedKeyword(newKeyword.trim())
      setNewKeyword('')
    }
  }

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-8">
      {/* 标题栏 */}
      <div className="sticky top-14 z-40 bg-dark/95 backdrop-blur-sm border-b border-dark-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-medium">设置</h1>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* 千问 API Key 设置 */}
        <section className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-medium">千问 API Key</h2>
            {hasApiKey && (
              <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">已配置</span>
            )}
          </div>

          <p className="text-sm text-gray-400 mb-4">
            配置通义千问 API Key 以启用 AI 摘要功能。
            <a
              href="https://dashscope.console.aliyun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover inline-flex items-center gap-1 ml-1"
            >
              获取 API Key
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '已配置（输入新值覆盖）' : '请输入 API Key'}
              className="flex-1 bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '已保存' : '保存'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            API Key 存储在本地浏览器中，通过边缘函数安全调用千问 API
          </p>
        </section>

        {/* 频道订阅 */}
        <section className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="font-medium">频道订阅</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            选择要显示的热榜平台，点击切换订阅状态
          </p>
          <ChannelManager />
        </section>

        {/* 字号设置 */}
        <section className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-primary" />
            <h2 className="font-medium">字号设置</h2>
          </div>
          <div className="flex gap-2">
            {[
              { value: 'small', label: '小' },
              { value: 'normal', label: '标准' },
              { value: 'large', label: '大' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                  fontSize === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dark-border text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 屏蔽关键词 */}
        <section className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <X className="w-5 h-5 text-primary" />
            <h2 className="font-medium">屏蔽关键词</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            包含这些关键词的热榜将被自动隐藏
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              placeholder="输入关键词"
              className="flex-1 bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
            />
            <button
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
              className="px-4 py-2.5 bg-dark-hover hover:bg-dark-border disabled:opacity-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {blockedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {blockedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-dark rounded-full text-sm text-gray-400"
                >
                  {keyword}
                  <button
                    onClick={() => removeBlockedKeyword(keyword)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无屏蔽词</p>
          )}
        </section>

        {/* 关于 */}
        <section className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="font-medium">关于</h2>
          </div>
          <div className="text-sm text-gray-400 space-y-2">
            <p>EdgeTrendHub v1.0.0</p>
            <p>基于阿里云 ESA Pages 边缘计算平台构建</p>
            <p>热榜数据来源于 DailyHotApi 开源项目</p>
          </div>
          <div className="mt-4 pt-4 border-t border-dark-border">
            <a
              href="https://www.aliyun.com/product/esa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover"
            >
              了解阿里云 ESA
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
