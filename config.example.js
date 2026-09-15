// 本地 Supabase 配置
// 复制本文件为 config.js 并填入真实凭证
// config.js 已被 .gitignore 排除，不会进入版本控制
//
// 部署/CI 注入方式：
//   SUPABASE_URL=https://your-project.supabase.co \
//   SUPABASE_KEY=your-anon-key \
//   python3 scripts/inject_config.py
// 如需同时生成 shadow/config.js，加上 --shadow
window.IELTS_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_KEY: 'your-anon-key',
};
