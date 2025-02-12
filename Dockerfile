FROM oven/bun:alpine AS bun

#########################################################

FROM ghcr.io/xu-cheng/texlive-full:latest AS tex

WORKDIR /tex
COPY --chmod=777 tex/ ./

RUN apk update \
    && apk add --no-cache imagemagick

# install bun
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

# add bun to PATH
RUN echo 'export PATH=$PATH:/usr/local/bin' >> /etc/profile

# copy node app
WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host"]
