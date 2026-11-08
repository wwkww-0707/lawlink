/* ==============================================================
   外服法务通 · js/landing.js —— 落地页渲染与交互
   --------------------------------------------------------------
   与后台演示（demo.html + render.js/app.js）共用 js/data.js
   同一事实底座，本文件只负责落地页呈现：
     ① 全局：导航 / 滚动动画 / 数字滚动
     ② 六大功能模块的 mini demo（数据全部来自 DATA）
   ============================================================== */
'use strict';

/* ---------- 小工具 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** 极简 Markdown：**加粗** 转 strong，换行转 <br> */
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

/* ==============================================================
   ① 全局：吸顶导航 / 汉堡菜单 / 滚动渐入 / 数字滚动
   ============================================================== */

/* 吸顶导航：滚过 hero 后切换为白底深字 */
const nav = $('#nav');
const navLogo = $('#nav-logo'), navTitle = $('#nav-title'), navSub = $('#nav-sub');
function onScroll() {
  const solid = window.scrollY > 60;
  nav.classList.toggle('bg-white/90', solid);
  nav.classList.toggle('backdrop-blur-md', solid);
  nav.classList.toggle('shadow-[0_1px_0_#e5e8f0]', solid);
  nav.classList.toggle('shadow-lg', solid);
  navLogo.classList.toggle('bg-brand-50', solid);
  navLogo.classList.toggle('border-brand-100', solid);
  navLogo.classList.toggle('text-brand-700', solid);
  navLogo.classList.toggle('text-white', !solid);
  navTitle.classList.toggle('text-ink', solid);
  navTitle.classList.toggle('text-white', !solid);
  navSub.classList.toggle('text-slate-400', solid);
  navSub.classList.toggle('text-white/50', !solid);
  $$('.nav-link').forEach(a => {
    a.classList.toggle('text-slate-600', solid);
    a.classList.toggle('hover:text-brand-700', solid);
    a.classList.toggle('text-white/75', !solid);
    a.classList.toggle('hover:text-white', !solid);
  });
  $('#nav-burger').classList.toggle('text-slate-700', solid);
  $('#nav-burger').classList.toggle('text-white', !solid);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* 移动端汉堡菜单开合；点击锚点后自动收起 */
const burger = $('#nav-burger'), menu = $('#nav-menu');
burger.addEventListener('click', () => menu.classList.toggle('hidden'));
$$('#nav-menu a').forEach(a => a.addEventListener('click', () => menu.classList.add('hidden')));

/* 锚点平滑滚动 */
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const el = document.querySelector(a.getAttribute('href'));
  if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}));

/* 滚动渐入：进入视口时加 .in */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
$$('.reveal').forEach(el => io.observe(el));

/* 数字滚动：进入视口后从 0 计数到目标值 */
const ioNum = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  ioNum.unobserve(e.target);
  const target = parseFloat(e.target.dataset.target);
  const dec = Number(e.target.dataset.decimals || 0);
  const t0 = performance.now(), dur = 1400;
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    e.target.textContent = (target * eased).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: 0.4 });
$$('.count-up').forEach(el => ioNum.observe(el));

/* ==============================================================
   ② mini demo 1：瞬时风控体检（匹配 DATA.riskRules）
   ============================================================== */
const RISK_LEVEL = {
  '高': { badge: 'bg-rose-600',  card: 'border-rose-200 bg-rose-50 text-rose-800', dot: 'bg-rose-500' },
  '中': { badge: 'bg-amber-500', card: 'border-amber-200 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  '低': { badge: 'bg-emerald-600', card: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' }
};

