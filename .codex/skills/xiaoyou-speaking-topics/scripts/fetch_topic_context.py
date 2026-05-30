#!/usr/bin/env python3
"""Fetch Xiaoyou topic context through the local backend HTTP API.

This helper intentionally avoids direct database access. It collects recent topic
metadata from /api/topics and then fetches each topic detail from /api/topics/{id}
so generated topics can reflect existing questions and tag style.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def request_json(base_url: str, path: str, params: dict[str, Any] | None = None, timeout: float = 10.0) -> Any:
    query = ""
    if params:
        clean = {k: v for k, v in params.items() if v is not None}
        query = "?" + urllib.parse.urlencode(clean)
    url = base_url.rstrip("/") + path + query
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(charset))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch recent Xiaoyou speaking-topic context via local backend APIs.")
    parser.add_argument("--base-url", default="http://localhost:8080", help="Local backend base URL")
    parser.add_argument("--days", type=int, default=365, help="Recent window in days")
    parser.add_argument("--max-topics", type=int, default=200, help="Maximum topics to return")
    parser.add_argument("--page-size", type=int, default=100, help="Page size for /api/topics")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    return parser.parse_args()


def normalize_topic(topic: dict[str, Any]) -> dict[str, Any]:
    questions = topic.get("questions")
    parsed_questions: Any = questions
    if isinstance(questions, str):
        try:
            parsed_questions = json.loads(questions)
        except json.JSONDecodeError:
            parsed_questions = questions
    return {
        "id": topic.get("id"),
        "title": topic.get("title"),
        "titleZh": topic.get("titleZh"),
        "tags": topic.get("tags") or "",
        "eventDate": topic.get("eventDate"),
        "questions": parsed_questions,
    }


def main() -> int:
    args = parse_args()
    today = dt.date.today()
    start = today - dt.timedelta(days=args.days)

    try:
        tags = request_json(args.base_url, "/api/topics/tags")
        topics: list[dict[str, Any]] = []
        seen_ids: set[Any] = set()
        page = 0

        while len(topics) < args.max_topics:
            data = request_json(
                args.base_url,
                "/api/topics",
                {
                    "page": page,
                    "size": args.page_size,
                    "startDate": start.isoformat(),
                    "endDate": today.isoformat(),
                },
            )
            content = data.get("content", []) if isinstance(data, dict) else []
            if not content:
                break

            for item in content:
                topic_id = item.get("id")
                if topic_id in seen_ids:
                    continue
                seen_ids.add(topic_id)
                try:
                    detail = request_json(args.base_url, f"/api/topics/{topic_id}")
                except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as detail_error:
                    detail = dict(item)
                    detail["detailFetchError"] = str(detail_error)
                topics.append(normalize_topic(detail))
                if len(topics) >= args.max_topics:
                    break

            total_pages = data.get("totalPages") if isinstance(data, dict) else None
            page += 1
            if total_pages is not None and page >= int(total_pages):
                break

        output = {
            "source": "local-backend-api",
            "baseUrl": args.base_url.rstrip("/"),
            "window": {"startDate": start.isoformat(), "endDate": today.isoformat(), "days": args.days},
            "allowedCategories": ["个人成长", "情绪心理", "人际交往", "生活方式", "职场发展", "学习提升", "文化旅行", "消费科技"],
            "tagStats": tags,
            "topicCount": len(topics),
            "topics": topics,
        }
        print(json.dumps(output, ensure_ascii=False, indent=2 if args.pretty else None))
        return 0
    except urllib.error.URLError as error:
        print(
            json.dumps(
                {
                    "error": "Could not reach local backend API",
                    "baseUrl": args.base_url,
                    "detail": str(error),
                    "nextStep": "Start the local Spring Boot backend, then rerun this script. Do not query the database directly.",
                },
                ensure_ascii=False,
                indent=2,
            ),
            file=sys.stderr,
        )
        return 2
    except json.JSONDecodeError as error:
        print(json.dumps({"error": "Backend did not return valid JSON", "detail": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
