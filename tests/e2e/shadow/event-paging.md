# 云端事件补拉：必须翻页拉到满

- App: shadow
- Environment: local, preview
- Tags: @regression @shadow
- Written: 2026-09-24
- Spec: `docs/PRD.md` §12（云同步：拉回未见过的事件 → 本地重放）

## Summary

2026-09-24 实测的 P1：`cloudPull` 写死 `.range(0, 1999)`（全文件只有这一处 `.range(`）。
第二台设备永远只拿到**最老的** 2000 条，之后的事件再也到不了 —— PRD §12 的「多设备一致」
在这条上不成立。修法：按 `ts` 升序每页 1000 条翻页，拉到**不满一页**为止；中途某页失败就用
手上已有的（不把整次补拉作废）；40 万条上限只是防异常数据把循环拖死的止损。

## Preconditions

- Standard shadow preconditions（见 area conventions）
- **不连真 Supabase** —— 只把 `CLOUD.client()` 换成一个假客户端，其余按真客户端的形状给

## Before Hook

### Setup 1. 开页
打开 `/index.html`，等第一句可见。

## Test Steps

### 1. 服务端 2300 条要分多页拉回来，一条不落
- `TASK.resetV2()`
- 造 2300 条 `contact` 行（`SERVER_TOTAL = 2300`，**故意跨过旧的那个 1999 上限**）
- 把 `CLOUD.client()` 换成假客户端：`from→select→eq→order→range(a,b)` 返回 `rows.slice(a, b+1)`，
  每次调用把 `a-b` 记进 `pages`
- `const r = await TASK.cloudPull()`
- **Verify:**
  - `pages.length > 1`（只请求 1 页 = 又是单页硬上限）
  - `r.got === 2300`
  - `TASK.events().length === 2300`（**本机一条不落**）

## Pass condition

补拉自报 2300、本机拿到 2300，且请求了不止一页。

## 已知未覆盖

- 分页途中某页报错时的降级（用手上已有的）没有断言
- 40 万条止损分支没有断言
- 真 Supabase 的 RLS / 网络超时不在本用例内（那条要登录，见 `bookmark-sync` 的 mock 纪律）

## After Hook
_None —— 用例只在内存里换了 client 引用。_
