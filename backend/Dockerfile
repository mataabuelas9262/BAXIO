FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && groupadd --system baxio && useradd --system --gid baxio --home-dir /app baxio
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY scripts ./scripts
RUN mkdir -p /var/lib/baxio/uploads /var/lib/baxio/backups && chown -R baxio:baxio /app /var/lib/baxio
USER baxio
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
