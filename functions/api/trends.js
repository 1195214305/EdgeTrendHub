/**
 * 边缘函数: 热榜聚合接口
 * 路径: /api/trends
 *
 * 主数据源: DailyHotApi（可通过环境变量 HOT_API_BASES 或 EDGE_TRENDHUB_HOT_API_BASES 配置多个镜像）
 * 回退数据源: 部分平台使用公开接口做兜底，提升可用性
 */

const DEFAULT_HOT_API_BASES = ['https://api-hot.imsyy.top']

// 平台映射配置（DailyHotApi）
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

function getHotApiBases() {
  const raw = (typeof process !== 'undefined' && process.env && (process.env.EDGE_TRENDHUB_HOT_API_BASES || process.env.HOT_API_BASES)) || ''
  const fromEnv = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const merged = [...fromEnv, ...DEFAULT_HOT_API_BASES]
  return [...new Set(merged)]
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const s = value.replace(/[,_\s]/g, '')
    const m = s.match(/\d+(?:\.\d+)?/)
    return m ? Number(m[0]) : 0
  }
  return 0
}

function hashString(input) {
  const str = String(input || '')
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

function makeStableId(platform, title, url) {
  return `${platform}_${hashString(`${title || ''}#${url || ''}`)}`
}

async function fetchJson(url, { timeoutMs = 8000, headers = {}, method = 'GET' } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json,text/plain,*/*',
        ...headers
      },
      signal: controller.signal
    })

    if (!res.ok) {
      return { ok: false, status: res.status, data: null }
    }

    const data = await res.json().catch(() => null)
    return { ok: true, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: null }
  } finally {
    clearTimeout(timer)
  }
}

function normalizeDailyHotItem(platform, item, index) {
  const title = item?.title || ''
  const url = item?.url || item?.mobileUrl || ''
  const hot = toNumber(item?.hot || item?.hotValue)

  return {
    id: makeStableId(platform, title, url || `${platform}_${index}`),
    title,
    desc: item?.desc || item?.description || '',
    url: url || '#',
    hot,
    cover: item?.pic || item?.cover || null,
    source: platform,
    tag: item?.label || null,
    timestamp: Date.now()
  }
}

async function fetchFromDailyHotApi(platform) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) return []

  const bases = getHotApiBases()

  for (const base of bases) {
    const { ok, data } = await fetchJson(`${base}${config.endpoint}`)

    if (!ok || !data) continue
    if (data.code !== 200 || !Array.isArray(data.data)) continue

    const items = data.data
      .slice(0, 20)
      .map((item, index) => normalizeDailyHotItem(platform, item, index))
      .filter(x => x.title)

    if (items.length > 0) return items
  }

  return []
}

// 公开接口兜底：微博热搜
async function fetchWeiboFallback() {
  const { ok, data } = await fetchJson('https://weibo.com/ajax/side/hotSearch', {
    headers: { 'Referer': 'https://weibo.com/' },
    timeoutMs: 8000
  })

  const list = data?.data?.realtime
  if (!ok || !Array.isArray(list)) return []

  return list
    .slice(0, 20)
    .map((item, index) => {
      const word = item?.word || ''
      const url = word ? `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}` : '#'
      return {
        id: makeStableId('weibo', word, url),
        title: word,
        desc: item?.note || '',
        url,
        hot: toNumber(item?.num || item?.raw_hot || item?.hot),
        cover: null,
        source: 'weibo',
        tag: item?.category || null,
        timestamp: Date.now()
      }
    })
    .filter(x => x.title)
}

// 公开接口兜底：知乎热榜
async function fetchZhihuFallback() {
  const endpoint = 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true'
  const { ok, data } = await fetchJson(endpoint, {
    headers: { 'Referer': 'https://www.zhihu.com/hot' },
    timeoutMs: 8000
  })

  const list = data?.data
  if (!ok || !Array.isArray(list)) return []

  return list
    .slice(0, 20)
    .map((item, index) => {
      const target = item?.target || {}
      const title = target?.title || target?.title_area?.title || ''
      const id = target?.id
      const url = id ? `https://www.zhihu.com/question/${id}` : (target?.url || 'https://www.zhihu.com/hot')
      return {
        id: makeStableId('zhihu', title, url),
        title,
        desc: target?.excerpt || '',
        url,
        hot: toNumber(item?.detail_text || item?.detailText || item?.score),
        cover: target?.image_area?.url || target?.thumbnail || null,
        source: 'zhihu',
        tag: null,
        timestamp: Date.now()
      }
    })
    .filter(x => x.title)
}

// 公开接口兜底：B站热门
async function fetchBilibiliFallback() {
  const endpoint = 'https://api.bilibili.com/x/web-interface/popular?pn=1&ps=20'
  const { ok, data } = await fetchJson(endpoint, {
    headers: { 'Referer': 'https://www.bilibili.com/' },
    timeoutMs: 8000
  })

  const list = data?.data?.list
  if (!ok || !Array.isArray(list)) return []

  return list
    .slice(0, 20)
    .map((item, index) => {
      const title = item?.title || ''
      const bvid = item?.bvid
      const url = item?.short_link_v2 || item?.short_link || (bvid ? `https://www.bilibili.com/video/${bvid}` : '#')
      return {
        id: makeStableId('bilibili', title, url),
        title,
        desc: item?.rcmd_reason?.content || item?.desc || '',
        url,
        hot: toNumber(item?.stat?.view || item?.stat?.like || 0),
        cover: item?.pic || null,
        source: 'bilibili',
        tag: null,
        timestamp: Date.now()
      }
    })
    .filter(x => x.title)
}

// 公开接口兜底：百度热搜（结构可能变化，尽量兼容）
async function fetchBaiduFallback() {
  const endpoint = 'https://top.baidu.com/api/board?platform=wise&tab=realtime'
  const { ok, data } = await fetchJson(endpoint, {
    headers: { 'Referer': 'https://top.baidu.com/' },
    timeoutMs: 8000
  })

  const content = data?.data?.cards?.[0]?.content || data?.data?.cards?.[0]?.content || data?.data?.content
  if (!ok || !Array.isArray(content)) return []

  return content
    .slice(0, 20)
    .map((item, index) => {
      const title = item?.word || item?.query || ''
      const url = item?.rawUrl || item?.url || (title ? `https://www.baidu.com/s?wd=${encodeURIComponent(title)}` : '#')
      return {
        id: makeStableId('baidu', title, url),
        title,
        desc: item?.desc || item?.desc2 || '',
        url,
        hot: toNumber(item?.hotScore || item?.hot_score || item?.hot || item?.value),
        cover: item?.img || item?.imgUrl || null,
        source: 'baidu',
        tag: null,
        timestamp: Date.now()
      }
    })
    .filter(x => x.title)
}

const FALLBACK_FETCHERS = {
  weibo: fetchWeiboFallback,
  zhihu: fetchZhihuFallback,
  bilibili: fetchBilibiliFallback,
  baidu: fetchBaiduFallback
}

// 获取单个平台热榜
async function fetchPlatformTrends(platform) {
  const config = PLATFORM_CONFIG[platform]
  if (!config) return []

  const primary = await fetchFromDailyHotApi(platform)
  if (primary.length > 0) return primary

  const fallback = FALLBACK_FETCHERS[platform]
  if (fallback) {
    const items = await fallback().catch(() => [])
    if (items.length > 0) return items
  }

  return []
}

// 标题相似度计算
function calculateSimilarity(a, b) {
  if (!a || !b) return 0
  const setA = new Set(String(a).toLowerCase().split(''))
  const setB = new Set(String(b).toLowerCase().split(''))
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union > 0 ? intersection / union : 0
}

// 去重聚合
function deduplicateTrends(trends) {
  const result = []
  const threshold = 0.7

  for (const item of trends) {
    if (!item || !item.title) continue
    const isDuplicate = result.some(r => calculateSimilarity(r.title, item.title) > threshold)
    if (!isDuplicate) result.push(item)
  }

  return result
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function getCache() {
  try {
    // 在部分运行时（如 ServiceWorker/Edge）可用
    if (typeof caches !== 'undefined' && caches && caches.default) return caches.default
  } catch {
    // ignore
  }
  return null
}

// ESA Pages 边缘函数入口
export default async function handler(request) {
  const corsHeaders = getCorsHeaders()

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
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10)))
    const fresh = url.searchParams.get('fresh') === '1'

    const requestedChannels = channelsParam
      ? channelsParam.split(',').map(s => s.trim()).filter(c => PLATFORM_CONFIG[c])
      : Object.keys(PLATFORM_CONFIG)

    if (channelsParam && requestedChannels.length === 0) {
      return new Response(JSON.stringify({
        error: 'channels 参数不合法',
        message: '请使用支持的平台：' + Object.keys(PLATFORM_CONFIG).join(',')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cache = getCache()
    const sortedChannels = [...requestedChannels].sort()
    const cacheKey = new Request(`https://cache.edge-trend-hub/trends?channels=${encodeURIComponent(sortedChannels.join(','))}&limit=${limit}`)

    if (!fresh && cache) {
      const cached = await cache.match(cacheKey)
      if (cached) {
        return new Response(cached.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT'
          }
        })
      }
    }

    // 并发获取所有平台热榜
    const results = await Promise.all(requestedChannels.map(platform => fetchPlatformTrends(platform)))

    // 合并所有结果
    const allTrends = results.flat()

    // 按热度排序
    allTrends.sort((a, b) => (toNumber(b.hot) || 0) - (toNumber(a.hot) || 0))

    // 去重
    const deduplicated = deduplicateTrends(allTrends)

    const payload = {
      items: deduplicated.slice(0, limit),
      timestamp: Date.now(),
      channels: requestedChannels
    }

    // 如果完全没有数据，明确返回错误，方便前端提示原因
    if (payload.items.length === 0) {
      return new Response(JSON.stringify({
        error: '无法获取热榜数据',
        message: '上游热榜服务暂时不可用。你可以在 ESA 环境变量中设置 HOT_API_BASES 指向自建/镜像的 DailyHotApi。',
        timestamp: payload.timestamp,
        channels: requestedChannels
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const response = new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        // 让 ESA CDN 缓存一小段时间；也能配合 caches.default
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Cache': 'MISS'
      }
    })

    if (cache) {
      await cache.put(cacheKey, response.clone()).catch(() => {})
    }

    return response
  } catch (error) {
    console.error('热榜聚合失败:', error)

    return new Response(JSON.stringify({
      error: '服务暂时不可用',
      message: error && error.message ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
