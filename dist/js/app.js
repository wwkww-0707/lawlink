/* ==============================================================
   外服法务通 · js/app.js —— ③ EVENTS 交互逻辑区
   导航切换、查询、对话、报告生成、移动端抽屉导航
   ============================================================== */

/* ==============================================================
   ③ EVENTS —— 交互逻辑区
   ============================================================== */

/* 页面切换 */
function goPage(name) {
  $$('.page').forEach(p => p.classList.toggle('is-active', p.id === 'page-' + name));
  $$('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.page === name));
  const cur = $('#page-' + name);
  if (cur) {
    $('#page-title').textContent = cur.dataset.title || '';
    $('#page-sub').textContent = cur.dataset.sub || '';
  }
  $('#viewport').scrollTop = 0;
  closeSidebar(); // 移动端：切换页面后自动收起抽屉导航
}

function bindEvents() {
  /* --- 导航 --- */
  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => goPage(btn.dataset.page)));

  /* --- 工作台 --- */
  $('#risk-btn').addEventListener('click', runRiskCheck);
  $('#risk-input').addEventListener('keydown', e => { if (e.key === 'Enter') runRiskCheck(); });
  document.addEventListener('click', e => {
    const jump = e.target.closest('[data-risk-jump]');
    if (jump) goPage(jump.dataset.riskJump);
  });

  /* --- 法规查询：可搜索的城市选择器 + 关键词查询 --- */
  const cityInput = $('#law-city-input');
  cityInput.addEventListener('focus', () => openCityDrop(cityInput.value));
  cityInput.addEventListener('input', () => openCityDrop(cityInput.value));
  cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const list = filterCities(cityInput.value);
      if (list.length) selectCity(list[0].n);
      else cityInput.value = '';
    }
    if (e.key === 'Escape') { closeCityDrops(); cityInput.blur(); }
  });
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-law-city]');
    if (c) selectCity(c.dataset.lawCity);
    const q = e.target.closest('[data-law-quick]');
    if (q) { $('#law-query').value = q.dataset.lawQuick; renderLaw(); }
    if (!e.target.closest('#law-city-picker') && !e.target.closest('#rpt-city-picker')) closeCityDrops();
  });
  $('#law-btn').addEventListener('click', renderLaw);
  $('#law-query').addEventListener('keydown', e => { if (e.key === 'Enter') renderLaw(); });
  document.addEventListener('change', e => {
    if (e.target.classList.contains('law-check')) updateLawProgress();
  });

  /* --- 报告页：用工所在地选择器（与法规查询共用 58 城可搜索城市库） --- */
  const rptCityInput = $('#rpt-city-input');
  rptCityInput.addEventListener('focus', () => openReportCityDrop(rptCityInput.value));
  rptCityInput.addEventListener('input', () => openReportCityDrop(rptCityInput.value));
  rptCityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const list = filterCities(rptCityInput.value);
      if (list.length) selectCity(list[0].n);
      else rptCityInput.value = '';
    }
    if (e.key === 'Escape') { closeCityDrops(); rptCityInput.blur(); }
  });

  /* --- 类案检索：检索 + 展开详情 + 引用到报告 --- */
  $('#case-btn').addEventListener('click', renderCases);
  $('#case-query').addEventListener('keydown', e => { if (e.key === 'Enter') renderCases(); });

  /* 清除年份 / 层级筛选（顶部按钮与空结果内联按钮共用） */
  const clearCaseFilter = () => {
    caseYear = '全部';
    caseLevel = '全部';
    renderCaseFilters();
    renderCases();
    toast('已清除筛选条件');
  };
  $('#case-clear').addEventListener('click', clearCaseFilter);
  document.addEventListener('click', e => {
    if (e.target.closest('[data-case-clear-inline]')) clearCaseFilter();
  });

  document.addEventListener('click', e => {
    // 年份 / 层级筛选
    const y = e.target.closest('[data-case-year]');
    if (y) { caseYear = y.dataset.caseYear; $$('[data-case-year]').forEach(x => x.classList.toggle('is-on', x === y)); renderCases(); return; }
    const l = e.target.closest('[data-case-level]');
    if (l) { caseLevel = l.dataset.caseLevel; $$('[data-case-level]').forEach(x => x.classList.toggle('is-on', x === l)); renderCases(); return; }

    // 常用检索快捷片
    const cq = e.target.closest('[data-case-quick]');
    if (cq) { $('#case-query').value = cq.dataset.caseQuick; renderCases(); return; }

    // 引导态里的专题快捷入口
    const ct = e.target.closest('[data-case-topic]');
    if (ct) { searchCaseTopicById(ct.dataset.caseTopic); return; }

    // 展开 / 收起类案详情（直接操作 DOM，避免重排）
    const tg = e.target.closest('[data-case-toggle]');
    if (tg && !e.target.closest('[data-case-quote]') && !e.target.closest('[data-case-copy]')) {
      const item = tg.closest('.case-item');
      const body = item.querySelector('.case-body');
      const open = body.classList.contains('hidden');
      body.classList.toggle('hidden', !open);
      item.classList.toggle('is-open', open);
      return;
    }

    // 引用该案到法律分析报告
    const q = e.target.closest('[data-case-quote]');
    if (q) { quoteCaseToReport(Number(q.dataset.caseQuote)); return; }

    // 复制案号
    const cp = e.target.closest('[data-case-copy]');
    if (cp) { copyCaseNo(Number(cp.dataset.caseCopy)); return; }
  });

  // 清空已引用类案
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-quote-clear]')) return;
    DATA.reportQuotes.length = 0;
    renderQuotesBar();
    if ($('#report-paper')) renderReport();
    toast('已清空引用类案');
  });

  /* --- 智能咨询 --- */
  $('#chat-quick').innerHTML = DATA.chatQuick.map(q =>
    `<span class="chip px-3 py-1.5 rounded-full text-[12.5px]" data-chat-quick="${q}">${q}</span>`).join('');
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-chat-quick]');
    if (q) askChat(q.dataset.chatQuick);
  });
  const send = () => {
    const v = $('#chat-input').value.trim();
    if (!v) return;
    $('#chat-input').value = '';
    askChat(v);
  };
  $('#chat-send').addEventListener('click', send);
  $('#chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  $('#match-cta').addEventListener('click', () => {
    if ($('#match-cta').disabled) return;
    $('#match-cta').textContent = '已派单 · 专家将在 30 分钟内响应';
    $('#match-cta').classList.add('bg-emerald-600', 'hover:bg-emerald-600');
    setTimeout(() => {
      $('#match-cta').textContent = '一键直连专家';
      $('#match-cta').classList.remove('bg-emerald-600', 'hover:bg-emerald-600');
    }, 2600);
  });

  /* --- 报告模板选择 --- */
  $('#rpt-tpl').innerHTML = DATA.reportTpls.map((t, i) => `
    <button class="w-full text-left rounded-xl border p-3 transition ${t.on ? 'border-brand-300 bg-brand-50/50' : 'border-[#eef1f7] hover:border-brand-200'}" data-rpt-tpl="${t.id}" data-rpt-idx="${i}">
      <div class="flex items-center gap-2">
        <span class="text-[13.5px] font-medium ${t.on ? 'text-brand-800' : 'text-slate-700'}">${t.name}</span>
        ${t.on ? `<span class="ml-auto text-brand-600">${icon('<path d="M5 12l4 4L19 6"/>', 14)}</span>` : ''}
      </div>
      <div class="text-[11.5px] text-slate-400 mt-1">${t.desc}</div>
    </button>`).join('');

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-rpt-tpl]');
    if (!t) return;
    const idx = Number(t.dataset.rptIdx);
    DATA.reportTpls.forEach((x, i) => x.on = i === idx);
    $('#rpt-tpl').innerHTML = DATA.reportTpls.map((x, i) => `
      <button class="w-full text-left rounded-xl border p-3 transition ${x.on ? 'border-brand-300 bg-brand-50/50' : 'border-[#eef1f7] hover:border-brand-200'}" data-rpt-tpl="${x.id}" data-rpt-idx="${i}">
        <div class="flex items-center gap-2">
          <span class="text-[13.5px] font-medium ${x.on ? 'text-brand-800' : 'text-slate-700'}">${x.name}</span>
          ${x.on ? `<span class="ml-auto text-brand-600">${icon('<path d="M5 12l4 4L19 6"/>', 14)}</span>` : ''}
        </div>
        <div class="text-[11.5px] text-slate-400 mt-1">${x.desc}</div>
      </button>`).join('');
  });

  $('#rpt-gen').addEventListener('click', generateReport);
}

