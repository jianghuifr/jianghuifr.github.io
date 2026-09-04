---
title: 装饰器执行顺序
date: 2024-01-01 00:00:00
tags:
    - python
photos:
    - /images/python.png
categories: [Python]

---

```python
def A(fn):
    print("A - 2")

    def run():
        print("A - 3")
        fn()
        print("A - 9")

    return run


def B(fn):
    print("B - 1")

    def run():
        print("B - 4")
        fn()
        print("B - 8")

    return run


def C(fn):
    print("C - 0")

    def run():
        print("C - 5")
        fn()
        print("C - 7")

    return run


@A
@B
@C
def func():
    print("func - 6")


if __name__ == '__main__':
    func()
```

```text
C - 0
B - 1
A - 2
A - 3
B - 4
C - 5
func - 6
C - 7
B - 8
A - 9
```
