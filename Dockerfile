FROM oven/bun:1 AS bun

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

RUN bun run build && \
    bun build --compile ./build/index.js --outfile sveltekit

FROM alpine:latest as tex

# 'small' or 'full'
ARG scheme=small

ENV PATH="/opt/texlive/texdir/bin/x86_64-linuxmusl:${PATH}"

COPY tex/setup.sh \
  tex/texlive.profile \
  tex/texlive_pgp_keys.asc \
  tex/entrypoint.sh \
  /

RUN /setup.sh ${scheme}

COPY --from=bun /app/sveltekit /app/sveltekit

CMD ["/app/sveltekit"]