import { useState, useEffect, useCallback, useRef } from 'react'
import Test from './test'

// ── 平台配置 ──
const PLATFORMS = [
  { id: 'weibo',    name: '微博热搜', icon: '🔴', color: '#E6162D' },
  { id: 'baidu',    name: '百度热搜', icon: '🔵', color: '#306CFF' },
  { id: 'zhihu',    name: '知乎热榜', icon: '🟦', color: '#0066FF' },
  { id: 'toutiao',  name: '今日头条', icon: '🔶', color: '#F85959' },
  { id: 'douyin',   name: '抖音热点', icon: '🎵', color: '#FE2C55' },
  { id: 'bilibili', name: 'B站热榜',  icon: '📺', color: '#00A1D6' },
  { id: '36kr',     name: '36氪',     icon: '📰', color: '#0078FF' },
  { id: 'thepaper', name: '澎湃新闻', icon: '📋', color: '#DF2A29' },
  { id: 'newsqq',   name: '腾讯新闻', icon: '📢', color: '#5BA0E8' },
  { id: 'juejin',   name: '掘金热榜', icon: '💎', color: '#1E80FF' },
  { id: 'sspai',    name: '少数派',   icon: '📱', color: '#DA2820' },
  { id: 'ithome',   name: 'IT之家',  icon: '💻', color: '#D32F2F' },
  { id: 'tieba',    name: '贴吧热议', icon: '💬', color: '#4879BD' },
  { id: 'douban',   name: '豆瓣',     icon: '🟢', color: '#007722' },
  { id: 'netease',  name: '网易热点', icon: '📣', color: '#C4302B' },
]

function formatHot(n) {
  if (!n || n <= 0) return ''
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '万'
  return n.toLocaleString()
}

function timeNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ── 骨架屏 ──
function Skeleton() {
  return Array.from({ length: 10 }).map((_, i) => (
    <div key={i} style={{
      display: 'flex', gap: 12, padding: '14px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      animation: `fadeIn .3s ease ${i * 40}ms both`,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        flex: 1, height: 14, borderRadius: 4,
        background: 'linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
        maxWidth: `${50 + Math.random() * 40}%`,
      }} />
    </div>
  ))
}

