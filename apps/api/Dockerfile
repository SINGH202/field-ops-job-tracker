FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/

RUN npm ci

COPY packages/contracts packages/contracts
COPY apps/api apps/api

WORKDIR /app/apps/api

ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/index.ts"]
