---
title: logrotate
date: 2024-01-01 00:00:00
tags:
    - logrotate
categories: [速查表]

---

`logrotate`在常见的linux发行版都有安装，正如其名，是用于拆解日志文件的工具

由于之前做了个`gunicorn+flask`的web服务，`gunicorn`生成的日志文件没有做自动拆分，导致时间长了后日志文件非常大，于是经GPT推荐使用上了`logrotate`

## 配置

使用`logrotate`的话，需要创建一个配置文件， 配置文件的逻辑和nginx的很像：

1. 主配置文件：`/etc/logrotate.conf`

```txt
# see "man logrotate" for details
# rotate log files weekly
weekly

# use the syslog group by default, since this is the owning group
# of /var/log/syslog.
su root syslog

# keep 4 weeks worth of backlogs
rotate 4

# create new (empty) log files after rotating old ones
create

# uncomment this if you want your log files compressed
#compress

# packages drop log rotation information into this directory
include /etc/logrotate.d

# no packages own wtmp, or btmp -- we'll rotate them here
/var/log/wtmp {
    missingok
    monthly
    create 0664 root utmp
    rotate 1
}

/var/log/btmp {
    missingok
    monthly
    create 0660 root utmp
    rotate 1
}

# system-specific logs may be configured here
```

从`include /etc/logrotate.d`可以看出，logrotate还会包含`/etc/logrotate.d`目录下的所有子配置文件，比如增加一个gunicorn配置文件

2. 子配置文件`/etc/logrotate.d/gunicorn`

```txt
/app/log/gunicorn.access.log {
    copytruncate
    daily
    dateext
    dateformat .%Y-%m-%d
    dateyesterday
    rotate 30
    missingok
    notifempty
    su username usergroup
}
/app/log/gunicorn.run.log {
    copytruncate
    daily
    dateext
    dateformat .%Y-%m-%d
    dateyesterday
    rotate 30
    missingok
    notifempty
    su username usergroup
}
```

以上配置主要实现：每天拆分一个新的文件，后缀名加上昨天的日期，保存最近30个文件，并且设置文件权限为`username:usergroup`

## 执行

1. 一般情况下`logrotate`是被`crontab`调用执行的，比如daily任务，会按`/etc/cron.daily/logrotate`执行，所以除了新增配置文件`/etc/logrotate.d/gunicorn`外不需要额外的操作

```bash
#!/bin/sh

# Clean non existent log file entries from status file
cd /var/lib/logrotate
test -e status || touch status
head -1 status > status.clean
sed 's/"//g' status | while read logfile date
do
    [ -e "$logfile" ] && echo "\"$logfile\" $date"
done >> status.clean
mv status.clean status

test -x /usr/sbin/logrotate || exit 0
/usr/sbin/logrotate /etc/logrotate.conf
```

2. 如果需要调试，可以手动执行

```bash
logrotate -d /etc/logrotate.d/gunicorn
```

- `-d`表示测试，不会真正执行
- `-f`表示强制执行

## 一些坑

1. 配置文件的权限必须是`root:root`，因为实际上是root用户执行`crontab`时执行的`logrotate`，其他用户的权限不够

2. 执行一次后`gunicorn.run.log`文件丢失：配置文件中需要增加`copytruncate`字段，表示除了归档旧的日志文件`gunicorn.run.log.2023-07-01`外还创建一个新副本`gunicorn.run.log`

3. 每日归档的文件实际没有在0点拆分：需要调整`/etc/crontab`中daily任务的执行时间

```bash
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# m h dom mon dow user        command
17 *        * * *        root    cd / && run-parts --report /etc/cron.hourly
0 0 * * *        root        test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
47 6        * * 7        root        test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
52 6        1 * *        root        test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
```
