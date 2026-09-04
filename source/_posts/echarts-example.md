---
title: ECharts 示例
date: 2026-07-30 23:30:00
tags: [echarts]
categories: [可视化]

---

## 柱状图

```echarts
{
  "title": { "text": "月度销售" },
  "xAxis": { "data": ["1月","2月","3月","4月","5月","6月"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [5,20,36,10,10,20] }]
}
```

## 折线图

```echarts
{
  "title": { "text": "CPU 使用率" },
  "xAxis": { "type": "category", "data": ["00:00","04:00","08:00","12:00","16:00","20:00"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [15,12,8,45,62,38], "type": "line", "smooth": true }]
}
```

## 饼图

```echarts
{
  "title": { "text": "流量来源" },
  "series": [{
    "type": "pie",
    "data": [
      { "value": 335, "name": "直接访问" },
      { "value": 310, "name": "搜索引擎" },
      { "value": 234, "name": "社交媒体" },
      { "value": 135, "name": "邮件推广" }
    ]
  }]
}
```
