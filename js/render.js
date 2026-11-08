/* ==============================================================
   外服法务通 · js/render.js —— ② RENDER 渲染函数区
   把 DATA 画到页面上；依赖 data.js（先于本文件加载）
   ============================================================== */

/* ==============================================================
   ② RENDER —— 渲染函数区
   ============================================================== */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/* 小工具：生成内联 SVG 图标 */
function icon(path, size) {
  const s = size || 16;
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/* 小工具：风险等级配色 */
const LEVEL_STYLE = {
  '高': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
  '中': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
  '低': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' }
};

/* ---------- 工作台 ---------- */
function renderDashboard() {
  // KPI 卡片
  $('#kpi-row').innerHTML = DATA.kpi.map((k, i) => `
    <div class="rise rounded-2xl bg-white border border-[#e5e8f0] p-5 shadow-[0_1px_2px_rgba(16,24,40,.04)]" style="animation-delay:${i * 0.05}s">
      <div class="flex items-center justify-between">
        <span class="text-[12px] text-slate-500">${k.label}</span>
        <span class="text-[11px] font-medium ${k.up ? 'text-emerald-600' : 'text-brand-600'}">${k.delta}</span>
      </div>
      <div class="mt-3 flex items-baseline gap-1">
        <span class="text-[27px] font-semibold tracking-tight leading-none">${k.value}</span>
        <span class="text-[12px] text-slate-400">${k.unit}</span>
      </div>
      <div class="text-[11px] text-slate-400 mt-2">${k.hint}</div>
    </div>`).join('');

  // 趋势图（纯 CSS 柱状 + 折线点）
  const max = Math.max.apply(null, DATA.trend.map(t => t.count));
  $('#trend-chart').innerHTML = DATA.trend.map((t, i) => `
    <div class="flex-1 flex flex-col items-center justify-end h-full gap-2">
      <span class="text-[11px] text-slate-400">${t.count}</span>
      <div class="w-full rounded-t-md bg-gradient-to-t from-brand-100 to-brand-400 rise"
           style="height:${Math.round((t.count / max) * 118)}px;animation-delay:${i * 0.05}s"></div>
      <div class="w-full h-[3px] rounded-full bg-sky-400" style="opacity:${t.rate / 100}"></div>
      <span class="text-[11px] text-slate-400">${t.day}</span>
    </div>`).join('');

  // 分流结构
  $('#split-list').innerHTML = DATA.split.map(s => `
    <div>
      <div class="flex items-center justify-between text-[13px] mb-2">
        <span class="text-slate-600">${s.name}</span>
        <span class="font-semibold">${s.pct}%</span>
      </div>
      <div class="stat-bar"><i style="width:${s.pct}%;background:${s.color}"></i></div>
    </div>`).join('');

  // 三道防线 · 人工审核机制
  $('#defense-list').innerHTML = DATA.defenses.map(d => `
    <div class="rounded-xl border border-[#eef1f7] hover:border-rose-200 transition p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-6 h-6 rounded-lg bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">${d.no}</span>
        <span class="text-[13.5px] font-medium">${d.title}</span>
        <span class="tag bg-rose-50 text-rose-600 border border-rose-100 ml-auto">${d.tag}</span>
      </div>
      <p class="text-[12.5px] leading-6 text-slate-500">${d.desc}</p>
    </div>`).join('');

  renderTodos();
}

function renderTodos() {
  $('#todo-count').textContent = `共 ${DATA.todos.length} 条`;
  $('#todo-list').innerHTML = DATA.todos.map(t => {
    const L = LEVEL_STYLE[t.level];
    return `
    <div class="rounded-xl border border-[#eef1f7] hover:border-brand-200 hover:bg-brand-50/30 p-3 cursor-pointer transition group">
      <div class="flex items-start gap-2">
        <span class="w-[7px] h-[7px] rounded-full ${L.dot} mt-[6px] flex-none"></span>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-medium text-ink truncate group-hover:text-brand-700">${t.title}</div>
          <div class="text-[11px] text-slate-400 mt-1">${t.client} · ${t.city}</div>
          <div class="flex items-center gap-2 mt-2">
            <span class="tag ${L.bg} ${L.text} border ${L.border}">${t.level}风险</span>
            <span class="text-[11px] text-slate-400">${t.expert}</span>
            <span class="ml-auto text-[11px] text-slate-300">${t.time}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ---------- 瞬时风控体检 ---------- */
function runRiskCheck() {
  const q = $('#risk-input').value.trim();
  const rule = DATA.riskRules.find(r => r.keys.some(k => q.indexOf(k) >= 0)) || DATA.riskRules[0];
  const L = LEVEL_STYLE[rule.level];
  const box = $('#risk-result');

  box.innerHTML = `<div class="flex items-center gap-2 text-[13px] text-slate-400 py-6 justify-center">
      <span class="typing"><i></i><i></i><i></i></span> 正在比对属地政策库与类案裁判倾向…
    </div>`;

  setTimeout(() => {
    box.innerHTML = `
      <div class="rounded-xl border ${L.border} ${L.bg} p-5 rise">
        <div class="flex items-center gap-3">
          <span class="tag ${L.bg} ${L.text} border ${L.border} text-[13px] px-3 py-1.5">${rule.level}风险</span>
          <h4 class="font-semibold text-[15px] ${L.text}">${rule.title}</h4>
          <span class="ml-auto text-[11px] text-slate-400">识别耗时 0.9s · 依据 512 城政策库</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
          <div>
            <div class="text-[12px] font-semibold text-slate-500 mb-2">主要风险点</div>
            <ul class="space-y-2">
              ${rule.points.map(p => `<li class="flex gap-2 text-[13px] leading-6 text-slate-700"><span class="text-slate-300 mt-[3px]">${icon('<path d="M5 12l4 4L19 6"/>', 13)}</span><span>${p}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="text-[12px] font-semibold text-slate-500 mb-2">法规依据</div>
            <div class="flex flex-wrap gap-2">
              ${rule.basis.map(b => `<span class="tag bg-white text-slate-600 border border-[#e5e8f0]">${b}</span>`).join('')}
            </div>
          </div>
          <div>
            <div class="text-[12px] font-semibold text-slate-500 mb-2">处置建议</div>
            <p class="text-[13px] leading-6 text-slate-700">${rule.advice}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-4 rounded-lg bg-slate-50 border border-[#e5e8f0] px-3 py-2">
          <span class="text-slate-400 flex-none">${icon('<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/>', 13)}</span>
          <span class="text-[11.5px] text-slate-500 leading-5"><b class="text-slate-600">人工审核点：</b>本结论为 AI 初步判断（置信度 93%），正式处置前须经执业律师复核；${rule.level === '高' ? '高危情形<b class="text-rose-600">强制专家复核</b>后方可执行。' : '复核通过后方可对外引用。'}</span>
        </div>

        <div class="flex flex-wrap gap-3 mt-4 pt-4 border-t ${L.border}">
          <button class="h-9 px-4 rounded-lg bg-white border border-[#e5e8f0] text-[13px] text-slate-600 hover:border-brand-300 hover:text-brand-700 transition" data-risk-jump="report">一键生成分析报告</button>
          <button class="h-9 px-4 rounded-lg bg-white border border-[#e5e8f0] text-[13px] text-slate-600 hover:border-brand-300 hover:text-brand-700 transition" data-risk-jump="experts">转专家深度评估</button>
          <button class="h-9 px-4 rounded-lg bg-white border border-[#e5e8f0] text-[13px] text-slate-600 hover:border-brand-300 hover:text-brand-700 transition" data-risk-jump="law">查看属地适用指引</button>
        </div>
      </div>`;
  }, 620);
}

/* ---------- 智能法规查询（按提问关键词命中专题，再叠加属地口径） ---------- */
let lawCity = '广州市';
let lawTopic = DATA.lawTopics[0];   // 当前命中专题
let lawHits = [];                   // 本次命中的关键词
let lawAutoCity = '';               // 本次是否由提问中的城市名自动切换
let lawLastQuery = '';              // 上次查询文本，用于判断是否为「新一次查询」
let rptPaperCity = '';              // 报告纸面生成时所用的用工所在地（用于提示「所在地已变更」）

/* 按城市名取城市库记录 */
function cityInfo(name) {
  return DATA.lawCityLib.filter(c => c.n === name)[0] || { n: name, p: '其他地区', py: '' };
}

/* 输入关键词过滤城市：中文包含 / 拼音首字母 / 省份 */
function filterCities(kw) {
  const s = (kw || '').trim().toLowerCase();
  if (!s) return DATA.lawCityLib.slice();
  return DATA.lawCityLib.filter(c =>
    c.n.indexOf(s) >= 0 || c.py.indexOf(s) === 0 || c.py.indexOf(s) >= 0 || c.p.indexOf(s) >= 0);
}

/* 从一段自然语言里识别城市名（用于“直接查询”：提问里带城市就自动切换所在地） */
function detectCity(q) {
  if (!q) return null;
  let hit = null;
  DATA.lawCityLib.forEach(c => {
    const short = c.n.replace(/市$/, '');
    if (q.indexOf(c.n) >= 0 || (short.length >= 2 && q.indexOf(short) >= 0)) {
      if (!hit || c.n.length > hit.length) hit = c.n;
    }
  });
  return hit;
}

/* 属地口径解析：有精编指引直接用，否则按省级画像推定（并显性标注为推定） */
function resolveCityScope(name, topic) {
  const edited = topic.cities ? topic.cities[name] : null;
  if (edited) return Object.assign({ edited: true }, edited);

  const info = cityInfo(name);
  const prof = DATA.lawProvinceProfiles[info.p] || { s: '适中', w: 39, trait: '以国家法统一口径适用为主', focus: '国家法统一适用' };
  return {
    edited: false,
    scope: info.p + ' · ' + name + '（省级画像推定）',
    stricter: prof.s,
    winRate: prof.w,
    summary: '【模型推定】尚未收录 ' + name + '（' + info.p + '）的「' + topic.title + '」精编属地指引。'
      + '基于 ' + info.p + ' 省级裁审画像，该地区审查尺度为「' + prof.s + '」，重点审查方向为「' + prof.focus + '」；' + prof.trait + '。'
      + '本条口径由省级画像模型推定生成，需经当地最新裁审文件原文核实后，方可用于对外正式意见。',
    keyPoints: [
      '属地重点：' + prof.focus,
      info.p + '区域特征：' + prof.trait,
      '国家法统一要求同样适用，具体条文见右下「法条依据」栏（全国通用）'
    ],
    diffNote: '该城市暂无精编指引，当前展示为省级画像推定结果。正式版将接入当地裁审文件全文库核实。'
  };
}

/* 属地口径档位：精编指引 or 省级画像推定（报告页与查询页共用同一判定） */
function cityTier(name) {
  return DATA.lawFullCities.indexOf(name) >= 0
    ? { label: '精编属地指引', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' }
    : { label: '省级画像推定 · 待原文核实', cls: 'bg-amber-50 text-amber-700 border border-amber-100' };
}

/* 渲染城市选择器：法规查询页 + 报告页共用同一「用工所在地」状态。
   当前城市标签 / 收录数量 / 热门城市快捷片 / 属地口径档位 */
function renderCityPicker() {
  $('#law-city-cur').textContent = lawCity;
  $('#law-city-count').textContent = DATA.lawCityLib.length;
  $('#law-hot').innerHTML = DATA.lawHotCities.map(c => `
    <span class="chip px-3 py-1 rounded-full ${c === lawCity ? 'is-on' : ''}" data-law-city="${c}">${c}</span>`).join('');

  // 报告页选择器（DOM 不存在时跳过，便于局部复用）
  if (!$('#rpt-city-cur')) return;
  const tier = cityTier(lawCity);
  const stale = rptPaperCity && rptPaperCity !== lawCity;
  $('#rpt-city-cur').textContent = lawCity;
  $('#rpt-city-count').textContent = DATA.lawCityLib.length;
  $('#rpt-city-tier').textContent = tier.label;
  $('#rpt-city-tier').className = 'tag ' + tier.cls;
  $('#rpt-city-hint').textContent = stale ? '所在地已变更 · 请重新生成本报告' : '与「智能法规查询」所在地联动';
  $('#rpt-city-hint').className = stale ? 'text-[11px] text-amber-600 font-medium' : 'text-[11px] text-slate-400';
}

/* 城市候选下拉的 HTML（两个选择器共用同一份渲染，避免逻辑分叉） */
function cityDropHTML(kw) {
  const s = (kw || '').trim();
  let list;
  if (!s) {
    const hot = DATA.lawHotCities.map(cityInfo);
    const rest = DATA.lawCityLib.filter(c => DATA.lawHotCities.indexOf(c.n) < 0);
    list = hot.concat(rest);
  } else {
    list = filterCities(s).slice(0, 40);
  }
  return list.length ? list.map(c => `
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${c.n === lawCity ? 'bg-brand-50/70' : 'hover:bg-slate-50'}" data-law-city="${c.n}">
      <span class="text-[13px] ${c.n === lawCity ? 'font-semibold text-brand-700' : 'text-slate-700'}">${c.n}</span>
      <span class="tag bg-slate-100 text-slate-500">${c.p}</span>
      ${DATA.lawFullCities.indexOf(c.n) >= 0 ? '<span class="tag bg-emerald-50 text-emerald-700 border border-emerald-100">精编指引</span>' : ''}
      <span class="ml-auto text-[11px] text-slate-300">${c.py.toUpperCase()}</span>
    </div>`).join('')
    : `<div class="px-3 py-4 text-[12.5px] text-slate-400 leading-6">
         未匹配到「${esc(s)}」。当前收录 ${DATA.lawCityLib.length} 个主要用工城市，可尝试输入省份（如「江苏」）或拼音首字母（如「sz」）。
       </div>`;
}

/* 展开城市候选下拉：无关键词时置顶热门城市，其余按城市库顺序 */
function openCityDrop(kw) {
  $('#law-city-drop').innerHTML = cityDropHTML(kw);
  $('#law-city-drop').classList.remove('hidden');
}

/* 报告页的候选下拉 */
function openReportCityDrop(kw) {
  const drop = $('#rpt-city-drop');
  if (!drop) return;
  drop.innerHTML = cityDropHTML(kw);
  drop.classList.remove('hidden');
}

/* 收起全部城市下拉（含报告页） */
function closeCityDrops() {
  ['#law-city-drop', '#rpt-city-drop'].forEach(sel => {
    const el = $(sel);
    if (el) el.classList.add('hidden');
  });
}

/* 选定城市：更新状态并刷新指引（查询页与报告页共用同一所在地） */
function selectCity(name) {
  lawCity = name;
  lawAutoCity = '';
  const li = $('#law-city-input');
  const ri = $('#rpt-city-input');
  if (li) li.value = '';
  if (ri) ri.value = '';
  closeCityDrops();
  renderCityPicker();
  renderLaw();
}

/* HTML 转义，避免用户输入被当作标签渲染 */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* 关键词命中：命中关键词越长得分越高，取最高分专题 */
function matchLawTopic(q) {
  const s = (q || '').trim();
  if (!s) return null;
  let best = null, bestScore = 0, bestHits = [];
  DATA.lawTopics.forEach(t => {
    let score = 0;
    const hits = [];
    t.keys.forEach(k => { if (s.indexOf(k) >= 0) { score += k.length; hits.push(k); } });
    if (s.indexOf(t.title) >= 0) score += t.title.length;
    if (score > bestScore) { bestScore = score; best = t; bestHits = hits; }
  });
  if (!best) return null;
  // 匹配度：按命中得分归一化到 82—98%，模拟检索引擎的相关度
  const pct = Math.min(98, 82 + bestScore * 2);
  return { topic: best, hits: bestHits, score: bestScore, pct: pct };
}

/* 未命中 / 空输入时的引导态 */
function renderLawMiss(q, empty) {
  $('#law-scope').textContent = empty ? '等待输入' : '未命中专题库';
  $('#law-diff-topic').textContent = '';
  $('#law-summary').innerHTML = `
    <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-amber-600 flex-none">${icon('<path d="M12 9v4M12 16.5v.2M10.3 3.9L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>', 16)}</span>
        <span class="text-[13.5px] font-semibold text-amber-800">
          ${empty ? '请输入要查询的用工问题' : '未命中专题库：' + esc(q)}
        </span>
      </div>
      <p class="text-[13px] leading-6 text-amber-900">
        当前演示专题库覆盖以下 5 类高频用工问题，点击即可查询：
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        ${DATA.lawTopics.map(t => `<span class="chip px-3 py-1.5 rounded-full text-[12.5px] bg-white" data-law-quick="${t.title}">${t.title}</span>`).join('')}
      </div>
      <p class="text-[12px] text-amber-700/80 mt-3">提示：本原型为演示环境，仅内置上述专题；正式版将接入 512 城政策库全文检索。</p>
    </div>`;
  $('#law-diff').innerHTML = '';
  $('#law-articles').innerHTML = '';
  $('#law-checklist').innerHTML = '';
  updateLawProgress();
}

function renderLaw() {
  const q = $('#law-query').value.trim();

  // 仅当提问内容变化时重新识别城市；单纯切换所在地时保留人工选择
  const isNewQuery = q !== lawLastQuery;
  lawLastQuery = q;

  // 空输入 → 引导态
  if (!q) { lawAutoCity = ''; renderLawMiss('', true); return; }

  // 关键词命中专题；未命中 → 引导态
  const m = matchLawTopic(q);
  if (!m) { lawAutoCity = ''; renderLawMiss(q, false); return; }

  // 「直接查询」：提问里带城市名时自动切换用工所在地
  if (isNewQuery) {
    const auto = detectCity(q);
    if (auto && auto !== lawCity) { lawCity = auto; lawAutoCity = auto; renderCityPicker(); }
    else { lawAutoCity = ''; }
  }

  lawTopic = m.topic;
  lawHits = m.hits;
  const cities = lawTopic.cities;
  const d = resolveCityScope(lawCity, lawTopic);
  $('#law-scope').textContent = d.scope;
  $('#law-diff-topic').textContent = '当前专题 · ' + lawTopic.title;

  // ① 命中提示 + 结论摘要
  $('#law-summary').innerHTML = `
    <div class="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="tag bg-brand-600 text-white text-[11px]">已命中专题</span>
        <span class="text-[13.5px] font-semibold text-brand-900">${lawTopic.title}</span>
        <span class="ml-auto text-[11.5px] text-slate-500 max-w-[46%] truncate">提问：${esc(q)}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-2.5">
        <span class="text-[11.5px] text-slate-500">命中关键词</span>
        ${lawHits.map(h => `<span class="tag bg-white text-brand-700 border border-brand-100">${esc(h)}</span>`).join('')}
        <span class="tag bg-white text-slate-600 border border-brand-100">${icon('<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', 12)} ${lawCity}</span>
        ${lawAutoCity ? `<span class="tag bg-emerald-50 text-emerald-700 border border-emerald-100">已按提问自动切换所在地 → ${lawAutoCity}</span>` : ''}
        <span class="ml-auto text-[11.5px] text-slate-400">匹配度 ${m.pct}% · 检索耗时 0.7s · 覆盖 ${DATA.lawCityLib.length} 城属地口径</span>
      </div>
    </div>

    <div class="rounded-xl ${d.edited ? 'bg-brand-50 border-brand-100' : 'bg-amber-50/50 border-amber-100'} border p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="tag ${d.edited ? 'bg-white text-brand-700 border-brand-100' : 'bg-white text-amber-700 border-amber-200'}">
          ${icon('<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/>', 13)}
          ${d.edited ? '本地化适用指引' : '省级画像推定 · 待原文核实'}
        </span>
        <span class="tag bg-white text-slate-600 border border-[#e5e8f0]">审查尺度 · ${d.stricter}</span>
        <span class="ml-auto text-[12px] ${d.edited ? 'text-brand-700' : 'text-amber-700'}">同类案件企业胜诉参考率 ${d.winRate}%</span>
      </div>
      <p class="text-[13.5px] leading-7 ${d.edited ? 'text-brand-900' : 'text-amber-900'}">${d.summary}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      ${d.keyPoints.map((p, i) => `
        <div class="rounded-xl border border-[#e5e8f0] p-4">
          <div class="text-[12px] font-semibold text-brand-600 mb-2">要点 ${i + 1}</div>
          <p class="text-[13px] leading-6 text-slate-600">${p}</p>
        </div>`).join('')}
    </div>

    <div class="rounded-xl border border-amber-100 bg-amber-50/60 p-4 flex gap-3">
      <span class="text-amber-600 flex-none mt-[1px]">${icon('<path d="M12 9v4M12 16.5v.2M10.3 3.9L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>', 16)}</span>
      <div>
        <div class="text-[12px] font-semibold text-amber-700 mb-1">属地差异提示</div>
        <p class="text-[13px] leading-6 text-amber-900">${d.diffNote}</p>
      </div>
    </div>`;

  // ② 同题差异速览：6 个精编城市 + 当前城市（若不在其中则置顶）
  const order = DATA.lawFullCities.slice();
  if (order.indexOf(lawCity) < 0) order.unshift(lawCity);
  $('#law-diff').innerHTML = order.map(c => {
    const x = resolveCityScope(c, lawTopic);
    const on = c === lawCity;
    return `
      <div class="rounded-xl border ${on ? 'border-brand-300 bg-brand-50/50' : 'border-[#eef1f7]'} p-3 cursor-pointer transition hover:border-brand-200" data-law-city="${c}">
        <div class="flex items-center gap-2">
          <span class="text-[13px] font-medium ${on ? 'text-brand-700' : 'text-slate-700'}">${c}</span>
          <span class="tag ${x.stricter === '严格' || x.stricter === '较严格' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-500'}">${x.stricter}</span>
          ${x.edited ? '' : '<span class="tag bg-amber-50 text-amber-700 border border-amber-100">推定</span>'}
          <span class="ml-auto text-[12px] font-semibold text-slate-600">${x.winRate}%</span>
        </div>
        <div class="stat-bar mt-2"><i style="width:${x.winRate}%;background:${on ? '#2563eb' : '#cbd5e1'}"></i></div>
      </div>`;
  }).join('');

  // ③ 法条依据（跟随专题切换）
  $('#law-articles').innerHTML = lawTopic.articles.map(a => `
    <div class="rounded-xl border border-[#eef1f7] p-4 hover:border-brand-200 transition">
      <div class="text-[13px] font-semibold text-brand-700 mb-2">${a.code}</div>
      <p class="text-[13px] leading-6 text-slate-600">${a.text}</p>
    </div>`).join('');

  // ④ 实操清单（跟随专题切换）
  $('#law-checklist').innerHTML = lawTopic.checklist.map(c => `
    <label class="flex items-start gap-3 rounded-xl border border-[#eef1f7] p-3 cursor-pointer hover:border-brand-200 hover:bg-brand-50/30 transition">
      <input type="checkbox" class="law-check mt-1 w-[15px] h-[15px] accent-brand-600" />
      <span class="text-[13px] leading-6 text-slate-700">${c}</span>
    </label>`).join('');
  updateLawProgress();
}

function updateLawProgress() {
  const all = $$('.law-check');
  const done = all.filter(c => c.checked).length;
  $('#law-progress').textContent = all.length ? `已完成 ${done} / ${all.length}` : '';
}

/* ---------- 类案检索智库（按检索词命中专题 → 输出倾向预判 + 类案清单） ---------- */
let caseYear = '全部';
let caseLevel = '全部';
let caseTopic = DATA.caseTopics[0];
let caseHits = [];
let caseLastQuery = '';
let caseList = [];                 // 当前筛选结果，供展开 / 引用 / 复制定位
let caseTopicId = '';              // 上次渲染的专题 id，用于判断「是否换专题 → 重置筛选」

/* 法院层级展示标签 */
const CASE_LEVEL_LABEL = {
  '最高人民法院': '最高院',
  '高级人民法院': '高院',
  '中级人民法院': '中院',
  '基层人民法院': '基层院'
};

/* 渲染筛选条：选项与命中数均取自当前专题的真实数据，
   只列出该专题实际存在的年份与层级，避免出现「点了没反应」的死选项 */
function renderCaseFilters() {
  const all = caseTopic.cases;
  const years = ['全部'].concat(
    Array.from(new Set(all.map(c => c.year))).sort((a, b) => b - a));
  const levels = ['全部'].concat(
    Object.keys(CASE_LEVEL_LABEL).filter(k => all.some(c => c.level === k)));

  const cnt = (type, key) => key === '全部'
    ? all.length
    : all.filter(c => (type === 'year' ? c.year === key : c.level === key)).length;

  // 年份片（“全部”显示总篇数，其余显示该年份命中数）
  $('#case-years').innerHTML = years.map(y => `
    <span class="chip px-3 py-1 rounded-full ${y === caseYear ? 'is-on' : ''}" data-case-year="${y}">
      ${y === '全部' ? '全部' : y + ' 年'}<span class="chip-n">${cnt('year', y)}</span>
    </span>`).join('');

  // 层级片
  $('#case-levels').innerHTML = levels.map(l => `
    <span class="chip px-3 py-1 rounded-full ${l === caseLevel ? 'is-on' : ''}" data-case-level="${l}">
      ${l === '全部' ? '全部' : CASE_LEVEL_LABEL[l]}<span class="chip-n">${cnt('level', l)}</span>
    </span>`).join('');
}

function renderCases() {
  const q = $('#case-query').value.trim();

  if (!q) { caseLastQuery = q; renderCaseMiss('', true); return; }

  const m = matchCaseTopic(q);
  if (!m) { caseLastQuery = q; renderCaseMiss(q, false); return; }

  // 换专题时重置年份 / 层级筛选，避免带着上一个专题的筛选条件导致「筛选后为空」
  if (m.topic.id !== caseTopicId) {
    caseTopicId = m.topic.id;
    caseYear = '全部';
    caseLevel = '全部';
  }

  caseTopic = m.topic;
  caseHits = m.hits;
  caseLastQuery = q;

  // ① 命中提示条
  $('#case-hit').innerHTML = `
    <div class="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="tag bg-brand-600 text-white text-[11px]">已命中专题</span>
        <span class="text-[13.5px] font-semibold text-brand-900">${caseTopic.title}</span>
        <span class="ml-auto text-[11.5px] text-slate-500 max-w-[46%] truncate">检索：${esc(q)}</span>
      </div>
      <div class="flex flex-wrap items-center gap-2 mt-2.5">
        <span class="text-[11.5px] text-slate-500">命中关键词</span>
        ${caseHits.map(h => `<span class="tag bg-white text-brand-700 border border-brand-100">${esc(h)}</span>`).join('')}
        <span class="ml-auto text-[11.5px] text-slate-400">相关度 ${m.pct}% · 检索耗时 0.9s · 语料库命中 ${caseTopic.corpus.toLocaleString()} 份</span>
      </div>
    </div>`;

  // ② 倾向预判（随专题变化）
  $('#case-topic').textContent = caseTopic.title;
  $('#case-corpus').textContent = caseTopic.corpus.toLocaleString();
  const maxPct = Math.max.apply(null, caseTopic.tendency.map(t => t.pct));
  $('#case-tendency').innerHTML = caseTopic.tendency.map(t => `
    <div>
      <div class="flex items-center justify-between text-[13px] mb-2">
        <span class="text-slate-600">${t.name}</span>
        <span class="font-semibold" style="color:${t.color}">${t.pct}%</span>
      </div>
      <div class="stat-bar"><i style="width:${(t.pct / maxPct) * 100}%;background:${t.color}"></i></div>
    </div>`).join('');
  $('#case-gist').textContent = caseTopic.gist;

  // ③ 筛选条（选项与命中数随专题动态生成）
  renderCaseFilters();

  // ④ 类案清单（年份 / 层级筛选 + 可展开详情）
  const list = caseTopic.cases.filter(c =>
    (caseYear === '全部' || c.year === caseYear) &&
    (caseLevel === '全部' || c.level === caseLevel));
  const filtered = caseYear !== '全部' || caseLevel !== '全部';

  $('#case-count').textContent = filtered
    ? `筛选 ${list.length} / 共 ${caseTopic.cases.length} 篇`
    : `命中 ${list.length} 篇相关裁判文书`;

  // 筛选条件提示 + 清除按钮
  const tip = $('#case-filter-tip');
  if (filtered) {
    const cond = [caseYear !== '全部' ? caseYear + ' 年' : '', caseLevel !== '全部' ? (CASE_LEVEL_LABEL[caseLevel] || caseLevel) : '']
      .filter(Boolean).join(' · ');
    tip.textContent = list.length ? `已筛选：${cond}` : `已筛选：${cond} · 当前组合无命中`;
    tip.className = list.length ? 'ml-auto text-[11.5px] text-brand-600' : 'ml-auto text-[11.5px] text-amber-600 font-medium';
  } else {
    tip.textContent = '';
    tip.className = 'ml-auto text-[11.5px] text-slate-400';
  }
  $('#case-clear').classList.toggle('hidden', !filtered);

  caseList = list;

  $('#case-list').innerHTML = list.length ? list.map((c, i) => `
    <div class="case-item rounded-xl border border-[#eef1f7] hover:border-brand-200 hover:shadow-[0_2px_10px_rgba(16,24,40,.05)] transition p-4" data-case-idx="${i}">
      <div class="flex items-start gap-3 cursor-pointer" data-case-toggle="${i}">
        <div class="min-w-0 flex-1">
          <div class="text-[14px] font-medium text-ink">${hl(c.title, caseHits)}</div>
          <div class="text-[12px] text-slate-400 mt-1">
            ${c.no} · ${c.court} · ${c.year}
            <span class="tag bg-slate-100 text-slate-500 ml-1">${CASE_LEVEL_LABEL[c.level] || c.level}</span>
          </div>
          <p class="text-[13px] leading-6 text-slate-600 mt-2">${hl(c.gist, caseHits)}</p>
        </div>
        <div class="flex items-center gap-2 flex-none">
          <span class="tag ${CASE_COLOR[c.color]} border">${c.result}</span>
          <span class="case-caret text-slate-300 transition-transform">${icon('<path d="M6 9l6 6 6-6"/>', 15)}</span>
        </div>
      </div>

      <div class="case-body hidden mt-4 pt-4 border-t border-[#f2f5fa]">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="text-[12px] font-semibold text-brand-600 mb-2">裁判要点</div>
            <ul class="space-y-2">
              ${(c.points || []).map(p => `
                <li class="flex gap-2 text-[12.5px] leading-6 text-slate-600">
                  <span class="text-brand-400 flex-none mt-[3px]">${icon('<path d="M5 12l4 4L19 6"/>', 12)}</span>
                  <span>${hl(p, caseHits)}</span>
                </li>`).join('')}
            </ul>
          </div>
          <div class="space-y-3">
            <div class="rounded-xl bg-slate-50 border border-[#eef1f7] p-3">
              <div class="text-[12px] text-slate-400 mb-1">裁判结果</div>
              <div class="text-[13px] font-medium text-ink">${c.amount || c.result}</div>
            </div>
            <div>
              <div class="text-[12px] text-slate-400 mb-2">争议焦点</div>
              <div class="flex flex-wrap gap-2">
                ${(c.tags || []).map(t => `<span class="tag bg-slate-100 text-slate-600">${t}</span>`).join('')}
              </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-1">
              <button class="h-8 px-3 rounded-lg border border-brand-200 text-brand-700 text-[12px] hover:bg-brand-50 transition" data-case-quote="${i}">引用到法律分析报告</button>
              <button class="h-8 px-3 rounded-lg border border-[#dde3ee] text-slate-600 text-[12px] hover:bg-slate-50 transition" data-case-copy="${i}">复制案号</button>
            </div>
          </div>
        </div>
      </div>
    </div>`).join('')
    : `<div class="text-center text-[13px] text-slate-400 py-12">
         当前筛选条件下暂无命中<button class="ml-2 text-brand-600 underline" data-case-clear-inline="1">清除筛选，查看全部 ${caseTopic.cases.length} 篇</button>
       </div>`;
}

/* 检索词命中专题 */
function matchCaseTopic(q) {
  const s = (q || '').trim();
  if (!s) return null;
  let best = null, bestScore = 0, bestHits = [];
  DATA.caseTopics.forEach(t => {
    let score = 0;
    const hits = [];
    t.keys.forEach(k => { if (s.indexOf(k) >= 0) { score += k.length; hits.push(k); } });
    if (s.indexOf(t.title) >= 0) score += t.title.length;
    if (score > bestScore) { bestScore = score; best = t; bestHits = hits; }
  });
  if (!best) return null;
  const pct = Math.min(98, 84 + bestScore * 2);
  return { topic: best, hits: bestHits, score: bestScore, pct: pct };
}

/* 命中关键词高亮（先转义再替换，关键词本身来自内置库，安全） */
function hl(text, hits) {
  let out = esc(text);
  (hits || []).forEach(k => {
    const safe = esc(k);
    if (!safe) return;
    out = out.split(safe).join('<mark class="kw">' + safe + '</mark>');
  });
  return out;
}

const CASE_COLOR = {
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};

/* 未命中 / 空检索时的引导态 */
function renderCaseMiss(q, empty) {
  $('#case-hit').innerHTML = `
    <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-amber-600 flex-none">${icon('<path d="M12 9v4M12 16.5v.2M10.3 3.9L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>', 16)}</span>
        <span class="text-[13.5px] font-semibold text-amber-800">
          ${empty ? '请输入要检索的争议情形' : '未命中类案专题：' + esc(q)}
        </span>
      </div>
      <p class="text-[13px] leading-6 text-amber-900">当前垂直语料库覆盖以下 6 类高频劳动争议，点击即可检索：</p>
      <div class="flex flex-wrap gap-2 mt-3">
        ${DATA.caseTopics.map(t => `<span class="chip px-3 py-1.5 rounded-full text-[12.5px] bg-white" data-case-topic="${t.id}">${t.title}</span>`).join('')}
      </div>
      <p class="text-[12px] text-amber-700/80 mt-3">提示：本原型为演示环境，仅内置上述 6 大专题（共 ${DATA.caseTopics.reduce((s, t) => s + t.cases.length, 0)} 篇裁判文书）；正式版将接入全量文书库全文检索。</p>
    </div>`;
  $('#case-topic').textContent = '';
  $('#case-corpus').textContent = '0';
  $('#case-tendency').innerHTML = '';
  $('#case-gist').textContent = '';
  $('#case-count').textContent = '';
  // 引导态下清空筛选条，避免残留上一个专题的年份 / 层级选项造成误解
  $('#case-years').innerHTML = '';
  $('#case-levels').innerHTML = '';
  $('#case-filter-tip').textContent = '';
  $('#case-clear').classList.add('hidden');
  caseTopicId = '';
  caseYear = '全部';
  caseLevel = '全部';
  $('#case-list').innerHTML = `<div class="text-center text-[13px] text-slate-400 py-12">暂无结果，请调整检索词</div>`;
}

/* 按专题 id 直接检索（引导态里的专题快捷入口使用） */
function searchCaseTopicById(id) {
  const t = DATA.caseTopics.filter(x => x.id === id)[0];
  if (!t) return;
  $('#case-query').value = t.title;
  renderCases();
}

/* 轻提示 */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => el.classList.remove('is-in'), 2200);
  setTimeout(() => el.remove(), 2600);
}

/* 引用类案到法律分析报告（跨模块联动） */
function quoteCaseToReport(idx) {
  const c = caseList[idx];
  if (!c) return;
  if (DATA.reportQuotes.indexOf(c.no) < 0) DATA.reportQuotes.push(c.no);
  renderQuotesBar();
  toast('已引用类案 ' + c.no + ' 至法律分析报告');
  goPage('report');
  // 若报告已生成，同步刷新其中的参考类案章节
  if ($('#report-paper')) renderReport();
}

/* 复制案号 */
function copyCaseNo(idx) {
  const c = caseList[idx];
  if (!c) return;
  const done = () => toast('已复制案号：' + c.no);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(c.no).then(done, () => { toast('案号：' + c.no); });
  } else {
    toast('案号：' + c.no);
  }
}

/* 报告页顶部的「已引用类案」提示条 */
function renderQuotesBar() {
  const box = $('#rpt-quotes');
  if (!box) return;
  if (!DATA.reportQuotes.length) { box.innerHTML = ''; return; }
  const items = DATA.reportQuotes.map(no => {
    const c = DATA.caseTopics.reduce((acc, t) => acc.concat(t.cases), []).filter(x => x.no === no)[0] || {};
    return `<span class="tag bg-white text-brand-700 border border-brand-100">${no}${c.title ? ' · ' + c.title : ''}</span>`;
  }).join('');
  box.innerHTML = `
    <div class="rounded-xl border border-brand-200 bg-brand-50/60 p-3 flex flex-wrap items-center gap-2">
      <span class="tag bg-brand-600 text-white text-[11px]">已引用类案 ${DATA.reportQuotes.length} 份</span>
      ${items}
      <button class="ml-auto text-[11.5px] text-slate-400 hover:text-rose-500 transition" data-quote-clear="1">清空</button>
    </div>`;
}

/* ---------- 智能咨询 ---------- */
function pushMsg(role, html) {
  const log = $('#chat-log');
  const el = document.createElement('div');
  el.className = 'msg flex gap-3';
  if (role === 'user') {
    el.className = 'msg flex gap-3 justify-end';
    el.innerHTML = `
      <div class="max-w-[78%] rounded-2xl rounded-tr-sm bg-brand-600 text-white px-4 py-3 text-[13.5px] leading-6">${html}</div>
      <div class="w-8 h-8 rounded-full bg-slate-200 flex-none flex items-center justify-center text-[12px] font-semibold text-slate-600">冯</div>`;
  } else {
    el.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-sky-400 flex-none flex items-center justify-center text-white">
        ${icon('<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/>', 15)}
      </div>
      <div class="max-w-[82%] rounded-2xl rounded-tl-sm bg-white border border-[#eef1f7] px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,.04)]">${html}</div>`;
  }
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function mdToHtml(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<b class="font-semibold text-ink">$1</b>')
    .replace(/\n/g, '<br/>');
}

function askChat(question) {
  pushMsg('user', question);

  const flow = DATA.chatFlows.find(f => f.match.some(m => question.indexOf(m) >= 0)) || DATA.chatDefault;

  // 打字指示器
  const holder = document.createElement('div');
  holder.className = 'msg flex gap-3';
  holder.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-sky-400 flex-none flex items-center justify-center text-white">
      ${icon('<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/>', 15)}
    </div>
    <div class="rounded-2xl rounded-tl-sm bg-white border border-[#eef1f7] px-4 py-3.5">
      <span class="typing text-[13px] text-slate-400"><i></i><i></i><i></i> 正在检索属地政策库与类案…</span>
    </div>`;
  const log = $('#chat-log');
  log.appendChild(holder);
  log.scrollTop = log.scrollHeight;

  setTimeout(() => {
    holder.remove();
    pushMsg('ai', `
      <div class="text-[13.5px] leading-7 text-slate-700">${mdToHtml(flow.answer)}</div>
      <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f1f4f9]">
        ${flow.basis.map(b => `<span class="tag bg-slate-50 text-slate-500 border border-[#eef1f7]">${b}</span>`).join('')}
      </div>
      <div class="flex items-center gap-3 mt-3">
        <span class="text-[11px] text-slate-400">AI 置信度</span>
        <div class="stat-bar w-[110px]"><i style="width:${flow.confidence}%;background:linear-gradient(90deg,#2563eb,#38bdf8)"></i></div>
        <span class="text-[11px] font-semibold text-brand-700">${flow.confidence}%</span>
        <span class="ml-auto text-[11px] text-slate-300">${flow.confidence < 80 ? '建议转专家复核' : '可直接采信'}</span>
      </div>
      ${flow.complex ? `
      <div class="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
        <span class="text-amber-600 flex-none mt-[1px]">${icon('<path d="M12 9v4M12 16.5v.2M10.3 3.9L2.5 18a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>', 15)}</span>
        <p class="text-[12.5px] leading-6 text-amber-900">该情形涉及举证与赔偿认定，已为你匹配领域专家，可在右侧直接发起深度服务。</p>
      </div>` : ''}
    `);
    updateMatch(flow);
  }, 900);
}

/* 专家匹配面板 */
function updateMatch(flow) {
  $('#match-intent').textContent = flow.intent;

  // 依据意图给专家重排序（含“竞业/争议”→争议解决优先，含“加班”→合规优先）
  let pool = DATA.experts.slice();
  const it = flow.intent;
  const score = e => {
    let s = e.pct;
    if (it.indexOf('竞业') >= 0 && e.domains.join('').indexOf('竞业') >= 0) s += 20;
    if (it.indexOf('试用期') >= 0 && e.domains.join('').indexOf('试用期') >= 0) s += 20;
    if (it.indexOf('加班') >= 0 && e.domains.join('').indexOf('合规') >= 0) s += 8;
    return s;
  };
  pool.sort((a, b) => score(b) - score(a));

  $('#match-list').innerHTML = pool.slice(0, 3).map((e, i) => `
    <div class="rounded-xl border border-[#eef1f7] hover:border-brand-200 transition p-4 ${i === 0 ? 'bg-brand-50/40 border-brand-200' : ''}">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-sky-400 flex items-center justify-center text-white text-[13px] font-semibold flex-none">${e.name.slice(0, 1)}</div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[13.5px] font-medium">${e.name}</span>
            ${i === 0 ? '<span class="tag bg-brand-600 text-white">最佳匹配</span>' : ''}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">${e.role} · 从业 ${e.years} 年</div>
        </div>
        <div class="text-right flex-none">
          <div class="text-[13px] font-semibold text-brand-700">${Math.min(99, Math.round(score(e) / 1.1))}%</div>
          <div class="text-[10px] text-slate-400">契合度</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3">
        ${e.domains.map(d => `<span class="tag bg-white text-slate-500 border border-[#eef1f7]">${d}</span>`).join('')}
        <span class="tag bg-white text-slate-500 border border-[#eef1f7]">评分 ${e.score}</span>
      </div>
    </div>`).join('');

  $('#match-cta').disabled = false;
}

/* ---------- 报告生成 ---------- */
const RPT_STEPS = ['正在解析案情要素…', '正在匹配属地政策与法条…', '正在检索同类裁判倾向…', '正在生成风险点与处置建议…', '正在排版输出…'];

function generateReport() {
  const btn = $('#rpt-gen');
  btn.disabled = true;
  btn.textContent = '生成中…';
  $('#rpt-progress').classList.remove('hidden');

  let p = 0;
  const timer = setInterval(() => {
    p += Math.random() * 14 + 6;
    if (p >= 100) p = 100;
    $('#rpt-pct').textContent = Math.round(p) + '%';
    $('#rpt-bar').style.width = p + '%';
    $('#rpt-step').textContent = RPT_STEPS[Math.min(RPT_STEPS.length - 1, Math.floor(p / 20))];
    if (p >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        renderReport();
        btn.disabled = false;
        btn.textContent = '重新生成报告';
        $('#rpt-progress').classList.add('hidden');
        $('#rpt-bar').style.width = '0%';
        $('#rpt-pct').textContent = '0%';
      }, 320);
    }
  }, 240);
}

