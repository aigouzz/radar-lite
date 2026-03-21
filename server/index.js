/**
 * TrendRadar Lite - 本地数据抓取服务
 *
 * 直接从各平台的公开接口/页面抓取热搜数据，
 * 然后通过 http://localhost:3001/api/:platform 提供给前端。
 *
 * 内置 60 秒缓存，避免频繁请求平台接口。
 */

const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
const PORT = 3001

app.use(cors())

// ═══════════════════════════════════════════════════════════════════
//  缓存层 - 每个平台的数据缓存 60 秒
// ═══════════════════════════════════════════════════════════════════
const cache = {}
const CACHE_TTL = 60 * 1000 // 60s

function getCache(key) {
  const entry = cache[key]
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}

function setCache(key, data) {
  cache[key] = { data, ts: Date.now() }
}

// ═══════════════════════════════════════════════════════════════════
//  通用请求工具
// ═══════════════════════════════════════════════════════════════════
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      ...options.headers,
    },
    ...options,
  })
  return res.json()
}

// ═══════════════════════════════════════════════════════════════════
//  各平台抓取函数
//  每个函数返回数组: [{ title, url, hot }]
// ═══════════════════════════════════════════════════════════════════

// ── 微博热搜 ──
async function crawlWeibo() {
  const data = await fetchJSON('https://weibo.com/ajax/side/hotSearch', {
    headers: { Referer: 'https://weibo.com' },
  })
  const list = data?.data?.realtime || []
  return list.map((item) => ({
    title: item.note || item.word,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
    hot: item.num || 0,
  }))
}

// ── 百度热搜 ──
async function crawlBaidu() {
  const data = await fetchJSON('https://top.baidu.com/api/board?platform=wise&tab=realtime')
  const list = data?.data?.cards?.[0]?.content || []
  return list.map((item) => ({
    title: item.word || item.query,
    url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
    hot: parseInt(item.hotScore) || 0,
  }))
}

// ── 知乎热榜 ──
async function crawlZhihu() {
  const data = await fetchJSON('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50', {
    headers: { Referer: 'https://www.zhihu.com' },
  })
  const list = data?.data || []
  return list.map((item) => ({
    title: item.target?.title || '',
    url: `https://www.zhihu.com/question/${item.target?.id}`,
    hot: parseInt(item.detail_text?.replace(/[^\d]/g, '')) || 0,
  }))
}

// ── 今日头条 ──
async function crawlToutiao() {
  const data = await fetchJSON('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc')
  const list = data?.data || []
  return list.map((item) => ({
    title: item.Title,
    url: item.Url || `https://www.toutiao.com/trending/${item.ClusterIdStr}/`,
    hot: parseInt(item.HotValue) || 0,
  }))
}

// ── 抖音热点 ──
async function crawlDouyin() {
  const data = await fetchJSON('https://www.douyin.com/aweme/v1/web/hot/search/list/', {
    headers: { Referer: 'https://www.douyin.com' },
  })
  const list = data?.data?.word_list || []
  return list.map((item) => ({
    title: item.word,
    url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
    hot: parseInt(item.hot_value) || 0,
  }))
}

// ── B站热榜 ──
async function crawlBilibili() {
  const data = await fetchJSON('https://api.bilibili.com/x/web-interface/popular?ps=50&pn=1', {
    headers: { Referer: 'https://www.bilibili.com' },
  })
  const list = data?.data?.list || []
  return list.map((item) => ({
    title: item.title,
    url: `https://www.bilibili.com/video/${item.bvid}`,
    hot: item.stat?.view || 0,
  }))
}

// ── 36氪 ──
async function crawl36kr() {
  const data = await fetchJSON('https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partner_id: 'wap', param: { siteId: 1, platformId: 2 } }),
  })
  const list = data?.data?.hotRankList || []
  return list.map((item) => ({
    title: item.templateMaterial?.widgetTitle || '',
    url: `https://36kr.com/p/${item.itemId}`,
    hot: parseInt(item.templateMaterial?.statRead) || 0,
  }))
}

// ── 澎湃新闻 ──
async function crawlThepaper() {
  const data = await fetchJSON('https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar')
  const list = data?.data?.hotNews || []
  return list.map((item) => ({
    title: item.name,
    url: `https://www.thepaper.cn/newsDetail_forward_${item.contId}`,
    hot: parseInt(item.praiseTimes) || 0,
  }))
}

// ── 腾讯新闻 ──
async function crawlNewsqq() {
  const data = await fetchJSON('https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50')
  const list = data?.idlist?.[0]?.newslist || []
  return list.filter(i => i.title).map((item) => ({
    title: item.title,
    url: `https://new.qq.com/rain/a/${item.id}`,
    hot: parseInt(item.hottags?.hotScore) || parseInt(item.hotEvent?.hotScore) || 0,
  }))
}

// ── 掘金热榜 ──
async function crawlJuejin() {
  const data = await fetchJSON('https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&count=50&from=0', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_id: '1', type: 'hot', count: 50, from: 0 }),
  })
  const list = data?.data || []
  return list.map((item) => ({
    title: item.content?.title || '',
    url: `https://juejin.cn/post/${item.content?.content_id}`,
    hot: parseInt(item.content_counter?.hot_rank) || parseInt(item.content_counter?.view) || 0,
  }))
}

