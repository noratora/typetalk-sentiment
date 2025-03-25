#!/bin/bash

# 依存関係の脆弱性をチェックする
echo "Running security audit for dependencies..."
poetry export -f requirements.txt --without-hashes | poetry run pip-audit -r /dev/stdin
