/**
 * 边缘函数: AI摘要生成接口
 * 路径: /api/summary
 *
 * 使用通义千问 API 生成热点摘要
 */

// 千问 API 地址
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

export default async function handler(request, env) {
  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await request.json()
    const { userId, title, content } = body

    if (!userId || !title) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 从 KV 获取用户的 API Key
    let apiKey = null

    if (env && env.USER_KV) {
      const userSettings = await env.USER_KV.get(`settings:${userId}`, 'json')
      apiKey = userSettings?.qwenApiKey
    }

    // 如果用户没有配置，尝试使用环境变量中的默认 Key
    if (!apiKey && env && env.QWEN_API_KEY) {
      apiKey = env.QWEN_API_KEY
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: '请先在设置中配置千问 API Key'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 构建提示词
    const prompt = `请用简洁的语言（不超过100字）总结以下热点新闻的核心内容，帮助读者快速了解要点：

标题：${title}
${content ? `详情：${content}` : ''}

要求：
1. 直接输出摘要内容，不要有"摘要："等前缀
2. 语言简洁明了，突出关键信息
3. 保持客观中立的语气`

    // 调用千问 API
    const response = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的新闻摘要助手，擅长用简洁的语言总结热点新闻的核心内容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('千问 API 调用失败:', response.status, errorText)

      return new Response(JSON.stringify({
        error: 'AI 服务暂时不可用',
        details: response.status
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = await response.json()
    const summary = result.choices?.[0]?.message?.content || '摘要生成失败'

    // 缓存摘要结果（可选）
    const cacheKey = `summary:${Buffer.from(title).toString('base64').slice(0, 32)}`
    if (env && env.TREND_KV) {
      await env.TREND_KV.put(cacheKey, summary, { expirationTtl: 86400 }) // 24小时
    }

    return new Response(JSON.stringify({
      summary: summary.trim(),
      model: 'qwen-turbo',
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('摘要生成失败:', error)

    return new Response(JSON.stringify({
      error: '服务器错误',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
