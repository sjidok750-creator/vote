# 비밀투표 PWA — 단일 컨테이너 이미지
FROM node:22-slim AS base
WORKDIR /app

# 의존성 설치 (pg 는 순수 JS 라 별도 빌드 도구 불필요)
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# 앱 빌드
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 시작 시 DB 스키마 동기화(db push) 후 서버 실행
CMD ["sh", "-c", "npm run db:deploy && npm start"]
