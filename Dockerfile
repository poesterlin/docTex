FROM oven/bun:alpine AS bun

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun run build

#########################################################

FROM ghcr.io/xu-cheng/texlive-full:latest AS tex

WORKDIR /tex
COPY --chmod=777 tex/ ./

RUN apk update && \
    apk add --no-cache nodejs imagemagick

# copy node app
WORKDIR /app
COPY --from=bun /app/build/ build
COPY --from=bun /app/node_modules/ node_modules
COPY --from=bun /app/package.json ./

EXPOSE 3000

CMD ["node", "/app/build/index.js"]
