#!/usr/bin/env bash

set -euo pipefail

PREFIX_DIR="${UIPRO_NPM_PREFIX:-$HOME/.local}"

mkdir -p "$PREFIX_DIR/bin"

echo "Installing uipro-cli with npm prefix: $PREFIX_DIR"
npm install -g uipro-cli --prefix "$PREFIX_DIR"

echo
echo "Installed."
echo "Expected binary path:"
echo "  $PREFIX_DIR/bin/uipro"
echo
echo "Verify with:"
echo "  uipro --version"
