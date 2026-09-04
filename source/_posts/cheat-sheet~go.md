---
title: go
date: 2024-01-01 00:00:00
tags:
    - cheat-sheet
    - go
photos:
    - /images/go.png
categories: [速查表]

---

## 安装

> https://go.dev/doc/install

```bash
sudo -i
cd /usr/local
wget https://go.dev/dl/go1.22.2.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.2.linux-amd64.tar.gz
```

## 配置

> /etc/profile
```bash
GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin
```

> ~/.profile
```bash
GOPATH="$HOME/go"
GOBIN="$GOPATH/bin"
export PATH=$PATH:$GOBIN
```

## 设置代理

```bash
go env -w GO111MODULE=on
go env -w GOPROXY=https://goproxy.cn,direct
```

## 安装第三方库

```bash
go install github.com/go-nunu/nunu@latest
```

## 交叉编译

```bash
go env GOOS GOARCH # 查看交叉编译配置

GOOS=windows GOARCH=amd64 go build cmd/server/main.go
GOOS=linux GOARCH=amd64 go build cmd/server/main.go
```
