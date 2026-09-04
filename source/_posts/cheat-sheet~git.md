---
title: git
date: 2024-01-01 00:00:00
tags:
    - cheat-sheet
    - git
categories: [速查表]

---

## 初始化

```bash
EMAIL=your-email@example.com
USERNAME=your-username

# 生成ssh密钥
ssh-keygen -t rsa -C $EMAIL
# 将ssh公钥添加到github/gitee
cat $HOME/.ssh/id_rsa.pub
# 将ssh私钥添加到ssh服务器


git config --global user.email $EMAIL
git config --global user.name $USERNAME
```

## Proxy

```bash
git config --global http.https://github.com.proxy $HTTP_PROXY
git config --global https.https://github.com.proxy $HTTPS_PROXY

git config --global --unset http.proxy
git config --global --unset https.proxy
```

## Reset commit author

https://www.cnblogs.com/651434092qq/p/11015901.html

```bash
EMAIL=email@outlook.com
USERNAME=username

git config --global user.email $EMAIL
git config --global user.name $USERNAME

git rebase -i HEAD~3
# modify 'pick' to 'edit' and then ':wq'

git commit --amend --reset-author

git log
# check commit author

git rebase --continue
```

## Transfer repository

```bash
git clone --bare https://gitee.com/mygit-demo/test.git
cd test.git
git push --mirror https://gitee.com/mygit-demo/git-demo.git
```

## Tag

```bash
# add tag
git tag **v0.1.0**

# rm local tag
git tag -d **v0.1.0**

# rm remote tag
git push origin :refs/tags/**v0.1.0**
Commit without git-hooks
git commit . -m "quick fix" --no-verify
```

## Rebase first commit

```bash
git rebase -i --root
```

## 推送本地到远程新分支

```bash
git push origin master:new_branch_name
```