function runMiniRisk() {
  const q = $('#mini-risk-input').value.trim();
  const out = $('#mini-risk-out');
  out.innerHTML = '<div class="py-6 text-center text-[13px] text-slate-400">正在体检…</div>';
  setTimeout(() => {
    /* 与后台同一匹配规则：命中任一关键词即命中该规则 */
    const hits = (DATA.riskRules || []).filter(r => r.keys.some(k => q.includes(k)));
    if (!q) { out.innerHTML = '<div class="text-[13px] text-slate-400 text-center py-4">请先输入用工情形描述</div>'; return; }
    if (!hits.length) {
      out.innerHTML = '<div class="text-[13px] text-slate-500 text-center py-4 rounded-xl bg-slate-50 border border-slate-200">未命中已知风险规则——试试包含「试用期 / 加班 / 竞业 / 不辞而别」等关键词</div>';
      return;
    }
    out.innerHTML = hits.slice(0, 2).map(r => {
      const c = RISK_LEVEL[r.level] || RISK_LEVEL['中'];
      return `
      <div class="rounded-xl border ${c.card} p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 rounded-md ${c.badge} text-white text-[11px] font-semibold">${esc(r.level)}风险</span>
          <span class="text-[12px] opacity-60">秒级命中</span>
        </div>
        <div class="text-[14px] font-semibold leading-snug">${esc(r.title)}</div>
        <ul class="mt-2.5 space-y-1.5">
          ${(r.points || []).map(p => `<li class="flex gap-2 text-[12.5px] leading-relaxed opacity-90"><span class="${c.dot} flex-none w-[6px] h-[6px] rounded-full mt-[7px]"></span><span>${esc(p)}</span></li>`).join('')}
        </ul>
      </div>`;
    }).join('') + (hits.length > 2 ? `<div class="text-[12px] text-slate-400 text-center">另有 ${hits.length - 2} 条风险规则已命中，<a href="demo.html" class="text-brand-600 font-medium hover:underline">进入演示查看完整报告 →</a></div>` : '');
  }, 650);
}
$('#mini-risk-btn').addEventListener('click', runMiniRisk);
$('#mini-risk-input').addEventListener('keydown', e => { if (e.key === 'Enter') runMiniRisk(); });

/* ==============================================================
   ③ mini demo 2：法规属地口径比对（DATA.lawTopics · 加班费专题）
   ============================================================== */
const lawTopic = (DATA.lawTopics || []).find(t => t.id === 'overtime') || {};
const lawCities = lawTopic.cities || {};
const lawTabs = Object.keys(lawCities).slice(0, 2); /* 落地页取两个城市做对比 */

$('#mini-law-tabs').innerHTML = lawTabs.map((city, i) => `
  <button class="law-tab px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition ${i === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}" data-city="${esc(city)}">${esc(city)}</button>
`).join('');

function renderLawCity(city) {
  const c = lawCities[city] || {};
  $$('.law-tab').forEach(b => {
    const on = b.dataset.city === city;
    b.className = `law-tab px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition ${on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`;
  });
  $('#mini-law-out').innerHTML = `
    <div class="flex items-center gap-2 mb-2.5 flex-wrap">
      <span class="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[11px] font-semibold">较严格</span>
      <span class="text-[12px] text-slate-500">${esc(c.stricter || '')}口径 · 企业胜诉率约 ${c.winRate != null ? c.winRate : '--'}%</span>
    </div>
    <p class="text-[13px] text-slate-600 leading-relaxed">${esc(c.summary || '')}</p>
    <ul class="mt-3 space-y-1.5">
      ${(c.keyPoints || []).slice(0, 3).map(p => `<li class="flex gap-2 text-[12.5px] text-slate-500 leading-relaxed"><span class="text-brand-500 font-bold flex-none">✓</span><span>${esc(p)}</span></li>`).join('')}
    </ul>`;
}
$$('.law-tab').forEach(b => b.addEventListener('click', () => renderLawCity(b.dataset.city)));
if (lawTabs.length) renderLawCity(lawTabs[0]);

/* ==============================================================
   ④ mini demo 3：类案倾向与案例卡（DATA.caseTopics · 试用期专题）
   ============================================================== */
const caseTopic = (DATA.caseTopics || []).find(t => t.id === 'probation') || {};

/* 裁判倾向三色条 */
$('#mini-case-tendency').innerHTML = `
  <div class="flex items-center gap-3 flex-wrap">
    <span class="text-[12px] text-slate-400 flex-none">1,286 篇语料 · 裁判倾向</span>
    <div class="flex-1 min-w-[160px] h-2.5 rounded-full overflow-hidden flex">
      ${(caseTopic.tendency || []).map(t => `<div style="width:${t.pct}%;background:${t.color}"></div>`).join('')}
    </div>
  </div>
  <div class="flex gap-4 mt-2 flex-wrap">
    ${(caseTopic.tendency || []).map(t => `<span class="flex items-center gap-1.5 text-[12px] text-slate-500"><span class="w-2 h-2 rounded-sm" style="background:${t.color}"></span>${esc(t.name)} ${t.pct}%</span>`).join('')}
  </div>`;