// ── 主应用 ──
export default function App() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})
  const [active, setActive] = useState('weibo')
  const [lastTime, setLastTime] = useState('')
  const [keyword, setKeyword] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [interval, setInterval_] = useState(5)
  const [showAll, setShowAll] = useState(false)
  const timerRef = useRef(null)

  // 抓取单平台
  const fetchOne = useCallback(async (pid) => {
    setLoading(s => ({ ...s, [pid]: true }))
    setErrors(s => ({ ...s, [pid]: null }))
    try {
      const res = await fetch(`/api/${pid}`)
      const json = await res.json()
      if (json.code === 200 && json.data?.length) {
        setData(s => ({ ...s, [pid]: json.data }))
      } else {
        throw new Error(json.message || '返回数据为空')
      }
    } catch (e) {
      setErrors(s => ({ ...s, [pid]: e.message }))
    }
    setLoading(s => ({ ...s, [pid]: false }))
  }, [])

  // 全部刷新
  const fetchAll = useCallback(() => {
    setLastTime(timeNow())
    PLATFORMS.forEach(p => fetchOne(p.id))
  }, [fetchOne])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoRefresh) timerRef.current = setInterval(fetchAll, interval * 60000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, interval, fetchAll])

  // 过滤
  const filtered = (items) => {
    if (!keyword.trim()) return items || []
    const kw = keyword.toLowerCase()
    return (items || []).filter(it => it.title.toLowerCase().includes(kw))
  }

  const cur = PLATFORMS.find(p => p.id === active)
  const curItems = filtered(data[active])
  const total = Object.values(data).reduce((s, d) => s + (d?.length || 0), 0)
  const tabs = showAll ? PLATFORMS : PLATFORMS.slice(0, 8)

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 背景 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
        backgroundSize: '80px 80px' }} />
      <div style={{ position: 'fixed', top: '-25%', right: '-15%', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)', zIndex: 0, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(236,72,153,.05) 0%,transparent 70%)', zIndex: 0, filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* Header */}
        <header style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 30 }}>📡</span>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0,
              background: 'linear-gradient(135deg,#818cf8,#c084fc,#f472b6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TrendRadar Lite
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12 }}>
            本地后端抓取 → 前端实时展示 · {PLATFORMS.length} 个平台 · 后端运行在 localhost:3001
          </p>
        </header>

        {/* 控制栏 */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
          padding: '10px 14px', marginBottom: 16,
          background: 'rgba(255,255,255,.025)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="关键词过滤..."
              style={{ width: '100%', padding: '7px 12px 7px 30px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 8, color: '#e8e6e3', fontSize: 13, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'rgba(129,140,248,.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'} />
          </div>
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: autoRefresh ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)',
              color: autoRefresh ? '#818cf8' : '#6b7280' }}>
            {autoRefresh ? `⏱ ${interval}min` : '⏸ 暂停'}
          </button>
          <select value={interval} onChange={e => setInterval_(+e.target.value)}
            style={{ padding: '7px 8px', borderRadius: 8, fontSize: 12,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#e8e6e3', cursor: 'pointer', outline: 'none' }}>
            {[1,2,3,5,10,15,30].map(m => <option key={m} value={m} style={{ background: '#1a1a2e' }}>{m}分钟</option>)}
          </select>
          <button onClick={fetchAll}
            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: 'rgba(16,185,129,.12)', color: '#10b981' }}>
            🔄 刷新全部
          </button>
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            📊 {total} 条 · ⏰ {lastTime}
          </span>
        </div>

        {/* 平台标签 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: 4, marginBottom: 16,
          background: 'rgba(255,255,255,.015)', borderRadius: 12, border: '1px solid rgba(255,255,255,.04)' }}>
          {tabs.map(p => {
            const isActive = active === p.id
            const isLoading = loading[p.id]
            const hasErr = errors[p.id] && !data[p.id]?.length
            const count = data[p.id]?.length || 0
            return (
              <button key={p.id} onClick={() => setActive(p.id)}
                style={{ padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  background: isActive ? `linear-gradient(135deg,${p.color}25,${p.color}0A)` : 'transparent',
                  color: isActive ? '#fff' : '#9ca3af',
                  borderBottom: isActive ? `2px solid ${p.color}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                <span style={{ fontSize: 13 }}>{p.icon}</span>
                <span>{p.name}</span>
                {isLoading && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />}
                {!isLoading && count > 0 && <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: '#6b7280' }}>{count}</span>}
                {hasErr && !isLoading && <span style={{ fontSize: 10, color: '#ef4444' }}>✗</span>}
              </button>
            )
          })}
          <button onClick={() => setShowAll(!showAll)}
            style={{ padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, color: '#6b7280', background: 'transparent' }}>
            {showAll ? '收起 ▲' : `更多(${PLATFORMS.length - 8}) ▼`}
          </button>
        </div>

        {/* 主内容 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 16, alignItems: 'start' }}>

          {/* 左：热搜列表 */}
          <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 14,
            border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,.06)',
              background: `linear-gradient(135deg,${cur?.color}0D,transparent)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{cur?.icon}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{cur?.name}</h2>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    {curItems.length} 条{keyword ? ` · 匹配 "${keyword}"` : ''}
                    {errors[active] ? ` · ⚠ ${errors[active]}` : ''}
                  </span>
                </div>
              </div>
              <button onClick={() => fetchOne(active)} disabled={loading[active]}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 11, background: 'rgba(255,255,255,.06)', color: '#9ca3af',
                  opacity: loading[active] ? .5 : 1 }}>
                {loading[active] ? '抓取中...' : '🔄 刷新'}
              </button>
            </div>

            <div>
              {loading[active] && !data[active]?.length ? <Skeleton /> :
               curItems.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 13 }}>{errors[active] ? `抓取失败: ${errors[active]}` : '暂无数据'}</div>
                </div>
              ) : curItems.map((item, idx) => {
                const rankBg = idx < 3
                  ? ['linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#94a3b8,#64748b)','linear-gradient(135deg,#cd7c2f,#a0522d)'][idx]
                  : 'rgba(255,255,255,.05)'
                return (
                  <a key={`${item.title}-${idx}`} href={item.url !== '#' ? item.url : undefined} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', textDecoration: 'none', color: 'inherit',
                      borderBottom: '1px solid rgba(255,255,255,.03)', transition: 'background .15s',
                      cursor: item.url !== '#' ? 'pointer' : 'default',
                      animation: `slideIn .25s ease ${idx * 25}ms both` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, flexShrink: 0, background: rankBg, color: idx < 3 ? '#fff' : '#6b7280' }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, lineHeight: 1.55, fontWeight: idx < 3 ? 600 : 400,
                      color: idx < 3 ? '#f1f5f9' : '#d1d5db' }}>
                      {item.title}
                    </span>
                    {item.hot > 0 && (
                      <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(255,255,255,.03)', fontVariantNumeric: 'tabular-nums' }}>
                        🔥 {formatHot(item.hot)}
                      </span>
                    )}
                  </a>
                )
              })}
            </div>
          </div>

          {/* 右：概览 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 统计 */}
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>📊 数据概览</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: '平台', val: PLATFORMS.length, color: '#818cf8', bg: 'rgba(99,102,241,.08)' },
                  { label: '总条数', val: total, color: '#10b981', bg: 'rgba(16,185,129,.08)' },
                  { label: '已加载', val: Object.keys(data).filter(k => data[k]?.length).length, color: '#f59e0b', bg: 'rgba(245,158,11,.08)' },
                ].map(s => (
                  <div key={s.label} style={{ padding: 10, borderRadius: 8, background: s.bg, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 各平台 TOP1 */}
            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.06)', maxHeight: 480, overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>🏆 各平台 TOP 1</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLATFORMS.map(p => {
                  const items = data[p.id]
                  const top = items?.[0]
                  const isA = active === p.id
                  return (
                    <div key={p.id} onClick={() => setActive(p.id)}
                      style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: isA ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.015)',
                        border: isA ? `1px solid ${p.color}44` : '1px solid transparent',
                        transition: 'all .15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12 }}>{p.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: p.color }}>{p.name}</span>
                        {loading[p.id] && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />}
                        {errors[p.id] && !items?.length && <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 'auto' }}>失败</span>}
                        {items?.length > 0 && <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 'auto' }}>{items.length}条</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {top ? top.title : (loading[p.id] ? '正在抓取...' : (errors[p.id] || '暂无数据'))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 说明 */}
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.02)',
              border: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: '#4b5563', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#6b7280' }}>💡 架构说明</div>
              <div>• <b style={{color:'#6b7280'}}>后端</b> (Express :3001) 直接抓取各平台公开API</div>
              <div>• <b style={{color:'#6b7280'}}>前端</b> (Vite :3000) 通过代理请求后端</div>
              <div>• 后端自带 60 秒缓存，避免频繁请求</div>
              <div>• 部分平台可能因反爬无数据，属于正常现象</div>
              <div>• 可在 server/index.js 中调整抓取逻辑</div>
            </div>
          </div>
        </div>

        <footer style={{ textAlign: 'center', marginTop: 32, padding: '14px 0',
          borderTop: '1px solid rgba(255,255,255,.04)', fontSize: 11, color: '#374151' }}>
          TrendRadar Lite · 本地抓取版 · 致敬&nbsp;
          <a href="https://github.com/sansan0/TrendRadar" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6b7280', textDecoration: 'underline' }}>TrendRadar</a>
        </footer>
        <div>
          <Test />
          <Test />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: minmax(0,1fr) 300px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