// ── 少数派 ──
async function crawlSspai() {
  const data = await fetchJSON('https://sspai.com/api/v1/article/tag/page/get?limit=40&offset=0&tag=%E7%83%AD%E9%97%A8%E6%96%87%E7%AB%A0')
  const list = data?.data || []
  return list.map((item) => ({
    title: item.title,
    url: `https://sspai.com/post/${item.id}`,
    hot: item.like_count || 0,
  }))
}

// ── IT之家 ──
async function crawlIthome() {
  // IT之家没有简单JSON API，用备用方案
  const data = await fetchJSON('https://m.ithome.com/api/news/newslistpageget?categoryid=0&startkey=&dt=0')
  const list = data?.Result || []
  return list.map((item) => ({
    title: item.title || item.Title,
    url: item.url || item.Url || '#',
    hot: parseInt(item.z) || parseInt(item.commentcount) || 0,
  }))
}

// ── 百度贴吧 ──
async function crawlTieba() {
  const data = await fetchJSON('https://tieba.baidu.com/hottopic/browse/topicList')
  const list = data?.data?.bang_topic?.topic_list || []
  return list.map((item) => ({
    title: item.topic_name,
    url: item.topic_url?.startsWith('http') ? item.topic_url : `https://tieba.baidu.com${item.topic_url || ''}`,
    hot: parseInt(item.discuss_num) || 0,
  }))
}

// ── 豆瓣讨论 ──
async function crawlDouban() {
  const data = await fetchJSON('https://m.douban.com/rexxar/api/v2/subject_collection/movie_hot_gaia/items?start=0&count=30&items_only=1', {
    headers: { Referer: 'https://m.douban.com' },
  })
  const list = data?.subject_collection_items || []
  return list.map((item) => ({
    title: item.title,
    url: item.url || `https://www.douban.com/subject/${item.id}/`,
    hot: parseFloat(item.rating?.value) || 0,
  }))
}

// ── 网易新闻 ──
async function crawlNetease() {
  const data = await fetchJSON('https://m.163.com/fe/api/hot/news/flow?size=40')
  const list = data?.data?.list || []
  return list.map((item) => ({
    title: item.title,
    url: item.skipURL || item.url || '#',
    hot: parseInt(item.hotScore) || parseInt(item.tieNum) || 0,
  }))
}

// ═══════════════════════════════════════════════════════════════════
//  平台注册表
// ═══════════════════════════════════════════════════════════════════
const crawlers = {
  weibo:    crawlWeibo,
  baidu:    crawlBaidu,
  zhihu:    crawlZhihu,
  toutiao:  crawlToutiao,
  douyin:   crawlDouyin,
  bilibili: crawlBilibili,
  '36kr':   crawl36kr,
  thepaper: crawlThepaper,
  newsqq:   crawlNewsqq,
  juejin:   crawlJuejin,
  sspai:    crawlSspai,
  ithome:   crawlIthome,
  tieba:    crawlTieba,
  douban:   crawlDouban,
  netease:  crawlNetease,
}

// ═══════════════════════════════════════════════════════════════════
//  API 路由
// ═══════════════════════════════════════════════════════════════════

// 获取单个平台热搜
app.get('/api/:platform', async (req, res) => {
  const platform = req.params.platform
  const crawler = crawlers[platform]

  if (!crawler) {
    return res.status(404).json({ code: 404, message: `平台 "${platform}" 不存在` })
  }

  // 检查缓存
  const cached = getCache(platform)
  if (cached) {
    console.log(`[缓存] ${platform} (${cached.length} 条)`)
    return res.json({ code: 200, name: platform, data: cached, fromCache: true })
  }

  try {
    console.log(`[抓取] ${platform} ...`)
    const data = await crawler()
    setCache(platform, data)
    console.log(`[完成] ${platform} → ${data.length} 条`)
    res.json({ code: 200, name: platform, data, fromCache: false })
  } catch (err) {
    console.error(`[错误] ${platform}:`, err.message)
    res.status(500).json({ code: 500, name: platform, message: err.message, data: [] })
  }
})

// 获取所有平台列表
app.get('/api', (req, res) => {
  res.json({
    code: 200,
    platforms: Object.keys(crawlers),
    message: '使用 /api/:platform 获取具体平台数据',
  })
})

// ═══════════════════════════════════════════════════════════════════
//  启动
// ═══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('')
  console.log('  ╔══════════════════════════════════════════════╗')
  console.log('  ║   📡 TrendRadar Lite - 数据抓取服务         ║')
  console.log(`  ║   🌐 http://localhost:${PORT}/api              ║`)
  console.log(`  ║   📊 已注册 ${Object.keys(crawlers).length} 个平台                       ║`)
  console.log('  ╚══════════════════════════════════════════════╝')
  console.log('')
  console.log('  可用平台:', Object.keys(crawlers).join(', '))
  console.log('')
})
