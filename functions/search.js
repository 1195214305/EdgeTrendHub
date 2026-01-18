/**
 * 边缘函数: 搜索接口
 * 路径: /api/search
 *
 * 在已缓存的热榜数据中搜索
 */

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
    const query = url.searchParams.get('q')?.trim().toLowerCase()
    const channelsParam = url.searchParams.get('channels')

    if (!query) {
      return new Response(JSON.stringify({ error: '缺少搜索关键词' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 解析频道
    const channels = channelsParam
      ? channelsParam.split(',')
      : ['weibo', 'zhihu', 'bilibili', 'baidu', 'toutiao', 'douyin', 'douban', 'juejin', 'github', 'v2ex']

    // 从 KV 获取缓存的热榜数据
    const cacheKey = `trends:${channels.sort().join(',')}`
    let cached = null

    if (env && env.TREND_KV) {
      cached = await env.TREND_KV.get(cacheKey, 'json')
    }

    if (!cached || !cached.items) {
      return new Response(JSON.stringify({
        items: [],
        query,
        message: '暂无缓存数据，请先刷新热榜'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 在缓存数据中搜索
    const results = cached.items.filter(item => {
      const title = (item.title || '').toLowerCase()
      const desc = (item.desc || '').toLowerCase()
      return title.includes(query) || desc.includes(query)
    })

    // 按相关度排序（标题匹配优先）
    results.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase()
      const bTitle = (b.title || '').toLowerCase()
      const aInTitle = aTitle.includes(query)
      const bInTitle = bTitle.includes(query)

      if (aInTitle && !bInTitle) return -1
      if (!aInTitle && bInTitle) return 1
      return (b.hot || 0) - (a.hot || 0)
    })

    return new Response(JSON.stringify({
      items: results.slice(0, 50),
      query,
      total: results.length,
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('搜索失败:', error)

    return new Response(JSON.stringify({
      error: '搜索服务暂时不可用',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
