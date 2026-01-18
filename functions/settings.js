/**
 * 边缘函数: 用户设置接口
 * 路径: /api/settings
 *
 * 存储用户的 API Key 和偏好设置
 */

export default async function handler(request, env) {
  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return new Response(JSON.stringify({ error: '缺少 userId 参数' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const settingsKey = `settings:${userId}`

  // GET: 获取用户设置
  if (request.method === 'GET') {
    try {
      let settings = {}

      if (env && env.USER_KV) {
        settings = await env.USER_KV.get(settingsKey, 'json') || {}
      }

      // 不返回完整的 API Key，只返回是否已配置
      return new Response(JSON.stringify({
        ...settings,
        qwenApiKey: settings.qwenApiKey ? '******' : null,
        hasApiKey: !!settings.qwenApiKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('获取设置失败:', error)
      return new Response(JSON.stringify({ error: '获取设置失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  // POST: 保存用户设置
  if (request.method === 'POST') {
    try {
      const body = await request.json()

      // 获取现有设置
      let existing = {}
      if (env && env.USER_KV) {
        existing = await env.USER_KV.get(settingsKey, 'json') || {}
      }

      // 合并新设置
      const updated = {
        ...existing,
        ...body,
        updatedAt: Date.now()
      }

      // 保存到 KV
      if (env && env.USER_KV) {
        await env.USER_KV.put(settingsKey, JSON.stringify(updated))
      }

      return new Response(JSON.stringify({
        success: true,
        message: '设置已保存'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('保存设置失败:', error)
      return new Response(JSON.stringify({ error: '保存设置失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
