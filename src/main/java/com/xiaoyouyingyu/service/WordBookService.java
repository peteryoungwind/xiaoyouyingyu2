package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.WordBookRepository;
import com.xiaoyouyingyu.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WordBookService {
    private final WordBookRepository wordBookRepository;
    private final WordRepository wordRepository;
    private final com.xiaoyouyingyu.repository.WordBookTopicRepository wordBookTopicRepository;

    public Page<WordBook> list(Pageable pageable) {
        return wordBookRepository.findByDeletedFalseOrderByUpdatedAtDesc(pageable);
    }

    public WordBook getRequired(Long id) {
        return wordBookRepository.findById(id)
                .filter(book -> !book.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("单词本不存在"));
    }

    @Transactional
    public WordBook create(WordBook book, Long createdBy) {
        book.setId(null);
        book.setCreatedBy(createdBy);
        if (book.getStatus() == null) {
            book.setStatus(WordBookStatus.DRAFT);
        }
        return wordBookRepository.save(book);
    }

    @Transactional
    public WordBook update(Long id, WordBook updated) {
        WordBook book = getRequired(id);
        book.setName(updated.getName());
        book.setDescription(updated.getDescription());
        book.setScene(updated.getScene());
        if (updated.getStatus() != null) {
            book.setStatus(updated.getStatus());
        }
        return wordBookRepository.save(book);
    }

    @Transactional
    public WordBook changeStatus(Long id, WordBookStatus status) {
        WordBook book = getRequired(id);
        book.setStatus(status);
        return wordBookRepository.save(book);
    }

    @Transactional
    public void softDelete(Long id) {
        WordBook book = getRequired(id);
        book.setDeleted(true);
        book.setStatus(WordBookStatus.OFFLINE);
        wordBookRepository.save(book);
    }

    public Map<String, Object> stats(Long bookId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalWords", wordRepository.countByWordBookIdAndDeletedFalse(bookId));
        stats.put("beginnerWords", wordRepository.countByWordBookIdAndDeletedFalseAndDifficulty(bookId, WordDifficulty.BEGINNER));
        stats.put("advancedWords", wordRepository.countByWordBookIdAndDeletedFalseAndDifficulty(bookId, WordDifficulty.ADVANCED));
        stats.put("publishedWords", wordRepository.countByWordBookIdAndDeletedFalseAndStatus(bookId, WordStatus.PUBLISHED));
        stats.put("linkedTopicWords", wordRepository.countByWordBookIdAndDeletedFalseAndSourceTopicIdIsNotNull(bookId));
        stats.put("linkedTopics", wordBookTopicRepository.countByWordBookId(bookId));
        return stats;
    }

    public Map<String, Object> toResponse(WordBook book) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", book.getId());
        response.put("name", book.getName());
        response.put("description", book.getDescription());
        response.put("scene", book.getScene());
        response.put("status", book.getStatus());
        response.put("createdBy", book.getCreatedBy());
        response.put("createdAt", book.getCreatedAt());
        response.put("updatedAt", book.getUpdatedAt());
        response.put("stats", stats(book.getId()));
        return response;
    }
}
