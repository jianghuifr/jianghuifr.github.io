---
title: SCPI
date: 2024-01-01 00:00:00
tags:
     - demo
categories: [嵌入式]

---

## 简介

SCPI (Standard Commands for Programmable Instrument) 是IEEE 488.2上的可程控仪器标准指令集。SCPI命令分为两个部分：IEEE 488.2公用命令和SCPI仪器特定控制命令。

公用命令是IEEE 488.2规定的仪器必须支持的命令，其句法和语义均遵循IEEE 488.2的规定。公用命令与测量无关，用来控制重设、自我测试和状态操作。

SCPI仪器特定控制命令用于测量、读取数据及切换开关等工作。


## 程控电源控制API

```python
import serial


class Power(object):
    def __init__(self, portx: str = "COM3", bps: int = 9600, timeout: float = 5.0) -> None:
        self._ser = serial.Serial(portx, bps, timeout=timeout)

    def read(self) -> str:
        output = b""
        while True:
            buffer = self._ser.read()
            if buffer == b"\n":
                break
            output += buffer
        return output.decode("utf-8")

    def write(self, command: str) -> None:
        self._ser.write(command.encode("utf-8"))
        self._ser.write(b"\n")

    def on(self):
        return self.write(":OUTP ON")

    def off(self):
        return self.write(":OUTP OFF")

    @property
    def v(self):
        self.write(":MEAS?")
        return self.read()

    @v.setter
    def v(self, value: float):
        return self.write(f":VOLT {value}")

    @property
    def a(self):
        self.write(":MEAS:CURR?")
        return self.read()

    @a.setter
    def a(self, value: float):
        return self.write(f":CURR {value}")

    @property
    def w(self):
        self.write(":MEAS:POW?")
        return self.read()

    def __str__(self) -> str:
        return f"<{self.__class__.__name__} v={self.v} a={self.a}>"

    __repr__ = __str__


if __name__ == "__main__":
    import time

    power = Power()
    print(power)
    print(power.v, power.a, power.w)
    power.off()
    print(power.v, power.a, power.w)
    time.sleep(5)
    print(power.v, power.a, power.w)
    power.on()
    print(power.v, power.a, power.w)
```