function renderReport() {
  const city = lawCity;                                   // 与法规查询共用同一「用工所在地」
  const cityMeta = cityInfo(city);                        // 所属省市
  const tier = cityTier(city);                            // 精编指引 / 省级画像推定
  const scope = resolveCityScope(city, DATA.lawTopics[0]);// 属地化适用指引（沿用查询页同一套口径）
  const illegalPct = 100 - scope.winRate;                 // 由属地企业胜诉参考率反推违法解除概率
  const localRef = DATA.lawLocalDocs[city] || (cityMeta.p + ' 省级裁审画像（待原文核实）');
  const scene = $('#rpt-scene').value;
  const tplName = (DATA.reportTpls.find(t => t.on) || DATA.reportTpls[0]).name;
  const today = '2026 年 10 月 8 日';
  rptPaperCity = city;
  renderCityPicker();                                     // 同步「已变更」提示状态

  $('#report-holder').className = 'rise rounded-2xl bg-white border border-[#e5e8f0] overflow-hidden';
  $('#report-holder').innerHTML = `
    <div id="report-paper" class="p-5 md:p-9 print:p-0">
      <!-- 报告头 -->
      <div class="flex items-start justify-between pb-6 border-b-2 border-brand-900">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-[12px] text-slate-400 mb-2">外服法务通 · AI 生成</div>
            <span class="tag bg-amber-50 text-amber-700 border border-amber-200 text-[10.5px] px-2 py-0.5">AI 草案 · 待律师复核签发</span>
            <span class="tag ${tier.cls} text-[10.5px] px-2 py-0.5">${tier.label}</span>
          </div>
          <h2 class="text-[21px] font-semibold text-ink leading-snug">${tplName}</h2>
          <div class="text-[12px] text-slate-400 mt-2">用工所在地：${city}（${cityMeta.p}）　|　生成日期：${today}　|　报告编号：FSG-LR-20261008-0417</div>
        </div>
        <div class="w-12 h-12 rounded-xl bg-brand-900 flex items-center justify-center text-white flex-none">
          ${icon('<path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z"/><path d="M9.2 12.2l2 2 3.6-4"/>', 24)}
        </div>
      </div>

      <!-- 案情摘要 -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2"><span class="w-1 h-3.5 rounded bg-brand-500"></span>一、案情摘要</h3>
        <div class="rounded-xl bg-slate-50 border border-[#eef1f7] p-4 text-[13px] leading-7 text-slate-700">${scene}</div>
      </div>

      <!-- 属地适用指引（随「用工所在地」联动，精编城用精编口径、其余按省级画像推定并标注） -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2">
          <span class="w-1 h-3.5 rounded bg-sky-500"></span>二、属地适用指引
          <span class="tag ${tier.cls} ml-1">${city}</span>
        </h3>
        <div class="rounded-xl border border-[#dbe6f7] bg-brand-50/40 p-4">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="tag bg-white text-brand-700 border border-brand-100">${scope.scope}</span>
            <span class="tag bg-white text-slate-600 border border-brand-100">审查尺度 · ${scope.stricter}</span>
            <span class="tag bg-white text-slate-600 border border-brand-100">同类案件企业胜诉参考率 ${scope.winRate}%</span>
          </div>
          <p class="text-[13px] leading-7 text-brand-900">${scope.summary}</p>
          <ul class="mt-3 space-y-1.5">
            ${scope.keyPoints.map((p, i) => `<li class="flex gap-2 text-[12.5px] leading-6 text-slate-700">
              <span class="text-brand-500 flex-none">${i + 1}.</span><span>${p}</span></li>`).join('')}
          </ul>
          <div class="mt-3 pt-3 border-t border-brand-100 flex gap-2 text-[12.5px] leading-6 text-amber-900">
            <span class="font-semibold flex-none">属地差异提示</span><span>${scope.diffNote}</span>
          </div>
          ${scope.edited ? '' : `<div class="mt-2 text-[11.5px] leading-5 text-amber-700">※ 该城市暂无精编指引，以上口径由所属省级裁审画像模型推定生成，正式出具意见前需经当地最新裁审文件原文核实。</div>`}
        </div>
      </div>

      <!-- 风险点 -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2"><span class="w-1 h-3.5 rounded bg-rose-500"></span>三、风险点清单</h3>
        <div class="overflow-x-auto"><table class="w-full text-[12.5px] border border-[#e5e8f0] rounded-lg overflow-hidden min-w-[520px]">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left font-medium px-3 py-2.5 border-b border-[#e5e8f0] w-[52px]">序号</th>
              <th class="text-left font-medium px-3 py-2.5 border-b border-[#e5e8f0]">风险点</th>
              <th class="text-left font-medium px-3 py-2.5 border-b border-[#e5e8f0] w-[92px]">等级</th>
              <th class="text-left font-medium px-3 py-2.5 border-b border-[#e5e8f0] w-[160px]">依据</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ['未书面告知录用条件并签收', '高', '《劳动合同法》第 21 条'],
              ['考核标准缺乏客观量化记录', '高', localRef],
              ['解除决定送达时间临近试用期届满', '中', '《劳动合同法》第 39 条'],
              ['未履行工会（职工代表）告知程序', '中', '《劳动合同法》第 43 条'],
              ['赔偿测算未考虑 2N 风险敞口', '高', '《劳动合同法》第 87 条']
            ].map((r, i) => {
              const L = LEVEL_STYLE[r[1]];
              return `<tr class="${i % 2 ? 'bg-white' : 'bg-slate-50/40'}">
                <td class="px-3 py-2.5 text-slate-400">${i + 1}</td>
                <td class="px-3 py-2.5 text-slate-700">${r[0]}</td>
                <td class="px-3 py-2.5"><span class="tag ${L.bg} ${L.text} border ${L.border}">${r[1]}</span></td>
                <td class="px-3 py-2.5 text-slate-500">${r[2]}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>

      <!-- 结论 -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2"><span class="w-1 h-3.5 rounded bg-amber-500"></span>四、结论与测算</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <div class="text-[12px] text-rose-700 mb-1">解除合法性结论</div>
            <div class="text-[15px] font-semibold text-rose-700">高风险 · 拟认定违法解除</div>
          </div>
          <div class="rounded-xl border border-[#e5e8f0] p-4">
            <div class="text-[12px] text-slate-500 mb-1">违法解除赔偿（2N 测算）</div>
            <div class="text-[15px] font-semibold text-ink">￥12,000</div>
          </div>
          <div class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div class="text-[12px] text-emerald-700 mb-1">协商解除成本（N+1）</div>
            <div class="text-[15px] font-semibold text-emerald-700">￥18,000 <span class="text-[11px] font-normal">（含代通知金）</span></div>
          </div>
        </div>
        <p class="text-[13px] leading-7 text-slate-700 mt-4">
          在现有证据条件下，直接以“试用期考核不合格”解除，在 <b>${city}</b> 被认定为违法解除的概率约 <b>${illegalPct}%</b>（依据该属地同类案件企业胜诉参考率 ${scope.winRate}% 反推）。建议优先采取协商解除路径：由公司提出并与员工协商一致解除，支付经济补偿，整体成本可控且无诉讼风险；若员工不接受，再评估补正录用条件签收件与量化考核记录的可行性。
        </p>
      </div>

      <!-- 处置建议 -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2"><span class="w-1 h-3.5 rounded bg-emerald-500"></span>五、处置建议与时间节点</h3>
        <div class="space-y-2.5">
          ${[
            ['T+0', '立即冻结解除流程，避免形成不可逆的解除事实'],
            ['T+1', '调取劳动合同、录用条件告知书、考核记录等现有证据，完成证据清单'],
            ['T+2', '测算协商解除方案并出具沟通口径，由 HR 与员工首次沟通'],
            ['T+3～T+5', '达成一致后签署解除协议，明确金额、时间与争议终局条款'],
            ['T+7', '办理退工、档案转移与社保停缴，出具离职证明']
          ].map(r => `
            <div class="flex gap-3 items-start">
              <span class="tag bg-brand-50 text-brand-700 border border-brand-100 flex-none w-[62px] justify-center">${r[0]}</span>
              <p class="text-[13px] leading-6 text-slate-700 pt-0.5">${r[1]}</p>
            </div>`).join('')}
        </div>
      </div>

      ${DATA.reportQuotes.length ? `
      <!-- 参考类案（来自类案检索智库的引用） -->
      <div class="mt-6">
        <h3 class="text-[14px] font-semibold text-ink mb-3 flex items-center gap-2"><span class="w-1 h-3.5 rounded bg-violet-500"></span>六、参考类案</h3>
        <div class="space-y-2">
          ${DATA.reportQuotes.map(no => {
            const all = DATA.caseTopics.reduce((acc, t) => acc.concat(t.cases), []);
            const c = all.filter(x => x.no === no)[0] || { no: no, title: '', gist: '', amount: '' };
            return `<div class="rounded-xl border border-[#eef1f7] p-3.5">
              <div class="flex items-start gap-3">
                <div class="min-w-0 flex-1">
                  <div class="text-[13px] font-medium text-ink">${c.title || '类案'}</div>
                  <div class="text-[11.5px] text-slate-400 mt-0.5">${c.no}</div>
                  <p class="text-[12.5px] leading-6 text-slate-600 mt-1.5">${c.gist || ''}</p>
                </div>
                <span class="tag bg-violet-50 text-violet-700 border border-violet-100 flex-none">${c.amount || '参见裁判文书'}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- 落款 -->
      <div class="mt-8 pt-5 border-t border-[#e5e8f0] flex items-end justify-between">
        <div class="text-[11px] text-slate-400 leading-6">
          本报告由「外服法务通」AI 引擎自动生成，匹配 58 城（目标 512 城）属地政策库与 ${DATA.caseTopics.reduce((s, t) => s + t.corpus, 0).toLocaleString()} 份类案${DATA.reportQuotes.length ? '，引用类案 ' + DATA.reportQuotes.length + ' 份' : ''}。<br/>
          属地口径来源：${city} · ${scope.edited ? '精编属地指引（人工整理）' : cityMeta.p + ' 省级裁审画像（模型推定，待原文核实）'}。<br/>
          内容仅供参考，重大决策建议由领域专家复核后执行。
        </div>
        <div class="text-[12px] text-slate-500 text-right">
          复核专家：冯洁妍<br/>上海外服广东公司 · 智法先锋
        </div>
      </div>

      <!-- 操作条 -->
      <div class="mt-6 pt-5 border-t border-[#e5e8f0] flex flex-wrap gap-3 no-print">
        <button onclick="window.print()" class="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-medium transition">导出 / 打印 PDF</button>
        <button class="h-10 px-5 rounded-xl bg-white border border-[#e5e8f0] text-[13px] text-slate-600 hover:border-brand-300 hover:text-brand-700 transition">推送至专家复核</button>
        <button class="h-10 px-5 rounded-xl bg-white border border-[#e5e8f0] text-[13px] text-slate-600 hover:border-brand-300 hover:text-brand-700 transition">归档至客户空间</button>
      </div>
    </div>`;
}

/* ---------- 专家页 ---------- */
function renderExperts() {
  // 流程步骤
  $('#flow-steps').innerHTML = DATA.flowSteps.map((s, i) => `
    <div class="rise relative rounded-xl border border-[#eef1f7] p-4 ${s.state === 'now' ? 'border-brand-300 bg-brand-50/40' : ''}" style="animation-delay:${i * 0.06}s">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${s.state === 'todo' ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white'}">${s.step}</span>
        <span class="text-[13.5px] font-medium">${s.title}</span>
        ${s.state === 'done' ? `<span class="ml-auto text-emerald-500">${icon('<path d="M5 12l4 4L19 6"/>', 14)}</span>` : ''}
        ${s.state === 'now' ? '<span class="ml-auto tag bg-brand-600 text-white">进行中</span>' : ''}
      </div>
      <p class="text-[12.5px] leading-6 text-slate-500">${s.desc}</p>
      ${i < DATA.flowSteps.length - 1 ? '<span class="hidden md:block absolute -right-[13px] top-1/2 -translate-y-1/2 text-slate-300 z-10">›</span>' : ''}
    </div>`).join('');

  // 专家卡片
  $('#expert-grid').innerHTML = DATA.experts.map(e => `
    <div class="rounded-xl border border-[#eef1f7] hover:border-brand-200 hover:shadow-[0_2px_10px_rgba(16,24,40,.05)] transition p-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-sky-400 flex items-center justify-center text-white text-[14px] font-semibold flex-none">${e.name.slice(0, 1)}</div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[14px] font-medium">${e.name}</span>
            <span class="text-[11px] text-amber-500 font-medium">★ ${e.score}</span>
          </div>
          <div class="text-[11.5px] text-slate-400 mt-1 truncate">${e.role}</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-3 text-center">
        <div class="rounded-lg bg-slate-50 py-2">
          <div class="text-[14px] font-semibold text-ink">${e.years}<span class="text-[11px] font-normal text-slate-400"> 年</span></div>
          <div class="text-[10.5px] text-slate-400 mt-0.5">从业年限</div>
        </div>
        <div class="rounded-lg bg-slate-50 py-2">
          <div class="text-[14px] font-semibold text-ink">${e.orders}</div>
          <div class="text-[10.5px] text-slate-400 mt-0.5">累计服务</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3">
        ${e.domains.map(d => `<span class="tag bg-brand-50 text-brand-700 border border-brand-100">${d}</span>`).join('')}
      </div>
    </div>`).join('');
}

/* ---------- 项目概况页 ---------- */
function renderAbout() {
  $('#about-meta').innerHTML = DATA.aboutMeta.map(m => `
    <div>
      <div class="text-[11px] text-white/50 mb-1">${m.k}</div>
      <div class="text-[15px] font-semibold">${m.v}</div>
    </div>`).join('');

  $('#milestones').innerHTML = DATA.milestones.map(m => `
    <div class="flex gap-4">
      <div class="tl-dot ${m.done ? 'is-done' : ''}">${m.done ? '✓' : m.no}</div>
      <div class="pb-5 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[14px] font-medium">${m.title}</span>
          <span class="tag bg-slate-100 text-slate-500">${m.id} · ${m.date}</span>
          ${m.done ? '<span class="tag bg-emerald-50 text-emerald-700 border border-emerald-100">已完成</span>' : ''}
          ${m.now ? '<span class="tag bg-amber-50 text-amber-700 border border-amber-100">当前节点</span>' : ''}
        </div>
        <p class="text-[12.5px] leading-6 text-slate-500 mt-2">${m.desc}</p>
      </div>
    </div>`).join('');

  // 立项卡七要素
  $('#charter-grid').innerHTML = DATA.charter.map((c, i) => `
    <div class="rounded-xl border ${c.hot ? 'border-rose-100 bg-rose-50/40' : 'border-[#e5e8f0]'} p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-5 h-5 rounded-md ${c.hot ? 'bg-rose-500' : 'bg-brand-600'} text-white text-[11px] font-bold flex items-center justify-center">${i + 1}</span>
        <span class="text-[12.5px] font-semibold ${c.hot ? 'text-rose-700' : 'text-ink'}">${c.k}</span>
        ${c.hot ? '<span class="tag bg-white text-rose-600 border border-rose-200 ml-auto">评审重点</span>' : ''}
      </div>
      <p class="text-[12px] leading-6 text-slate-600">${c.v}</p>
    </div>`).join('');

  // 中期评测指标
  $('#metrics-body').innerHTML = DATA.metrics.map((m, i) => `
    <tr class="${i % 2 ? 'bg-white' : 'bg-slate-50/40'}">
      <td class="px-3 py-2.5 text-slate-700">${m.name}</td>
      <td class="px-3 py-2.5 text-slate-500">${m.target}</td>
      <td class="px-3 py-2.5 font-semibold text-ink">${m.actual}</td>
      <td class="px-3 py-2.5"><span class="tag ${m.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}">${m.ok ? '✓ 达标' : '未达标'}</span></td>
      <td class="px-3 py-2.5 text-slate-400 text-[11.5px]">${m.note}</td>
    </tr>`).join('');

  // 知识沉淀 · 可复用资产
  $('#skills-list').innerHTML = DATA.skills.map(s => `
    <div class="rounded-xl border border-[#eef1f7] hover:border-violet-200 transition p-4 flex gap-3">
      <span class="tag bg-violet-50 text-violet-600 border border-violet-100 flex-none h-fit">${s.tag}</span>
      <div>
        <div class="text-[13px] font-medium text-ink">${s.name}</div>
        <p class="text-[12px] leading-6 text-slate-500 mt-1">${s.desc}</p>
      </div>
    </div>`).join('');

  $('#leaps').innerHTML = DATA.leaps.map(l => `
    <div class="rounded-xl border ${l.color === 'brand' ? 'border-brand-200 bg-brand-50/40' : 'border-violet-200 bg-violet-50/40'} p-5">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[14px] font-semibold ${l.color === 'brand' ? 'text-brand-800' : 'text-violet-800'}">${l.tag}</span>
        <span class="tag bg-white text-slate-500 border border-[#e5e8f0] ml-auto">建议周期 ${l.period}</span>
      </div>
      <div class="mt-4 space-y-2">
        ${l.focus.map(f => `
          <div class="flex gap-2 items-start">
            <span class="${l.color === 'brand' ? 'text-brand-500' : 'text-violet-500'} flex-none mt-[3px]">${icon('<path d="M5 12l4 4L19 6"/>', 13)}</span>
            <span class="text-[13px] leading-6 text-slate-700">${f}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}
