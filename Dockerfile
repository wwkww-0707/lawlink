# ==============================================================
# 外服法务通 LawLink · 生产镜像
# 构建：docker build -t lawlink-app .
# 运行：docker run -d -p 8080:8080 --name lawlink lawlink-app
# ==============================================================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=8080

# 先拷 package.json 便于利用镜像层缓存
COPY package.json server.js ./
COPY dist ./dist

EXPOSE 8080

# 容器健康检查（每 30 秒探测一次 /api/health）
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1

CMD ["node", "server.js"]
