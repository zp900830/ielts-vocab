-- 2026-09-19 · 给跟读站的 user_data 建表并开启 RLS（另三张表已有策略，本文件只做核对）
--
-- 背景：本仓库 0 个 .sql，建表脚本全在兄弟项目「雅思词汇真经项目/work/admin.sql」。
-- 那份脚本覆盖了 profiles / learning_data / app_settings，唯独 **user_data 没有任何 DDL**
-- —— 而它正是跟读站每天在写的表（shadow/index.html 的 cloudPushMarks/cloudPullMarks：
-- upsert { user_id, marks, pos, updated_at }，onConflict: 'user_id'）。
-- 表不存在或没策略时，前端整段云同步被 try/catch 吞掉，所以你只会觉得「同步没生效」。
--
-- 用法：Supabase 控制台 → 项目 nhqevdkjqzgnyjbijwso → SQL EDITOR → 新建 → 整段粘贴 → RUN。
-- 本文件可重复执行（IF NOT EXISTS / DROP POLICY IF EXISTS / OR REPLACE）。
-- 只读核对放在最后，会打印四张表的 RLS 现状。

-- ============ 1. user_data：建表（跟读站书签 + 续读位） ============
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  marks jsonb not null default '[]'::jsonb,
  pos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_data is
  '影子跟读站的云端进度：marks=书签数组[{i,t,u}]，pos=续读位{chapter,chapterI,i,t}。句子序号按全局句号存。';

-- ============ 2. user_data：开启 RLS + 只允许读写自己那一行 ============
alter table public.user_data enable row level security;

-- 不给 anon 任何权限：未登录时前端本来就会 return（getSession 无 session）
revoke all on table public.user_data from anon;
revoke all on table public.user_data from authenticated;
grant select, insert, update on table public.user_data to authenticated;

drop policy if exists "read own shadow data" on public.user_data;
create policy "read own shadow data" on public.user_data
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "write own shadow data" on public.user_data;
create policy "write own shadow data" on public.user_data
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own shadow data" on public.user_data;
create policy "update own shadow data" on public.user_data
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============ 3. 现状核对（跑完看结果） ============
-- 期望：四张表 relrowsecurity = true；user_data 三条策略、profiles 一条 select、
-- learning_data 一条 for all、app_settings 零条策略（只有 service_role 能碰）。
select c.relname as 表名,
       c.relrowsecurity as 已开rls,
       (select count(*) from pg_policies p where p.tablename = c.relname) as 策略数
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('user_data', 'profiles', 'learning_data', 'app_settings')
order by c.relname;

select tablename, policyname, permissive, cmd, roles::text as 角色, qual as 用检查, with_check as 写检查
from pg_policies
where schemaname = 'public'
  and tablename in ('user_data', 'profiles', 'learning_data', 'app_settings')
order by tablename, policyname;

-- ============ 4.（可选，默认不动）learning_data 的锁死风险 ============
-- admin.sql:89-96 现有策略额外要求「profiles 里有我这一行且 role in (user,admin)」才可读自己的行。
-- profiles 又没有 insert 策略，行只能靠注册触发器生成；一旦触发器丢过（新项目管理台改过
-- auth.users 的权限、或迁移过项目），这个用户连自己的学习数据都读不到，而且前端静默失败。
-- 单人使用场景下这个额外条件没有带来任何安全收益。要放宽就取消下面三行注释后执行：
--
-- drop policy if exists "own row only" on public.learning_data;
-- create policy "own row only" on public.learning_data for all to authenticated
--   using (auth.uid() = user_id) with check (auth.uid() = user_id);
