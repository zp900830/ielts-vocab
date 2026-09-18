#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""根据环境变量生成 config.js，用于 CI/部署时注入 Supabase 凭证。

用法：
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_KEY=your-anon-key \
  python3 scripts/inject_config.py

也兼容 SUPABASE_ANON_KEY（当 SUPABASE_KEY 不存在时作为 fallback）。
"""
import argparse
import os
import re
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def build_config(url: str, key: str) -> str:
    return (
        "// 本文件由 scripts/inject_config.py 自动生成，请勿手写真实凭证后提交。\n"
        "// config.js 已被 .gitignore 排除。\n"
        "window.IELTS_CONFIG = {\n"
        f"  SUPABASE_URL: {url!r},\n"
        f"  SUPABASE_KEY: {key!r},\n"
        "};\n"
    )


def _has_values(path: str) -> bool:
    """config.js 里是否已经写了非空的凭证（用于避免误清空 git 不跟踪的文件）。"""
    try:
        with open(path, encoding="utf-8") as f:
            body = f.read()
    except OSError:
        return False
    return bool(
        re.search(r"SUPABASE_URL:\s*'\S", body)
        and re.search(r"SUPABASE_KEY:\s*'\S", body)
    )


def write_config(path: str, url: str, key: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(build_config(url, key))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Inject Supabase credentials into config.js from environment variables."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only check that required environment variables are present; do not write files.",
    )
    parser.add_argument(
        "--shadow",
        action="store_true",
        help="Also write shadow/config.js for the shadowing sub-app.",
    )
    parser.add_argument(
        "--output",
        default=os.path.join(ROOT, "config.js"),
        help="Output path for config.js (default: ./config.js).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Allow overwriting a config.js that already has credentials, even though "
             "SUPABASE_URL/SUPABASE_KEY are missing. Off by default: that file is "
             "git-ignored, so an accidental wipe is not recoverable from git.",
    )
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_KEY", "").strip() or os.environ.get("SUPABASE_ANON_KEY", "").strip()

    missing = []
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_KEY (or SUPABASE_ANON_KEY)")

    targets = [args.output]
    if args.shadow:
        targets.append(os.path.join(ROOT, "shadow", "config.js"))

    if missing:
        print("WARN: Missing environment variables:", ", ".join(missing), file=sys.stderr)
        if args.check:
            return 1
        # 没有凭证时不能把已有配置覆盖成空 —— 该文件被 .gitignore 排除，
        # 一旦清空无法从 git 恢复（本地误跑过一次，只能从源码兜底字面量重建）。
        clobber = [t for t in targets if _has_values(t)]
        if clobber and not args.force:
            print("ERROR: 以下文件已有真实凭证，缺环境变量时拒绝覆盖："
                  + ", ".join(os.path.relpath(t, ROOT) for t in clobber), file=sys.stderr)
            print("      确实要清空请加 --force；要写入新值请设 SUPABASE_URL / SUPABASE_KEY。",
                  file=sys.stderr)
            return 1
        print("      Writing empty config.js. Cloud sync will be disabled until variables are set.", file=sys.stderr)

    if args.check:
        print("OK: Supabase credentials are present.")
        return 0

    write_config(args.output, url, key)
    print(f"Wrote {args.output}")

    if args.shadow:
        shadow_path = os.path.join(ROOT, "shadow", "config.js")
        write_config(shadow_path, url, key)
        print(f"Wrote {shadow_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
