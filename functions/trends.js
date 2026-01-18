/**
 * 边缘函数: 热榜聚合接口
 * 路径: /api/trends
 *
 * 数据来源: DailyHotApi (https://github.com/imsyy/DailyHotApi)
 * 这是一个开源的热榜聚合API，支持50+平台
 */

// DailyHotApi 公共实例地址（可自行部署）
const DAILY_HOT_API = 'https://api-hot.imsyy.top'

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
    const response = await fetch(`${DAILY_HOT_API}${config.endpoint}`, {
      headers: {
        'User-Agent': 'EdgeTrendHub/1.0'
      }
    })

    if (!response.ok) {
      console.error(`获取 ${platform} 热榜失败: ${response.status}`)
      return []
    }

    const data = await response.json()

    // DailyHotApi 返回格式: { code: 200, data: [...] }
    if (data.code !== 200 || !Array.isArray(data.data)) {
      return []
    }

    // 转换为统一格式
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

// 标题相似度计算（Jaccard）
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
  const threshold = 0.7 // 相似度阈值

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

export default async function handler(request, env) {
  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const url = new URL(request.url)
    const channelsParam = url.searchParams.get('channels')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // 解析请求的频道
    const requestedChannels = channelsParam
      ? channelsParam.split(',').filter(c => PLATFORM_CONFIG[c])
      : Object.keys(PLATFORM_CONFIG)

    // 检查边缘缓存
    const cacheKey = `trends:${requestedChannels.sort().join(',')}`

    // 尝试从 KV 读取缓存
    let cached = null
    if (env && env.TREND_KV) {
      cached = await env.TREND_KV.get(cacheKey, 'json')
    }

    if (cached && cached.timestamp && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
      // 缓存有效（5分钟内）
      return new Response(JSON.stringify({
        items: cached.items.slice(0, limit),
        cached: true,
        timestamp: cached.timestamp,
        channels: requestedChannels
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60'
        }
      })
    }

    // 并发获取所有平台热榜
    const promises = requestedChannels.map(platform => fetchPlatformTrends(platform))
    const results = await Promise.all(promises)

    // 合并所有结果
    const allTrends = results.flat()

    // 按热度排序
    allTrends.sort((a, b) => (b.hot || 0) - (a.hot || 0))

    // 去重
    const deduplicated = deduplicateTrends(allTrends)

    // 写入 KV 缓存
    const cacheData = {
      items: deduplicated,
      timestamp: Date.now()
    }

    if (env && env.TREND_KV) {
      await env.TREND_KV.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300 // 5分钟过期
      })
    }

    return new Response(JSON.stringify({
      items: deduplicated.slice(0, limit),
      cached: false,
      timestamp: Date.now(),
      channels: requestedChannels
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60'
      }
    })

  } catch (error) {
    console.error('热榜聚合失败:', error)

    return new Response(JSON.stringify({
      error: '服务暂时不可用',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
