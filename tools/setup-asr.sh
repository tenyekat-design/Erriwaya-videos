#!/usr/bin/env bash
# Installs the speech-to-text used by tools/transcribe.py: faster-whisper + the Whisper "small"
# model (CTranslate2 int8), fetched from npm in four parts. Model goes to .asr-model/ (git-ignored).
set -euo pipefail
cd "$(dirname "$0")/.."
pip install -q faster-whisper soundfile numpy
if [ -f .asr-model/model.bin ]; then echo "model already installed"; exit 0; fi
tmp=$(mktemp -d)
for i in 0 1 2 3; do (cd "$tmp" && npm pack -q "@skillninja/shortmovie-telop-model-p$i" >/dev/null && mkdir p$i && tar xzf skillninja-shortmovie-telop-model-p$i-*.tgz -C p$i); done
mkdir -p .asr-model
cp "$tmp"/p0/package/{config,preprocessor_config,tokenizer,vocabulary}.json .asr-model/
cat "$tmp"/p0/package/model.bin.part0 "$tmp"/p1/package/model.bin.part1 "$tmp"/p2/package/model.bin.part2 "$tmp"/p3/package/model.bin.part3 > .asr-model/model.bin
(cd .asr-model && echo "$(cat "$tmp"/p0/package/model.sha256)  model.bin" | sha256sum -c -)
rm -rf "$tmp"
