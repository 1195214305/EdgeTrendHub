/**
 * 边缘函数: 健康检查接口
 * 路径: /api/health
 */

export default async function handler(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const status = {
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0',
    services: {
      kv: false,
      api: true
    }
  }

  // 检查 KV 连接
  if (env && env.TREND_KV) {
    try {
      await env.TREND_KV.get('health-check')
      status.services.kv = true
    } catch (e) {
      status.services.kv = false
    }
  }

  return new Response(JSON.stringify(status), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
