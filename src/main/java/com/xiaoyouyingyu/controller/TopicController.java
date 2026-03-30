package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.Topic;
import com.xiaoyouyingyu.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {
    private final TopicRepository topicRepository;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Authentication auth) {
        Page<Topic> topics = topicRepository.search(keyword, tag, startDate, endDate,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventDate")));

        boolean isGuest = (auth == null);
        if (isGuest) {
            // Guest only sees titles
            var simplified = topics.map(t -> Map.of(
                    "id", t.getId(),
                    "title", t.getTitle(),
                    "eventDate", t.getEventDate(),
                    "tags", t.getTags() != null ? t.getTags() : ""));
            return ResponseEntity.ok(simplified);
        }
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/tags")
    public ResponseEntity<?> tags() {
        List<Topic> all = topicRepository.findAll(Sort.by(Sort.Direction.DESC, "eventDate"));
        Map<String, Map<String, Object>> tagInfo = new LinkedHashMap<>();
        for (Topic t : all) {
            if (t.getTags() == null || t.getTags().isBlank()) continue;
            for (String tag : t.getTags().split(",")) {
                tag = tag.trim();
                if (tag.isEmpty()) continue;
                tagInfo.computeIfAbsent(tag, k -> {
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("count", 0L);
                    info.put("latestTitle", t.getTitle());
                    return info;
                });
                tagInfo.get(tag).put("count", (Long) tagInfo.get(tag).get("count") + 1);
            }
        }
        return ResponseEntity.ok(tagInfo);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        Optional<LocalDate> earliest = topicRepository.findEarliestEventDate();
        long days = earliest.map(d -> ChronoUnit.DAYS.between(d, LocalDate.now())).orElse(0L);
        return ResponseEntity.ok(Map.of("days", days));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return topicRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/calendar")
    public ResponseEntity<?> calendar(@RequestParam int year, @RequestParam int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        List<Topic> topics = topicRepository.findByEventDateBetween(start, end);
        Map<LocalDate, List<Map<String, Object>>> grouped = topics.stream()
                .collect(Collectors.groupingBy(Topic::getEventDate,
                        Collectors.mapping(t -> Map.<String, Object>of("id", t.getId(), "title", t.getTitle()),
                                Collectors.toList())));
        return ResponseEntity.ok(grouped);
    }
}
