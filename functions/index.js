/**
 * ESA Pages 边缘函数统一入口
 * 根据请求路径分发到对应的处理函数
 */

// 导入各个API处理函数
import trendsHandler from './api/trends.js'
import summaryHandler from './api/summary.js'
import searchHandler from './api/search.js'
import settingsHandler from './api/settings.js'
import healthHandler from './api/health.js'

async function fetch(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // API 路由分发
  if (path === '/api/trends') {
    return trendsHandler(request)
  }

  if (path === '/api/summary') {
    return summaryHandler(request)
  }

  if (path === '/api/search') {
    return searchHandler(request)
  }

  if (path === '/api/settings') {
    return settingsHandler(request)
  }

  if (path === '/api/health') {
    return healthHandler(request)
  }

  // 非 API 请求，返回 bypass 让 ESA 处理静态资源
  return new Response(null, { status: 404 })
}

export default { fetch }
