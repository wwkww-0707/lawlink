# -*- coding: utf-8 -*-
"""部署包端到端验证：node 后端 + dist 前端（无 CDN）。"""
import sys
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8935/'
results = []

def ok(name, cond, detail=''):
    results.append((name, bool(cond)))
    print(('PASS' if cond else 'FAIL'), '|', name, ('| ' + detail) if detail else '')

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)

    # ---------- 桌面端 ----------
    d = browser.new_page(viewport={'width': 1440, 'height': 900})
    console_errors = []
    d.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
    cdn_hits = []
    d.on('request', lambda r: cdn_hits.append(r.url) if 'cdn.tailwindcss.com' in r.url else None)

    d.goto(URL, wait_until='networkidle', timeout=30000)
    d.wait_for_timeout(1800)

    ok('无 CDN 请求', len(cdn_hits) == 0, str(cdn_hits))
    ok('无控制台报错', len(console_errors) == 0, '; '.join(console_errors[:2]))

    # 关键样式实测：本地编译 CSS 生效（侧栏 brand-900 = #0f2c66）
    sb_bg = d.evaluate("getComputedStyle(document.querySelector('#sidebar')).backgroundColor")
    ok('Tailwind 本地编译生效(侧栏深蓝)', sb_bg == 'rgb(15, 44, 102)', sb_bg)
    # 移动抽屉遮罩 bg-ink/60
    ov_bg = d.evaluate("getComputedStyle(document.querySelector('#sidebar-overlay')).backgroundColor")
    ok('bg-ink/60 透明度生效', ov_bg.startswith('rgba(15, 23, 42, 0.6)'), ov_bg)

    ok('KPI 渲染', d.locator('#kpi-row > div').count() == 4)
    ok('瞬时体检自动运行', d.locator('#risk-result .rounded-xl').count() >= 1)

    d.click('[data-page="cases"]'); d.wait_for_timeout(500)
    ok('类案 10 篇', d.locator('#case-list .case-item').count() == 10)
    d.click('[data-page="report"]'); d.wait_for_timeout(300)
    d.click('#rpt-gen'); d.wait_for_timeout(3200)
    ok('报告生成', d.locator('#report-paper').count() == 1)
    d.screenshot(path='_pkg_desktop.png')

    # ---------- 移动端 ----------
    m = browser.new_page(viewport={'width': 390, 'height': 844})
    m.goto(URL, wait_until='networkidle', timeout=30000)
    m.wait_for_timeout(1200)
    ok('移动: 抽屉默认隐藏', m.locator('#sidebar').bounding_box()['x'] < 0)
    m.click('#sidebar-toggle'); m.wait_for_timeout(400)
    ok('移动: 抽屉展开', m.locator('#sidebar').bounding_box()['x'] == 0)
    m.click('[data-page="chat"]'); m.wait_for_timeout(500)
    ok('移动: 切页后收起', m.locator('#sidebar').bounding_box()['x'] < 0)
    ok('移动: 无横向溢出', m.evaluate('document.documentElement.scrollWidth <= 391'))
    m.screenshot(path='_pkg_mobile.png')

    d.close(); m.close()
    browser.close()

fails = [r for r in results if not r[1]]
print('\n==== %d/%d PASS ====' % (len(results) - len(fails), len(results)))
sys.exit(1 if fails else 0)
