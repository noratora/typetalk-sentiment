#!/bin/bash

# 色の定義
GREEN='\033[0;32m'
NC='\033[0m'

# 環境変数ファイルのコピー関数
copy_env_file() {
    local src=$1
    local dest=$2

    if [ ! -f "$dest" ]; then
        cp "$src" "$dest" && \
        echo -e "${GREEN}Created:${NC} $dest"
    else
        echo -e "${GREEN}Already exists:${NC} $dest"
    fi
}

# メイン処理
echo "Setting up environment files..."

# Typetalk Sentiment API
copy_env_file "apps/api/.env.example" "apps/api/.env"
copy_env_file "apps/api/.env.aws.example" "apps/api/.env.aws"

# Typetalk Sentiment Web
copy_env_file "apps/web/.env.local.example" "apps/web/.env.local"

# Typetalk Sentiment Infrastructure
copy_env_file "infra/iac/cdk/.env.example" "infra/iac/cdk/.env"

echo -e "\n${GREEN}Setup completed.${NC}"
echo "Please configure the environment variables in the created files."
