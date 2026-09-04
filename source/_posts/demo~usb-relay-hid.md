---
title: usb-relay-hid
date: 2024-01-01 00:00:00
tags:
    - demo
categories: [嵌入式]

---

## 关于

<https://github.com/pavel-a/usb-relay-hid>

<http://vusb.wikidot.com/project:driver-less-usb-relays-hid-interface>

## 使用

```python
import ctypes
from functools import cached_property
from pathlib import Path
from typing import List


class Relay:
    def __init__(self, filepath: str = None):
        filepath = filepath or Path(__file__).parent / "USB_RELAY_DEVICE-64bit.dll"
        self.dll = ctypes.cdll.LoadLibrary(Path(filepath).absolute().as_posix())
        assert self.dll.usb_relay_init() == 0, "init error"

        for func_name, restype, argtypes in [
            (
                "usb_relay_device_enumerate",  # ...
                ctypes.c_void_p,  # ...
                (),  # ...
            ),
            (
                "usb_relay_device_close",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p,),  # ...
            ),
            (
                "usb_relay_device_open_with_serial_number",  # ...
                ctypes.c_void_p,  # ...
                (ctypes.c_char_p, ctypes.c_int),  # ...
            ),
            (
                "usb_relay_device_get_num_relays",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p,),  # ...
            ),
            (
                "usb_relay_device_get_id_string",  # ...
                ctypes.c_char_p,  # ...
                (ctypes.c_void_p,),  # ...
            ),
            (
                "usb_relay_device_next_dev",  # ...
                ctypes.c_void_p,  # ...
                (ctypes.c_void_p,),  # ...
            ),
            (
                "usb_relay_device_get_status_bitmap",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p,),  # ...
            ),
            (
                "usb_relay_device_open_one_relay_channel",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p, ctypes.c_int),  # ...
            ),
            (
                "usb_relay_device_close_one_relay_channel",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p, ctypes.c_int),  # ...
            ),
            (
                "usb_relay_device_close_all_relay_channel",  # ...
                ctypes.c_int,  # ...
                (ctypes.c_void_p,),  # ...
            ),
        ]:
            f = getattr(self.dll, func_name)
            f.restype = restype
            f.argtypes = argtypes

    @cached_property
    def version(self) -> int:
        return self.dll.usb_relay_device_lib_version()

    def exit(self):
        return self.dll.usb_relay_exit()

    def get_device(self, name: str) -> int:
        return self.dll.usb_relay_device_open_with_serial_number(bytes(name, "ascii"), 5)

    def get_device_names(self) -> List[str]:
        result = []
        enum_info = self.dll.usb_relay_device_enumerate()
        while enum_info:
            idstrp = self.dll.usb_relay_device_get_id_string(enum_info)
            idstr = str(ctypes.string_at(idstrp), "ascii")
            result.append(idstr)
            enum_info = self.dll.usb_relay_device_next_dev(enum_info)
        return result

    def device_channel_nums(self, device: int) -> int:
        return self.dll.usb_relay_device_get_num_relays(device)

    def device_close(self, device: int):
        return self.dll.usb_relay_device_close(device)

    def device_status(self, device: int) -> int:
        return self.dll.usb_relay_device_get_status_bitmap(device)

    def device_close_all_channels(self, device: int):
        return self.dll.usb_relay_device_close_all_relay_channel(device)

    def device_close_channel(self, device: int, index: int):
        return self.dll.usb_relay_device_close_one_relay_channel(device, index)

    def device_open_channel(self, device: int, index: int):
        return self.dll.usb_relay_device_open_one_relay_channel(device, index)

    def power_on(self, index=1):
        return self.device_open_channel(self.get_device(self.get_device_names()[0]), index)

    def power_off(self, index=1):
        return self.device_close_channel(self.get_device(self.get_device_names()[0]), index)


if __name__ == "__main__":
    import time

    relay = Relay()
    print(relay.get_device_names())
    for device_name in relay.get_device_names():
        device = relay.get_device(name=device_name)

        relay.device_close_all_channels(device)
        print(f"{relay.device_status(device)=:04b}")
        time.sleep(1)

        for i in range(relay.device_channel_nums(device)):
            print(f"{i=}")
            relay.device_open_channel(device, i + 1)
            print(f"{relay.device_status(device)=:04b}")
            time.sleep(1)
        for i in range(relay.device_channel_nums(device)):
            print(f"{i=}")
            relay.device_close_channel(device, i + 1)
            print(f"{relay.device_status(device)=:04b}")
            time.sleep(1)

        relay.device_close(device)
    relay.exit()

    print("power off")
    relay.power_off()
    time.sleep(1)
    print("power on")
    relay.power_on()
    time.sleep(1)
    print("power off")
    relay.power_off()
```
