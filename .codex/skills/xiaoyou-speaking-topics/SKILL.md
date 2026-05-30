---
name: xiaoyou-speaking-topics
description: Project-local skill for /Users/admin/code/github/xiaoyouyingyu2 only. Use only when the user explicitly invokes $xiaoyou-speaking-topics or names this exact skill, to generate Xiaoyou English speaking-topic candidates and follow-up discussion questions based on the current project's existing topics, questions, and category tags.
---

# Xiaoyou Speaking Topics

Generate oral-English discussion topics for this Xiaoyou English project by grounding every run in the project's existing `topics` data and category taxonomy.

## Scope

- Treat this skill as project-local. Work only inside `/Users/admin/code/github/xiaoyouyingyu2` unless the user explicitly asks otherwise.
- Do not use this skill implicitly. The frontmatter already narrows triggering; if the user did not explicitly invoke `$xiaoyou-speaking-topics`, do not apply this workflow.
- Use the existing category tags from `src/main/java/com/xiaoyouyingyu/config/TopicCategoryConstants.java`: `自我成长`, `情绪心理`, `人际沟通`, `生活习惯`, `学习方法`, `职场发展`, `文化旅行`, `兴趣娱乐`, `消费科技`.

## Data First

Before proposing topics, inspect current project data:

1. Run `scripts/export_topic_context.py` from this skill folder.
2. Use the exported summary to understand recent titles, Chinese titles, tags, dates, and representative questions.
3. The script queries the running local backend service, not the database directly. Make sure the Xiaoyou backend is running before using this skill.
4. If the local backend API is unavailable, inspect local schema/code and clearly say the live backend sample was unavailable before continuing with best-effort output.

The script defaults to `http://localhost:8080/api` and calls the project's existing topic endpoints, especially `/topics` and `/topics/{id}`. It exports the most recent topics plus topics from the past year. Use `XIAOYOU_API_BASE` or `--base-url` when the local backend runs on another address or port.

## Topic Proposal Workflow

Support two modes:

- Autonomous mode: The user asks for topics without a direction. Generate broadly useful topics that fit existing category style.
- Directed mode: The user gives a direction. Generate topics related to that direction while still staying inside one of the existing category tags.

When proposing topics:

- Give exactly 5 candidate topics.
- For each topic, include English title, Chinese title, one existing category tag, and a short reason.
- Avoid topics highly similar to any topic from the past year. Compare against both English and Chinese titles and the typical question angle.
- Keep topics broad enough that most adult learners can speak from personal experience.
- Avoid topics that target only a narrow identity, job, location, relationship status, spending level, or life stage.
- Avoid topics that are too abstract (`life meaning`, `the future of humanity`) or too tiny (`which app button do you press first in the morning`).
- Match the style of the existing topic data: practical daily-life entry points with room for light reflection.
- Stop after the 5 candidates and ask the user to choose one topic before generating questions.

## Question Generation Workflow

After the user chooses one proposed topic:

- Generate exactly 8 questions.
- Use the selected topic's category tag.
- Provide each question in English with a concise Chinese translation.
- Order questions from easiest and most conversational to more reflective.
- Keep early questions answerable in one or two simple sentences.
- Make later questions invite reasons, tradeoffs, comparisons, values, or behavior change.
- Keep questions tied to everyday life. Avoid questions that are too abstract, too technical, too private, or too detailed.
- Do not generate a new set of 5 topics unless the user asks for another round.

## Output Shape

For the 5-topic stage, use:

```markdown
1. English Title / 中文标题
   Tag: 分类标签
   Why: short reason
```

For the 8-question stage, use:

```markdown
Topic: English Title / 中文标题
Tag: 分类标签

1. English question?
   中文问题？
```

Keep the tone natural and usable for speaking practice. Do not add database implementation details unless relevant to a failure or the user asks.
