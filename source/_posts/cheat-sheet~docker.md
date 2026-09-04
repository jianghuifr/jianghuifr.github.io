---
title: docker
date: 2024-01-01 00:00:00
tags:
  - cheat-sheet
  - docker
categories: [速查表]

---

## 安装

- 安装 docker-ce

> https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository

> https://developer.aliyun.com/mirror/docker-ce

```bash
MIRROR=https://download.docker.com/linux/ubuntu  # 官方
MIRROR=https://mirrors.aliyun.com/docker-ce/linux/ubuntu  # 阿里云

# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL $MIRROR/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: $MIRROR
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

```bash
sudo systemctl status docker
sudo systemctl start docker
```

## 配置

- docker pull 设置代理

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<-EOF
[Service]
Environment="HTTP_PROXY=$HTTP_PROXY"
Environment="HTTPS_PROXY=$HTTPS_PROXY"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 常用 docker 命令

- 修改运行中的容器的重启策略

```bash
docker update --restart=always <CONTAINER ID>
docker update --restart=no <CONTAINER ID>
```

- 查看 IP

```bash
docker inspect --format='{{.NetworkSettings.IPAddress}}'
```

## 常用 Dockerfile 指令

- ubuntu 修改 apt 源

```bash
# ubuntu 20.04
sed -e 's/archive.ubuntu.com/mirrors.aliyun.com/g' \
    -i /etc/apt/sources.list
# ubuntu 24.04
sed -e 's/archive.ubuntu.com/mirrors.aliyun.com/g' \
    -e 's/security.ubuntu.com/mirrors.aliyun.com/g' \
    -i /etc/apt/sources.list.d/ubuntu.sources
```
