# ---------------------------------------------------------------------------
# Grably — production image (Next.js server + yt-dlp + ffmpeg)
# Build:  docker build -t grably .
# Run:    docker run -p 3000:3000 --env-file .env grably
# ---------------------------------------------------------------------------

# 1) Install deps
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# 2) Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# 3) Runtime — includes ffmpeg + yt-dlp for real downloads
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Prisma engine + generated client (needed at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/downloads
ENV STORAGE_DIR=/app/downloads
VOLUME ["/app/downloads"]

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
