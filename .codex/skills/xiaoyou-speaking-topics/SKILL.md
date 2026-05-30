---
name: xiaoyou-speaking-topics
description: Project-local skill for /Users/xiyou/code/xiaoyouyingyu that generates Xiaoyou English speaking topic candidates and follow-up discussion questions only when the user explicitly invokes $xiaoyou-speaking-topics or names this skill. Do not use implicitly.
---

# Xiaoyou Speaking Topics

## Purpose

Generate speaking topics for the Xiaoyou English project by matching the existing database style, categories, and question progression. Use this skill only after explicit invocation.

## Required Workflow

1. Gather current topic context through the local backend service, never through a direct database connection.
2. Produce exactly five candidate topics for the user to choose from.
3. Wait for the user's selection before generating questions.
4. After the user selects a topic, produce exactly eight Chinese-only questions for that topic.

## Gather Context

Use `scripts/fetch_topic_context.py` from this skill directory.

Default command:

```bash
python3 .codex/skills/xiaoyou-speaking-topics/scripts/fetch_topic_context.py --base-url http://localhost:8080 --days 365 --max-topics 200
```

If the backend is not running, start the local backend from the project root, then rerun the script. Do not query MySQL directly. Do not use JDBC, mysql CLI, repository-only scripts, or raw database credentials.

The script fetches:

- `/api/topics` with a one-year date window for recent topic IDs and metadata
- `/api/topics/{id}` for full titles, tags, dates, and questions
- `/api/topics/tags` for existing tag distribution

## Allowed Categories

Use exactly one existing category tag per generated topic unless the user explicitly asks for multi-tag output:

- 个人成长
- 情绪心理
- 人际交往
- 生活方式
- 职场发展
- 学习提升
- 文化旅行
- 消费科技

Prefer categories already represented in the fetched topic context. Do not invent new labels.

## Topic Candidate Rules

Generate five bilingual candidates. Each candidate must include:

- English title
- Chinese title
- One category tag from the allowed list
- A short rationale explaining why it fits the existing style and why it is not too close to recent topics

Constraints:

- Avoid topics highly similar to topics from the last 365 days. Treat same scenario, same core dilemma, or simple wording changes as too similar.
- Match the existing categories and style observed from fetched titles and questions.
- Keep topics broad enough that most learners can speak from everyday experience.
- Avoid niche identity requirements, specialized professions, expensive experiences, or rare life stages.
- Avoid themes that are too abstract, philosophical, tiny, procedural, or trivia-like.
- Keep the topic concrete but flexible: suitable scope examples include habits, choices, communication, routines, learning, travel, technology, work-study balance, emotions, spending, and relationships.

## Generation Modes

Autonomous mode:

- If the user gives no direction, infer gaps and opportunities from recent topics, tag distribution, and question style.
- Balance freshness with familiarity.

Directed mode:

- If the user gives a direction, generate five candidates related to that direction while still obeying the existing categories, non-duplication rules, and everyday speakability constraints.
- If the direction conflicts with the project categories or is too niche, adapt it toward the nearest allowed category and mention the adaptation briefly.

## Selection Response Format

When giving five candidates, do not generate full questions yet. Use this concise structure:

```markdown
1. English Title / 中文标题
Tag: 分类
Why it fits: ...
Different from recent topics: ...
```

End by asking the user to choose one candidate by number or title.

## Question Generation Rules

After the user chooses a topic, generate exactly eight Chinese-only questions as JSON-ready content:

```json
[
  "..."
]
```

Question constraints:

- Questions must progress from simple, conversational, and easy to answer toward deeper reflection.
- Questions 1-2: personal experience, simple preference, daily-life entry points.
- Questions 3-5: examples, reasons, comparisons, small tradeoffs.
- Questions 6-8: broader thinking, values, habits, social effects, or future choices.
- Keep every question connected to daily life and likely learner experiences.
- Avoid questions that are too abstract, too detailed, too technical, too private, or aimed only at a specific group.
- Match the tone of existing topic questions in Chinese: natural, conversational, clear, and not exam-like.

## Similarity Check

Before presenting candidates, compare against fetched recent topics and reject candidates that are:

- Direct synonyms or translations of recent titles
- Same scenario with a narrower adjective added
- Same core question set likely to produce overlapping discussion
- Repeats of a recent category angle when a fresher angle is available

Briefly mention if context could not be fetched fully, and reduce confidence accordingly. Do not fabricate that database context was checked if the local backend was unavailable.
