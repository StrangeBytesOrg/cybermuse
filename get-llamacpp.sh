#!/bin/bash

LLAMA_CPP_VERSION="b3181"

curl -L "https://github.com/ggerganov/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/llama-${LLAMA_CPP_VERSION}-bin-ubuntu-x64.zip" -o /tmp/llamacpp.zip
unzip -j /tmp/llamacpp.zip -d llamacpp
