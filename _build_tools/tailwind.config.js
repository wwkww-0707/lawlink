module.exports = {
  // 与原原型 index.html 内 tailwind.config 完全一致（brand 色板 + ink 墨色 + 中文字体栈）
  content: ['../index.html', '../demo.html', '../js/*.js'],
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
