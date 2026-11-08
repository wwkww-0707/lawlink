# -*- coding: utf-8 -*-
"""生成 dist/ 生产构建：本地化 Tailwind、复制静态资源。"""
import os, shutil

ROOT = r'C:/Users/wwkww/WorkBuddy/2026-11-05-23-14-43'
DIST = os.path.join(ROOT, 'dist')

# 1. 复制静态资源
os.makedirs(os.path.join(DIST, 'css'), exist_ok=True)
os.makedirs(os.path.join(DIST, 'js'), exist_ok=True)
shutil.copy2(os.path.join(ROOT, 'css', 'style.css'), os.path.join(DIST, 'css', 'style.css'))
for f in ('data.js', 'render.js', 'app.js', 'landing.js'):
    shutil.copy2(os.path.join(ROOT, 'js', f), os.path.join(DIST, 'js', f))

# 2. 生成 dist/index.html（落地页）与 dist/demo.html（后台演示）：
#    移除 CDN 与内联配置，改为本地编译 CSS
cdn_block = '''<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: { 50:'#eef3ff',100:'#dbe6ff',200:'#bfd3ff',300:'#93b0f5',400:'#5f8bf0',500:'#2563eb',600:'#1d4ed8',700:'#1a3fae',800:'#173184',900:'#0f2c66' },
          ink: '#0f172a'
        },
        fontFamily: {
          sans: ['"PingFang SC"','"Microsoft YaHei"','"Source Han Sans SC"','"Noto Sans SC"','system-ui','sans-serif']
        }
      }
    }
  }
</script>
<link rel="stylesheet" href="css/style.css" />'''
local_block = '''<!-- 生产构建：Tailwind 已本地编译（无 CDN 依赖，可离线/内网部署） -->
<link rel="stylesheet" href="css/tailwind.css" />
<link rel="stylesheet" href="css/style.css" />'''

for page in ('index.html', 'demo.html'):
    html = open(os.path.join(ROOT, page), encoding='utf-8').read()
    assert html.count(cdn_block) == 1, page + ': CDN block not found'
    html = html.replace(cdn_block, local_block)
    with open(os.path.join(DIST, page), 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print('OK dist/' + page)
for dp, _, fs in os.walk(DIST):
    for f in fs:
        p = os.path.join(dp, f)
        print('  %8d  %s' % (os.path.getsize(p), os.path.relpath(p, DIST)))
