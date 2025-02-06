FROM node:22.13.1-slim as node-base

# 開発用ステージ
FROM node-base as develop-stage

WORKDIR /workspaces/apps/web/

# システムパッケージをインストールする
RUN apt-get update && apt-get install -y \
    curl \
    tree \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 依存関係をインストール
COPY ./package.json ./package-lock.json ./
RUN npm install

# ビルド用ステージ
FROM node-base as build-stage

WORKDIR /build

# --build-arg で渡された環境変数を取得
ARG AUTH_SECRET
ARG AUTH_TYPETALK_ID
ARG AUTH_TYPETALK_SECRET
ARG BACKEND_HOST
ARG IMAGES_REMOTE_PATTERNS
ARG ALLOWED_ORIGINS

# Next.jsビルド時の環境変数として設定
ENV AUTH_SECRET=${AUTH_SECRET}
ENV AUTH_TYPETALK_ID=${AUTH_TYPETALK_ID}
ENV AUTH_TYPETALK_SECRET=${AUTH_TYPETALK_SECRET}
ENV BACKEND_HOST=${BACKEND_HOST}
ENV IMAGES_REMOTE_PATTERNS=${IMAGES_REMOTE_PATTERNS}
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# 依存関係をインストール
COPY ./package.json ./package-lock.json ./
RUN npm install

# ソースコードをコンテナに配置する
COPY . ./

RUN npm run build


# デプロイ用ステージ
FROM node-base as  deploy-stage

WORKDIR /app

# aws-lambda-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT 3000

COPY --from=build-stage /build/public ./public
COPY --from=build-stage /build/.next/static ./.next/static
COPY --from=build-stage /build/.next/standalone ./

COPY --from=build-stage /build/run.sh ./run.sh
RUN chmod +x ./run.sh
RUN ln -s /tmp/cache ./.next/cache

CMD exec ./run.sh
