#!/usr/bin/env python3
"""Export recent Xiaoyou speaking topic context from the local backend API."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[4]
CATEGORY_FILE = PROJECT_ROOT / "src/main/java/com/xiaoyouyingyu/config/TopicCategoryConstants.java"
DEFAULT_API_BASE = "http://localhost:8080/api"


class BackendApiError(RuntimeError):
    error_type = "backend_api_error"

    def __init__(self, message: str, hint: str | None = None):
        super().__init__(message)
        self.hint = hint


class SandboxNetworkError(BackendApiError):
    error_type = "sandbox_network_disabled"


class BackendUnavailableError(BackendApiError):
    error_type = "backend_unavailable"


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_categories() -> list[str]:
    text = read_text(CATEGORY_FILE)
    match = re.search(r"CATEGORY_ORDER\s*=\s*List\.of\((.*?)\);", text, re.S)
    if not match:
        return []
    return re.findall(r'"([^"]+)"', match.group(1))


def normalize_question_sample(raw: object, limit: int = 3) -> list[dict[str, str]]:
    if raw is None:
        return []
    try:
        questions = json.loads(raw if isinstance(raw, str) else raw.decode("utf-8"))
    except Exception:
        return []
    if not isinstance(questions, list):
        return []
    sample = []
    for item in questions[:limit]:
        if isinstance(item, dict):
            sample.append({"en": str(item.get("en", "")), "zh": str(item.get("zh", ""))})
        else:
            sample.append({"en": str(item), "zh": ""})
    return sample


def api_get(api_base: str, path: str, params: dict[str, object] | None = None) -> object:
    url = f"{api_base.rstrip('/')}/{path.lstrip('/')}"
    if params:
        url = f"{url}?{urlencode(params)}"

    request = Request(url, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace").strip()
        raise BackendApiError(f"Backend API returned HTTP {exc.code} for {url}: {detail}") from exc
    except URLError as exc:
        reason = exc.reason
        if isinstance(reason, PermissionError):
            raise SandboxNetworkError(
                f"Network access is blocked for this script process while querying {url}: {reason}",
                "The local backend may be running, but Codex sandbox networking is disabled for this Python process. "
                "Run the script outside the sandbox or approve an escalated run for the local export script.",
            ) from exc
        raise BackendUnavailableError(
            f"Cannot reach local backend API at {url}: {reason}",
            "Start the local Xiaoyou backend service, check the port/base URL, or set XIAOYOU_API_BASE/--base-url.",
        ) from exc
    except json.JSONDecodeError as exc:
        raise BackendApiError(f"Local backend API returned non-JSON for {url}: {exc}") from exc


def fetch_topic_page(api_base: str, page: int, size: int) -> dict[str, object]:
    data = api_get(api_base, "/topics", {"page": page, "size": size})
    if not isinstance(data, dict) or "content" not in data:
        raise RuntimeError("Unexpected /topics response shape from local backend API.")
    return data


def fetch_all_topic_summaries(api_base: str, page_size: int) -> list[dict[str, object]]:
    first_page = fetch_topic_page(api_base, 0, page_size)
    topics = list(first_page.get("content", []))
    total_pages = int(first_page.get("totalPages") or 1)
    for page in range(1, total_pages):
        topics.extend(fetch_topic_page(api_base, page, page_size).get("content", []))
    return topics


def fetch_topic_detail(api_base: str, topic: dict[str, object]) -> dict[str, object]:
    topic_id = topic.get("id")
    if topic_id is None:
        return topic
    detail = api_get(api_base, f"/topics/{topic_id}")
    if not isinstance(detail, dict):
        return topic
    return detail


def normalize_topic(row: dict[str, object]) -> dict[str, object]:
    return {
        "id": row.get("id"),
        "title": row.get("title"),
        "title_zh": row.get("titleZh") or row.get("title_zh"),
        "tags": row.get("tags"),
        "event_date": str(row.get("eventDate") or row.get("event_date")),
        "question_sample": normalize_question_sample(row.get("questions")),
    }


def fetch_topics(api_base: str, limit: int, page_size: int) -> dict[str, object]:
    since = date.today() - timedelta(days=365)
    summaries = fetch_all_topic_summaries(api_base, page_size)
    recent_summaries = summaries[:limit]
    past_year_summaries = [
        topic for topic in summaries
        if str(topic.get("eventDate") or topic.get("event_date") or "") >= since.isoformat()
    ][:limit]

    detail_by_id: dict[object, dict[str, object]] = {}
    for topic in recent_summaries + past_year_summaries:
        topic_id = topic.get("id")
        if topic_id not in detail_by_id:
            detail_by_id[topic_id] = fetch_topic_detail(api_base, topic)

    return {
        "since": since.isoformat(),
        "past_year": [normalize_topic(detail_by_id.get(topic.get("id"), topic)) for topic in past_year_summaries],
        "recent": [normalize_topic(detail_by_id.get(topic.get("id"), topic)) for topic in recent_summaries],
    }


def summarize(data: dict[str, object], categories: list[str]) -> dict[str, object]:
    past_year = data.get("past_year", [])
    tag_counter: Counter[str] = Counter()
    for topic in past_year:
        for tag in str(topic.get("tags") or "").split(","):
            tag = tag.strip()
            if tag:
                tag_counter[tag] += 1
    return {
        "project_root": str(PROJECT_ROOT),
        "categories": categories,
        "past_year_since": data.get("since"),
        "past_year_count_in_sample": len(past_year),
        "tag_counts_in_sample": dict(tag_counter),
        "past_year_topics": past_year,
        "recent_topics": data.get("recent", []),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=80, help="Maximum topics per query.")
    parser.add_argument("--base-url", default=None, help="Backend API base URL, defaults to XIAOYOU_API_BASE or http://localhost:8080/api.")
    parser.add_argument("--page-size", type=int, default=300, help="Page size for /topics API requests.")
    parser.add_argument("--json", action="store_true", help="Print compact JSON instead of readable text.")
    args = parser.parse_args()

    api_base = args.base_url or os.getenv("XIAOYOU_API_BASE") or DEFAULT_API_BASE
    categories = extract_categories()
    try:
        data = summarize(fetch_topics(api_base, args.limit, args.page_size), categories)
        data["api_base"] = api_base
    except Exception as exc:
        default_hint = (
            "Start the local Xiaoyou backend service or set XIAOYOU_API_BASE/--base-url, then rerun. "
            "If unavailable, use local code/schema context and tell the user the live backend sample was unavailable."
        )
        fallback = {
            "project_root": str(PROJECT_ROOT),
            "categories": categories,
            "error_type": getattr(exc, "error_type", "unknown_error"),
            "error": str(exc),
            "hint": getattr(exc, "hint", None) or default_hint,
        }
        print(json.dumps(fallback, ensure_ascii=False, indent=None if args.json else 2))
        return 2

    if args.json:
        print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        return 0

    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
