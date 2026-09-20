-- 2026-09-20 · 影子跟读「学习完成记录」上云：只追加的事件流（第一期）
--
-- 为什么是一张只追加的表：新模型里唯一的事实是「某个词在某个时刻被有效接触 / 被考了一次」，
-- 计划、连续天数、进度条全部由这些事件现算（shadow/js/plan-engine.js 的 replay）。
-- 所以本表**没有 update、没有 delete 策略，也没有 updated_at** —— 多端同时写不冲突，
-- 重放靠 (user_id, event_id) 主键去重，天然幂等。
--
-- 与既有表的关系：public.user_data 继续存书签与续读位（那是「位置」，会被覆盖，适合 upsert）；
-- 本表存「发生过什么」（不可覆盖，只追加）。两张表互不替换。
--
-- 用法：Supabase 控制台 → 项目 nhqevdkjqzgnyjbijwso → SQL EDITOR → 新建 → 整段粘贴 → RUN。
-- 本文件可重复执行（IF NOT EXISTS / DROP POLICY IF EXISTS）。最后一段是只读核对。

-- ============ 1. 建表 ============
create table if not exists public.shadow_events (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  event_id   text        not null,
  ts         bigint      not null,          -- 客户端 epoch ms；服务端不重写，日界由客户端算
  type       text        not null,          -- contact | quiz | promote | flag | dayplan | relearn
  payload    jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

comment on table public.shadow_events is
  '影子跟读的学习完成事件流：只追加，不更新不删除。计划与一切派生数在客户端由事件重放现算。';
comment on column public.shadow_events.event_id is
  '客户端算的内容哈希（ShadowPlan.eventId）。同一事件重复上传靠主键合并，所以不需要 upsert 冲突处理以外的去重。';
comment on column public.shadow_events.ts is
  '客户端毫秒时间戳。日界（默认凌晨 4 点）由客户端解释，服务端只按它排序。';

-- 拉取时的主查询：某用户从某个 ts 起的事件，按时间升序
create index if not exists shadow_events_user_ts on public.shadow_events (user_id, ts);

-- ============ 2. RLS：只能读自己的、只能写自己的 ============
alter table public.shadow_events enable row level security;

drop policy if exists "shadow_events self select" on public.shadow_events;
create policy "shadow_events self select" on public.shadow_events
  for select using (auth.uid() = user_id);

drop policy if exists "shadow_events self insert" on public.shadow_events;
create policy "shadow_events self insert" on public.shadow_events
  for insert with check (auth.uid() = user_id);

-- 故意**不写** update / delete 策略：事件流只追加。
-- 要清空自己的记录 = 删账户（on delete cascade 会带走）；
-- 前端如果发 update/delete，会被 RLS 直接拒掉，这是预期行为，不是 bug。

-- ============ 3. 只读核对（跑完看结果） ============
select table_name, policy_name, cmd, qual is not null as has_using, with_check is not null as has_check
from pg_policies where schemaname = 'public' and table_name = 'shadow_events'
order by cmd, policy_name;

select 'shadow_events 现有行数' as check, count(*) from public.shadow_events;
