FROM python:3.12-slim as python-base

# Poetry のバージョンを基底イメージで一元管理
ENV POETRY_VERSION=1.8.2


# 開発用ステージ
FROM python-base as develop-stage

ENV PORT 8080

WORKDIR /workspaces/apps/api/

# システムパッケージをインストールする
RUN apt-get update && apt-get install -y \
    curl \
    tree \
    less \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# pipをアップグレードする
RUN pip install --upgrade pip

# Poetryをインストールする
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VIRTUALENVS_CREATE=false
RUN curl -sSL https://install.python-poetry.org | python -
ENV PATH="$POETRY_HOME/bin:$PATH"

# Poetryで依存関係をインストールする
COPY ./pyproject.toml ./poetry.lock* /workspaces/apps/api/
RUN poetry install

# ソースコードをコンテナに配置する
COPY ./ /workspaces/apps/api/

# FastAPI を起動する
CMD uvicorn src.main:app --host="0.0.0.0" --port=${PORT} --reload


# requirements.txt を生成するためのステージ
FROM python-base as requirements-stage

WORKDIR /tmp

# Poetryをインストールする
RUN pip install poetry==${POETRY_VERSION}

# /tmp 配下に requirements.txt を生成する
COPY ./pyproject.toml ./poetry.lock* /tmp/
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes


# デプロイ用ステージ
FROM python-base as deploy-stage

# aws-lambda-adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter
ENV PORT 8080
ENV READINESS_CHECK_PATH /healthcheck

WORKDIR /code

# requirements.txt から依存関係をインストールする
COPY --from=requirements-stage /tmp/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# ソースコードをコンテナに配置する
COPY ./src /code/src
COPY ./log_config /code/log_config

# FastAPI を起動する
CMD uvicorn src.main:app --host="0.0.0.0" --port=${PORT}