/* 案例卡：点击展开裁判要点 */
const CASE_COLOR = { rose: 'border-rose-200 bg-rose-50 text-rose-700', amber: 'border-amber-200 bg-amber-50 text-amber-700', emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
$('#mini-case-list').innerHTML = (caseTopic.cases || []).slice(0, 2).map((c, i) => `
  <div class="mini-case rounded-xl border border-slate-200 bg-white overflow-hidden transition hover:shadow-md">
    <button class="mini-case-head w-full text-left px-4 py-3.5 flex items-start gap-3" data-i="${i}">
      <span class="flex-none px-2 py-0.5 rounded-md border text-[11px] font-semibold ${CASE_COLOR[c.color] || 'border-slate-200 bg-slate-50 text-slate-600'}">${esc(c.result)}</span>
      <span class="min-w-0">
        <span class="block text-[13.5px] font-semibold text-ink leading-snug">${esc(c.title)}</span>
        <span class="block text-[11.5px] text-slate-400 mt-1">${esc(c.no)} · ${esc(c.court)}</span>
      </span>
      <span class="mini-case-arrow flex-none ml-auto text-slate-300 transition-transform text-[12px]">▾</span>
    </button>
    <div class="mini-case-body hidden px-4 pb-4">
      <p class="text-[12.5px] text-slate-600 leading-relaxed">${esc(c.gist)}</p>
      <ul class="mt-2.5 space-y-1.5">
        ${(c.points || []).map(p => `<li class="flex gap-2 text-[12px] text-slate-500 leading-relaxed"><span class="text-brand-500 font-bold flex-none">›</span><span>${esc(p)}</span></li>`).join('')}
      </ul>
    </div>
  </div>`).join('');

$$('.mini-case-head').forEach(h => h.addEventListener('click', () => {
  const body = h.parentElement.querySelector('.mini-case-body');
  const arrow = h.querySelector('.mini-case-arrow');
  const open = !body.classList.contains('hidden');
  body.classList.toggle('hidden', open);
  arrow.style.transform = open ? '' : 'rotate(180deg)';
}));

/* ==============================================================
   ⑤ mini demo 4：智能咨询对话（DATA.chatQuick / chatFlows）
   ============================================================== */
const chatLog = $('#mini-chat-log');

function pushBubble(side, html, extra = '') {
  chatLog.insertAdjacentHTML('beforeend', `
    <div class="flex ${side === 'user' ? 'justify-end' : 'justify-start'}">
      <div class="${side === 'user'
        ? 'bg-brand-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[85%]'
        : 'bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[92%] shadow-sm'}">
        <div class="text-[13px] leading-relaxed">${html}</div>
        ${extra}
      </div>
    </div>`);
  chatLog.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function askAI(q) {
  pushBubble('user', esc(q));
  /* 打字指示 */
  const tid = 'typing-' + Date.now();
  chatLog.insertAdjacentHTML('beforeend', `
    <div class="flex justify-start" id="${tid}">
      <div class="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1.5 items-center">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style="animation-delay:.15s"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style="animation-delay:.3s"></span>
      </div>
    </div>`);
  setTimeout(() => {
    $('#' + tid)?.remove();
    const hit = (DATA.chatFlows || []).find(f => f.match.some(k => q.includes(k)));
    const a = hit || DATA.chatDefault || {};
    const conf = a.confidence || 0;
    const confCls = conf >= 85 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
    const extra = `
      <div class="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
        <span class="px-1.5 py-0.5 rounded ${confCls} text-[10.5px] font-semibold">置信度 ${conf}%</span>
        ${(a.basis || []).slice(0, 2).map(b => `<span class="text-[10.5px] text-slate-400">依据 · ${esc(b)}</span>`).join('')}
        ${hit && hit.complex ? '<span class="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10.5px] font-semibold">已识别为高价值需求 · 建议直连专家</span>' : ''}
      </div>`;
    pushBubble('ai', md(a.answer || ''), extra);
  }, 900);
}

$('#mini-chat-quick').innerHTML = (DATA.chatQuick || []).map(q => `
  <button class="chat-quick px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[12px] text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition">${esc(q)}</button>
`).join('');
$$('.chat-quick').forEach(b => b.addEventListener('click', () => askAI(b.textContent)));

/* 首条欢迎语 */
pushBubble('ai', '你好，我是外服法务通智能顾问。试着点下方的问题，看看我怎么回答 👇');

/* ==============================================================
   ⑥ mini demo 5：报告生成（进度模拟 + 纸面预览）
   ============================================================== */
const REPORT_STEPS = ['汇总咨询记录…', '抓取属地口径…', '匹配类案倾向…', '测算赔偿金额…', '排版生成纸面…'];

$('#mini-report-btn').addEventListener('click', () => {
  const btn = $('#mini-report-btn'), bar = $('#mini-report-bar'), pct = $('#mini-report-pct'), out = $('#mini-report-out');
  btn.disabled = true; btn.classList.add('opacity-60');
  let p = 0;
  const timer = setInterval(() => {
    p = Math.min(p + Math.ceil(Math.random() * 14 + 6), 100);
    bar.style.width = p + '%';
    pct.textContent = p + '%';
    if (p >= 100) {
      clearInterval(timer);
      out.innerHTML = `
        <div class="rounded-xl border border-slate-200 bg-white shadow-sm p-5 report-paper">
          <div class="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
            <div>
              <div class="text-[15px] font-bold text-ink">解除操作风险评估报告（AI 草案）</div>
              <div class="text-[11px] text-slate-400 mt-1">对象：试用期考核不合格解除 · 属地：广东省广州市</div>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-semibold">高风险</span>
          </div>
          <div class="mt-3 space-y-2.5">
            <div class="text-[12.5px] text-slate-600 leading-relaxed"><strong class="text-ink">案情摘要：</strong>${esc((DATA.riskRules[0] || {}).title || '')}，现有证据链存在多处缺口。</div>
            <div class="text-[12.5px] text-slate-600 leading-relaxed"><strong class="text-ink">属地指引：</strong>${esc(lawCities['广州市'] ? lawCities['广州市'].summary.slice(0, 60) + '…' : '')}</div>
            <div class="text-[12.5px] text-slate-600 leading-relaxed"><strong class="text-ink">类案倾向：</strong>同类案件 68% 认定违法解除，平均判付二倍经济补偿标准赔偿金。</div>
          </div>
          <div class="mt-3 pt-3 border-t border-dashed border-slate-200 text-[10.5px] text-slate-400 leading-relaxed">
            AI 生成草案 · 须执业律师复核签发后生效 · 依据《劳动合同法》第 21 / 39 / 87 条
          </div>
        </div>`;
      btn.disabled = false; btn.classList.remove('opacity-60');
    }
  }, 220);
});

/* ==============================================================
   ⑦ mini demo 6：专家库 + 服务闭环（DATA.experts / flowSteps）
   ============================================================== */
$('#mini-expert-list').innerHTML = (DATA.experts || []).slice(0, 4).map(e => `
  <div class="rounded-xl border border-slate-200 bg-white p-3.5 transition hover:shadow-md hover:border-brand-200">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[12px] font-semibold flex items-center justify-center flex-none">${esc(e.name[0])}</div>
      <div class="min-w-0 leading-tight">
        <div class="text-[13.5px] font-semibold text-ink truncate">${esc(e.name)}</div>
        <div class="text-[11px] text-slate-400 truncate">${esc(e.role)}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 mt-2.5 text-[11px]">
      <span class="text-amber-500 font-semibold">★ ${e.score}</span>
      <span class="text-slate-400">${e.years} 年</span>
      <span class="text-slate-400">· ${e.orders} 单</span>
      <span class="ml-auto text-emerald-600 font-semibold">好评 ${e.pct}%</span>
    </div>
  </div>`).join('');

/* 服务闭环流程条 */
const FLOW_ICON = { done: '✓', now: '●', todo: '' };
$('#mini-flow').innerHTML = `
  <div class="text-[11px] text-slate-400 mb-2.5">服务闭环</div>
  <div class="flex items-center justify-between gap-1">
    ${(DATA.flowSteps || []).map((s, i) => `
      <div class="flex items-center ${i < (DATA.flowSteps || []).length - 1 ? 'flex-1' : 'flex-none'}">
        <div class="flex flex-col items-center gap-1.5 flex-none">
          <span class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold
            ${s.state === 'done' ? 'bg-emerald-100 text-emerald-600' : s.state === 'now' ? 'bg-brand-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,.15)]' : 'bg-slate-100 text-slate-400'}">${FLOW_ICON[s.state] || s.step}</span>
          <span class="text-[10px] ${s.state === 'now' ? 'text-brand-700 font-semibold' : 'text-slate-400'}">${esc(s.title)}</span>
        </div>
        ${i < (DATA.flowSteps || []).length - 1 ? `<div class="flex-1 h-[2px] mx-1 -mt-5 ${s.state === 'done' ? 'bg-emerald-200' : 'bg-slate-100'}"></div>` : ''}
      </div>`).join('')}
  </div>`;

/* ==============================================================
   ⑧ 三道防线 / 评测指标 / 可复用资产 / 里程碑（静态区块渲染）
   ============================================================== */
$('#guard-list').innerHTML = (DATA.defenses || []).map(d => `
  <div class="reveal rounded-2xl bg-white border border-[#e5e8f0] p-6 transition hover:shadow-lg hover:-translate-y-1">
    <div class="flex items-center justify-between mb-3">
      <span class="text-[28px] font-bold text-brand-100 leading-none">${esc(d.no)}</span>
      <span class="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[11px] font-semibold">${esc(d.tag)}</span>
    </div>
    <div class="text-[16px] font-semibold text-ink">${esc(d.title)}</div>
    <p class="mt-2.5 text-[13px] text-slate-500 leading-relaxed">${esc(d.desc)}</p>
  </div>`).join('');

$('#metric-list').innerHTML = (DATA.metrics || []).map(m => `
  <div class="reveal rounded-2xl border border-[#e5e8f0] p-5 transition hover:shadow-md">
    <div class="text-[13px] text-slate-500">${esc(m.name)}</div>
    <div class="mt-2 flex items-baseline gap-2">
      <span class="text-[24px] font-bold ${m.ok ? 'text-emerald-600' : 'text-rose-600'}">${esc(m.actual)}</span>
      <span class="text-[11px] text-slate-400">目标 ${esc(m.target)}</span>
    </div>
    <div class="mt-2 text-[11px] text-slate-400">${esc(m.note)}</div>
    ${m.ok ? '<div class="mt-3 h-1.5 rounded-full bg-emerald-100 overflow-hidden"><div class="h-full w-[92%] bg-emerald-500 rounded-full"></div></div>' : ''}
  </div>`).join('');

$('#skill-list').innerHTML = (DATA.skills || []).map(s => `
  <div class="reveal rounded-2xl bg-[#f6f8fc] border border-[#e3e9f5] p-5 flex gap-4 transition hover:shadow-md">
    <span class="flex-none px-2 py-0.5 self-start rounded-md bg-violet-100 text-violet-700 text-[11px] font-semibold mt-0.5">${esc(s.tag)}</span>
    <div>
      <div class="text-[14.5px] font-semibold text-ink">${esc(s.name)}</div>
      <p class="mt-1.5 text-[12.5px] text-slate-500 leading-relaxed">${esc(s.desc)}</p>
    </div>
  </div>`).join('');

$('#milestone-list').innerHTML = (DATA.milestones || []).map(m => `
  <div class="reveal rounded-2xl bg-white border ${m.now ? 'border-brand-300 shadow-[0_0_0_4px_rgba(37,99,235,.08)]' : 'border-[#e5e8f0]'} p-4 transition hover:shadow-md">
    <div class="flex items-center justify-between mb-2">
      <span class="text-[11px] font-semibold ${m.done ? 'text-emerald-600' : m.now ? 'text-brand-600' : 'text-slate-400'}">${esc(m.id)}</span>
      ${m.done ? '<span class="text-emerald-500 text-[13px]">✓</span>' : m.now ? '<span class="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>' : '<span class="w-2 h-2 rounded-full bg-slate-200"></span>'}
    </div>
    <div class="text-[13.5px] font-semibold text-ink leading-snug">${esc(m.title)}</div>
    <div class="text-[11px] text-slate-400 mt-1">${esc(m.date)}</div>
    <p class="mt-2 text-[11.5px] text-slate-500 leading-relaxed">${esc(m.desc)}</p>
  </div>`).join('');

/* 新渲染的静态区块同样纳入滚动渐入 */
$$('#guard-list .reveal, #metric-list .reveal, #skill-list .reveal, #milestone-list .reveal').forEach(el => io.observe(el));
