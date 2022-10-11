# 18-bullseye or 16-bullseye to ensure ARM compatibility.
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

# Install netcat and redis tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends netcat redis-tools

ENV REDIS_HOST=redis-stack
ENV REDIS_PORT=6379
ENV SERVER_PORT=8080