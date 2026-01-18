// API 请求封装
// 直接调用 DailyHotApi 公共实例

const DAILY_HOT_API = 'https://api-hot.imsyy.top'
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

// 平台映射配置
const PLATFORM_CONFIG = {
  weibo: { endpoint: '/weibo', name: '微博' },
  zhihu: { endpoint: '/zhihu', name: '知乎' },
  bilibili: { endpoint: '/bilibili', name: 'B站' },
  douyin: { endpoint: '/douyin', name: '抖音' },
  baidu: { endpoint: '/baidu', name: '百度' },
  toutiao: { endpoint: '/toutiao', name: '头条' },
  douban: { endpoint: '/douban-movie', name: '豆瓣' },
  juejin: { endpoint: '/juejin', name: '掘金' },
  github: { endpoint: '/github', name: 'GitHub' },
  v2ex: { endpoint: '/v2ex', name: 'V2EX' }
}

// 获取单个平台热榜
async function fetchPlatformTrends(platform) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) return []

  try {
    const response = await fetch(`${DAILY_HOT_API}${config.endpoint}`)

    if (!response.ok) {
      console.error(`获取 ${platform} 热榜失败: ${response.status}`)
      return []
    }

    const data = await response.json()

    if (data.code !== 200 || !Array.isArray(data.data)) {
      return []
    }

    return data.data.slice(0, 20).map((item, index) => ({
      id: `${platform}_${item.id || index}_${Date.now()}`,
      title: item.title || '',
      desc: item.desc || item.description || '',
      url: item.url || item.mobileUrl || '#',
      hot: item.hot || item.hotValue || 0,
      cover: item.pic || item.cover || null,
      source: platform,
      tag: item.label || null,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error(`获取 ${platform} 热榜异常:`, error)
    return []
  }
}

// 标题相似度计算
function calculateSimilarity(a, b) {
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

// 去重聚合
function deduplicateTrends(trends) {
  const result = []
  const threshold = 0.7

  for (const item of trends) {
    const isDuplicate = result.some(r =>
      calculateSimilarity(r.title, item.title) > threshold
    )
    if (!isDuplicate) {
      result.push(item)
    }
  }

  return result
}

// 获取热榜数据
export async function fetchTrends(channels = [], options = {}) {
  const requestedChannels = channels.length > 0
    ? channels.filter(c => PLATFORM_CONFIG[c])
    : Object.keys(PLATFORM_CONFIG)

  const limit = options.limit || 100

  // 并发获取所有平台热榜
  const promises = requestedChannels.map(platform => fetchPlatformTrends(platform))
  const results = await Promise.all(promises)

  // 合并所有结果
  const allTrends = results.flat()

  // 按热度排序
  allTrends.sort((a, b) => (b.hot || 0) - (a.hot || 0))

  // 去重
  const deduplicated = deduplicateTrends(allTrends)

  return {
    items: deduplicated.slice(0, limit),
    timestamp: Date.now(),
    channels: requestedChannels
  }
}

// 生成AI摘要（直接调用千问API）
export async function generateSummary(userId, title, content = '', apiKey = '') {
  if (!apiKey) {
    throw new Error('请先在设置中配置千问 API Key')
  }

  const prompt = `请用简洁的语言（不超过100字）总结以下热点新闻的核心内容：

标题：${title}
${content ? `详情：${content}` : ''}

要求：直接输出摘要内容，语言简洁明了，保持客观中立。`

  const response = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: '你是一个专业的新闻摘要助手。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`AI 服务暂时不可用: ${response.status}`)
  }

  const result = await response.json()
  const summary = result.choices?.[0]?.message?.content || '摘要生成失败'

  return {
    summary: summary.trim(),
    model: 'qwen-turbo',
    timestamp: Date.now()
  }
}

// 搜索热榜（本地搜索）
export async function searchTrends(query, trendsData = []) {
  const q = query.toLowerCase()

  const results = trendsData.filter(item => {
    const title = (item.title || '').toLowerCase()
    const desc = (item.desc || '').toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  // 按相关度排序
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

// 获取用户设置（本地存储）
export async function getSettings(userId) {
  return { message: '设置存储在本地' }
}

// 保存用户设置（本地存储）
export async function saveSettings(userId, settings) {
  return { success: true }
}

// 检查API健康状态
export async function checkHealth() {
  return { status: 'ok', timestamp: Date.now() }
}
