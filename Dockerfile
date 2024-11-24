FROM oven/bun:alpine AS bun

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run build

#########################################################

FROM alpine:latest as tex

ENV PATH="/opt/texlive/texdir/bin/x86_64-linuxmusl:${PATH}"

WORKDIR /tex
COPY --chmod=777 tex/ ./

# this takes a long time to run, so we cache it
RUN cd /tex && \
  sed -i 's/\r$//' ./setup.sh && \
  ./setup.sh full

RUN apk update && \
    apk add --no-cache nodejs

# copy node app
WORKDIR /app
COPY --from=bun /app/build/ build
COPY --from=bun /app/node_modules/ node_modules
COPY --from=bun /app/package.json ./

EXPOSE 3000

CMD ["node", "/app/build/index.js"]
