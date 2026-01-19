// 前端 API 封装
// 说明：所有外部数据获取都通过 ESA 边缘函数完成，避免浏览器直连第三方产生的 CORS/网络问题。

const DEFAULT_TIMEOUT_MS = 10000

async function fetchJson(url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { ...init, signal: controller.signal })

    const text = await res.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }

    if (!res.ok) {
      const message = data?.error || data?.message || `${res.status} ${res.statusText}`
      const err = new Error(message)
      err.status = res.status
      err.data = data
      throw err
    }

    return data
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// 获取热榜数据（通过边缘函数）
export async function fetchTrends(channels = [], options = {}) {
  const limit = Number.isFinite(options.limit) ? options.limit : 100
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_TIMEOUT_MS

  const url = new URL('/api/trends', window.location.origin)
  url.searchParams.set('limit', String(limit))

  if (Array.isArray(channels) && channels.length > 0) {
    url.searchParams.set('channels', channels.join(','))
  }

  if (options.fresh) {
    url.searchParams.set('fresh', '1')
  }

  return fetchJson(url.toString(), { method: 'GET' }, timeoutMs)
}

// 生成 AI 摘要（通过边缘函数代理调用千问 API）
export async function generateSummary(userId, title, content = '', apiKey = '') {
  if (!apiKey) {
    throw new Error('请先在设置中配置千问 API Key')
  }

  return fetchJson('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title, content, apiKey })
  }, 20000)
}

// 搜索热榜（前端本地搜索）
export async function searchTrends(query, trendsData = []) {
  const q = (query || '').toLowerCase().trim()
  if (!q) {
    return { items: [], query: '', total: 0, timestamp: Date.now() }
  }

  const results = (trendsData || []).filter(item => {
    const title = (item.title || '').toLowerCase()
    const desc = (item.desc || '').toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  results.sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase()
    const bTitle = (b.title || '').toLowerCase()
    const aInTitle = aTitle.includes(q)
    const bInTitle = bTitle.includes(q)

    if (aInTitle && !bInTitle) return -1
    if (!aInTitle && bInTitle) return 1
    return (b.hot || 0) - (a.hot || 0)
  })

  return {
    items: results.slice(0, 50),
    query,
    total: results.length,
    timestamp: Date.now()
  }
}

// 健康检查（可用于调试部署是否正常）
export async function checkHealth() {
  return fetchJson('/api/health', { method: 'GET' })
}