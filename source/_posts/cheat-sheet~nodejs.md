---
title: nodejs
date: 2024-01-01 00:00:00
tags:
    - cheat-sheet
    - node
    - nodejs
    - npm
    - pnpm
    - yarn
categories: [速查表]

---

## 安装

> https://nodejs.org/en/download

- nvm && node

```bash
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.12.0".
```

- pnpm

```bash
# Download and install pnpm:
corepack enable pnpm

# Verify pnpm version:
pnpm -v
```

- yarn

```bash
# Download and install yarn:
corepack enable yarn

# Verify yarn version:
yarn -v
```

## 替换为国内源

```bash
npm config set registry https://registry.npmmirror.com

pnpm config set registry https://registry.npmmirror.com

yarn config set registry https://registry.npmmirror.com
```
