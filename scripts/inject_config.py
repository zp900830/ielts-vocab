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
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_KEY", "").strip() or os.environ.get("SUPABASE_ANON_KEY", "").strip()

    missing = []
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_KEY (or SUPABASE_ANON_KEY)")
    if missing:
        print("WARN: Missing environment variables:", ", ".join(missing), file=sys.stderr)
        print("      Writing empty config.js. Cloud sync will be disabled until variables are set.", file=sys.stderr)
        if args.check:
            return 1

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
