#!/bin/bash
LLAMA_CPP_VERSION="b3952"

# Get a binary from the llama.cpp repo directly
curl -L "https://github.com/ggerganov/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/llama-${LLAMA_CPP_VERSION}-bin-ubuntu-x64.zip" -o /tmp/llamacpp.zip
unzip -j /tmp/llamacpp.zip -d llamacpp

# Get a binary from our CI pipeline
# curl -L "https://github.com/StrangeBytesOrg/llama.cpp-binaries/releases/download/${LLAMA_CPP_VERSION}/llama-server-cpu.tar.gz" -o /tmp/llamacpp.tar.gz
# tar -xf /tmp/llamacpp.tar.gz -C llamacpp
