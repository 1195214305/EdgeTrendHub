/**
 * 边缘函数: 健康检查接口
 * 路径: /api/health
 */

export async function onRequest(context) {
  const { request } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: Date.now(),
    version: '1.0.0'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
