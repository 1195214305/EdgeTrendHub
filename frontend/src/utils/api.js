// API 请求封装
const API_BASE = '/api'

// 通用请求方法
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API请求失败 [${endpoint}]:`, error)
    throw error
  }
}

// 获取热榜数据
export async function fetchTrends(channels = [], options = {}) {
  const params = new URLSearchParams()

  if (channels.length > 0) {
    params.set('channels', channels.join(','))
  }

  if (options.limit) {
    params.set('limit', options.limit)
  }

  const queryString = params.toString()
  const endpoint = `/trends${queryString ? `?${queryString}` : ''}`

  return request(endpoint)
}

// 获取单个平台热榜
export async function fetchPlatformTrends(platform) {
  return request(`/trends/${platform}`)
}

// 生成AI摘要
export async function generateSummary(userId, title, content = '', apiKey = '') {
  return request('/summary', {
    method: 'POST',
    body: JSON.stringify({ userId, title, content, apiKey })
  })
}

// 获取用户设置
export async function getSettings(userId) {
  return request(`/settings?userId=${userId}`)
}

// 保存用户设置
export async function saveSettings(userId, settings) {
  return request(`/settings?userId=${userId}`, {
    method: 'POST',
    body: JSON.stringify(settings)
  })
}

// 搜索热榜
export async function searchTrends(query, options = {}) {
  const params = new URLSearchParams({ q: query })

  if (options.channels) {
    params.set('channels', options.channels.join(','))
  }

  return request(`/search?${params.toString()}`)
}

// 获取热度趋势数据
export async function fetchHotTrend(itemId) {
  return request(`/trend/${itemId}`)
}

// 检查API健康状态
export async function checkHealth() {
  return request('/health')
}
