FROM node:alpine AS base

FROM base AS build

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM base AS production

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
# COPY --from=build /app/.env ./.env

RUN npm install -g pnpm
RUN pnpm install --prod

EXPOSE 4000

CMD ["node", "dist/main"]