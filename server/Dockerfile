# The Counsel API — production image
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# App source
COPY src ./src

# Persist the SQLite db + uploads on a volume
RUN mkdir -p /app/data
VOLUME ["/app/data"]
ENV DATABASE_PATH=/app/data/counsel.db
ENV UPLOAD_DIR=/app/data/uploads

EXPOSE 4000

# Lightweight healthcheck against the health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
