FROM oven/bun:alpine AS bun

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN bun run build \
    && bun build --compile ./build/index.js --outfile executable

#########################################################

FROM ghcr.io/xu-cheng/texlive-full:latest AS tex

WORKDIR /tex
COPY --chmod=777 tex/ ./

RUN apk update \
    && apk add --no-cache imagemagick  \
    && curl -fsSL https://bun.sh/install | bash

# copy node app
WORKDIR /app
COPY --from=bun --chmod=777 /app/executable executable
# COPY --from=bun /app/build/ build
# COPY --from=bun /app/node_modules/ node_modules
# COPY --from=bun /app/package.json ./

EXPOSE 3000

CMD ["./executable"]
