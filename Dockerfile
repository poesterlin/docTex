FROM oven/bun:alpine AS bun

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run build

#########################################################

FROM alpine:latest as tex

RUN apk update && \
    apk add --no-cache nodejs

# 'small' or 'full'
ARG scheme=full

ENV PATH="/opt/texlive/texdir/bin/x86_64-linuxmusl:${PATH}"

WORKDIR /tex

COPY --chmod=777 tex/ ./

RUN cd /tex && \
  chmod +x ./setup.sh && \
  sed -i 's/\r$//' ./setup.sh && \
  ./setup.sh ${scheme}

WORKDIR /app

COPY --from=bun /app/build/ build
COPY --from=bun /app/node_modules/ node_modules
COPY --from=bun /app/package.json ./

EXPOSE 3000

CMD ["node", "/app/build/index.js"]
