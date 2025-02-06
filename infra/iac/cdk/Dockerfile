# ベースイメージは Node (AWS CDK に Node が必須)
FROM node:22.13.1-slim

# システムパッケージをインストールする
RUN apt-get update && apt-get install -y \
    curl \
    tree \
    sudo \
    unzip \
    dnsutils \
    # vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# AWS CLI の最新バージョンを使用してインストールまたは更新を行う - AWS Command Line Interface
# https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN sudo ./aws/install
RUN rm -r ./aws awscliv2.zip

# AWS CDK の開始方法 - AWS Cloud Development Kit (AWS CDK) v2
# https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/getting_started.html#getting_started_install
RUN npm install -g aws-cdk

# Dockerをインストールする
RUN curl -fsSL https://get.docker.com/ | sh

WORKDIR /workspaces/infra/iac/cdk/

# 依存関係をインストール
COPY ./package.json ./package-lock.json ./
RUN npm install
