# 비밀투표 PWA — 단일 컨테이너 이미지
FROM node:22-slim AS base
WORKDIR /app
# better-sqlite3 빌드에 필요한 도구
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 의존성 설치
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# 앱 빌드
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
# 컨테이너 내부 기본 DB 경로(영구 볼륨을 /data 에 마운트하세요)
ENV DATABASE_URL="file:/data/prod.db"
EXPOSE 3000

# 시작 시 마이그레이션 적용 후 서버 실행
CMD ["sh", "-c", "mkdir -p /data && npm run db:deploy && npm start"]
