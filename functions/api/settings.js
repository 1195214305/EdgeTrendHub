/**
 * 边缘函数: 用户设置接口
 * 路径: /api/settings
 *
 * 注意：由于 ESA Pages 免费版可能不支持 KV，这里使用简化版本
 * 设置存储在前端 localStorage 中
 */

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 简化版本：直接返回成功，实际设置存储在前端
  if (request.method === 'GET') {
    return new Response(JSON.stringify({
      message: '设置存储在本地',
      hasApiKey: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (request.method === 'POST') {
    return new Response(JSON.stringify({
      success: true,
      message: '设置已保存到本地'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
