package com.xiaoyouyingyu.config;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class TopicCategoryConstants {
    public static final List<String> CATEGORY_ORDER = List.of(
            "自我成长",
            "情绪心理",
            "人际沟通",
            "生活习惯",
            "学习方法",
            "职场发展",
            "文化旅行",
            "兴趣娱乐",
            "消费科技"
    );

    private static final Set<String> CATEGORY_SET = new LinkedHashSet<>(CATEGORY_ORDER);

    private TopicCategoryConstants() {
    }

    public static String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return "";
        }

        Set<String> parsed = java.util.Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> invalid = parsed.stream()
                .filter(tag -> !CATEGORY_SET.contains(tag))
                .toList();

        if (!invalid.isEmpty()) {
            throw new IllegalArgumentException("分类仅支持：" + String.join("、", CATEGORY_ORDER));
        }

        return CATEGORY_ORDER.stream()
                .filter(parsed::contains)
                .collect(Collectors.joining(","));
    }
}
