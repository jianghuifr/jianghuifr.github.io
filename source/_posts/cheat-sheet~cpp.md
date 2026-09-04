---
title: cpp
date: 2024-01-01 00:00:00
tags:
    - cheat-sheet
    - cpp
categories: [速查表]

---

- 获取、打印环境变量

```cpp
std::cout << "CM_CONFIG_FILE_PATH: " << getenv("CM_CONFIG_FILE_PATH") << std::endl;
```

- std::cout仅可在函数中使用，否则编译时会有以下报错

```txt
error: 'cout' in namespace 'std' does not name a type
```

- 获取随机数

```cpp
#include <iostream>
#include <ctime>

int main() {
    srand(int(time(0)));
    std::cout << rand() % 100 << std::endl;
    return 0;
}
```

- cmake、gtest

```bash
# Ubuntu软件包仅安装源代码，因此您需要自己构建和安装库。
# 但是，从Ubuntu 18.04开始，存在比其他答案中的手动命令更简单的构建和安装方式：
sudo apt install libgtest-dev build-essential cmake
cd /usr/src/googletest
sudo cmake .
sudo cmake --build . --target install
```

- libstdc++.so.6: version `GLIBCXX_3.4.26` not found

```bash
strings /usr/lib/x86_64-linux-gnu/libstdc++.so.6 | grep GLIBC

sudo add-apt-repository ppa:ubuntu-toolchain-r/test
sudo apt update
sudo apt install gcc-9
sudo apt install libstdc++6
```