/* ---------- 初始化 ---------- */
function init() {
  renderDashboard();
  renderCityPicker();
  renderLaw();
  renderCases();
  renderQuotesBar();
  renderExperts();
  renderAbout();
  bindEvents();

  // 首屏欢迎语
  setTimeout(() => {
    pushMsg('ai', `
      <div class="text-[13.5px] leading-7 text-slate-700">
        你好，我是<b class="font-semibold text-ink">外服法务通</b>智能助手。<br/>
        我可以帮你做四件事：查属地政策、检索同类裁判、解答用工疑问、生成法律分析报告。
      </div>
      <div class="mt-3 rounded-xl bg-brand-50 border border-brand-100 p-3 text-[12.5px] leading-6 text-brand-900">
        已接入 <b>512 城</b>属地政策库、<b>1,286 份</b>劳动争议类案。<br/>
        复杂问题会自动匹配领域专家，一键直达。
      </div>
      <div class="flex items-center gap-3 mt-3">
        <span class="text-[11px] text-slate-400">AI 置信度</span>
        <div class="stat-bar w-[110px]"><i style="width:99%;background:linear-gradient(90deg,#2563eb,#38bdf8)"></i></div>
        <span class="text-[11px] font-semibold text-brand-700">99%</span>
      </div>
    `);
    updateMatch({ intent: '等待新的咨询意图识别…' });
    $('#match-cta').disabled = true;
  }, 300);

  // 工作台首屏自动跑一次体检，便于演示
  setTimeout(runRiskCheck, 700);
}

document.addEventListener('DOMContentLoaded', init);

/* ==============================================================
   移动端抽屉导航（lg 以下）：顶栏汉堡按钮唤出 / 收起左侧导航
   ============================================================== */
function openSidebar() {
  $('#sidebar').classList.remove('-translate-x-full');
  $('#sidebar-overlay').classList.remove('hidden');
}

function closeSidebar() {
  if (window.innerWidth >= 1024) return; // 桌面端导航常驻，无需收起
  $('#sidebar').classList.add('-translate-x-full');
  $('#sidebar-overlay').classList.add('hidden');
}

document.addEventListener('click', e => {
  if (e.target.closest('#sidebar-toggle')) { openSidebar(); return; }
  if (e.target.closest('#sidebar-overlay')) closeSidebar();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

