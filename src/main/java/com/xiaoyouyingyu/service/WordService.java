package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.WordTopicRepository;
import com.xiaoyouyingyu.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WordService {
    private final WordRepository wordRepository;
    private final WordBookService wordBookService;
    private final WordAudioService wordAudioService;
    private final WordTopicRepository wordTopicRepository;

    public Page<Word> search(Long bookId, WordDifficulty difficulty, WordStatus status, Long sourceTopicId, String keyword, Pageable pageable) {
        wordBookService.getRequired(bookId);
        return wordRepository.search(bookId, difficulty, status, sourceTopicId, blankToNull(keyword), pageable);
    }

    public Word getRequired(Long id) {
        return wordRepository.findById(id)
                .filter(word -> !word.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("单词不存在"));
    }

    @Transactional
    public Word create(Long bookId, Word word) {
        return create(bookId, word, null);
    }

    @Transactional
    public Word create(Long bookId, Word word, Long ttsModelId) {
        WordBook book = wordBookService.getRequired(bookId);
        Word saved = createWithoutAudio(book, word);
        wordAudioService.generateAllAudio(saved, ttsModelId);
        return wordRepository.save(saved);
    }

    @Transactional
    public Word createWithoutAudio(Long bookId, Word word) {
        return createWithoutAudio(wordBookService.getRequired(bookId), word);
    }

    @Transactional
    public Word createWithoutAudio(WordBook book, Word word) {
        Long bookId = book.getId();
        String normalized = Word.normalize(word.getWord());
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("英文单词不能为空");
        }
        wordRepository.findByWordBookIdAndNormalizedWordAndDeletedFalse(bookId, normalized).ifPresent(existing -> {
            throw new IllegalArgumentException("同一单词本内已存在该单词");
        });
        word.setId(null);
        word.setWordBook(book);
        word.setNormalizedWord(normalized);
        word.setDifficulty(difficultyForBook(book));
        if (word.getStatus() == null) word.setStatus(WordStatus.DRAFT);
        wordAudioService.markPending(word);
        return wordRepository.saveAndFlush(word);
    }

    @Transactional
    public Word update(Long id, Word updated) {
        Word word = getRequired(id);
        String normalized = Word.normalize(updated.getWord());
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("英文单词不能为空");
        }
        wordRepository.findByWordBookIdAndNormalizedWordAndDeletedFalse(word.getWordBook().getId(), normalized)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("同一单词本内已存在该单词");
                });

        word.setWord(updated.getWord());
        word.setNormalizedWord(normalized);
        word.setDifficulty(difficultyForBook(word.getWordBook()));
        word.setStatus(updated.getStatus());
        word.setPhonetic(updated.getPhonetic());
        word.setPartOfSpeech(updated.getPartOfSpeech());
        word.setDefinitionZh(updated.getDefinitionZh());
        word.setDefinitionEn(updated.getDefinitionEn());
        word.setCommonPatterns(updated.getCommonPatterns());
        word.setExampleEn(updated.getExampleEn());
        word.setExampleZh(updated.getExampleZh());
        word.setSourceScene(updated.getSourceScene());
        word.setSourceTopicId(updated.getSourceTopicId());
        word.setSourceTopicTitle(updated.getSourceTopicTitle());
        word.setAudioUsUrl(updated.getAudioUsUrl());
        word.setAudioUkUrl(updated.getAudioUkUrl());
        word.setExampleAudioUsUrl(updated.getExampleAudioUsUrl());
        word.setExampleAudioUkUrl(updated.getExampleAudioUkUrl());
        if (updated.getAudioStatus() != null) word.setAudioStatus(updated.getAudioStatus());
        word.setAudioError(updated.getAudioError());
        if (updated.getSortOrder() != null) word.setSortOrder(updated.getSortOrder());
        return wordRepository.save(word);
    }

    @Transactional
    public void softDelete(Long id) {
        Word word = getRequired(id);
        word.setDeleted(true);
        word.setStatus(WordStatus.OFFLINE);
        wordRepository.save(word);
    }

    @Transactional
    public int batchStatus(Collection<Long> ids, WordStatus status) {
        List<Word> words = wordRepository.findByIdInAndDeletedFalse(ids);
        words.forEach(word -> word.setStatus(status));
        wordRepository.saveAll(words);
        return words.size();
    }

    @Transactional
    public int batchDelete(Collection<Long> ids) {
        List<Word> words = wordRepository.findByIdInAndDeletedFalse(ids);
        words.forEach(word -> {
            word.setDeleted(true);
            word.setStatus(WordStatus.OFFLINE);
        });
        wordRepository.saveAll(words);
        return words.size();
    }

    @Transactional
    public int batchSort(List<Map<String, Object>> items) {
        int count = 0;
        for (Map<String, Object> item : items) {
            Long id = toLong(item.get("id"));
            Integer sortOrder = item.get("sortOrder") == null ? null : ((Number) item.get("sortOrder")).intValue();
            if (id == null || sortOrder == null) continue;
            Word word = getRequired(id);
            word.setSortOrder(sortOrder);
            wordRepository.save(word);
            count++;
        }
        return count;
    }

    @Transactional
    public int regenerateAudio(Collection<Long> ids) {
        return regenerateAudio(ids, null);
    }

    @Transactional
    public int regenerateAudio(Collection<Long> ids, Long ttsModelId) {
        List<Word> words = wordRepository.findByIdInAndDeletedFalse(ids);
        words.forEach(word -> wordAudioService.generateAllAudio(word, ttsModelId));
        wordRepository.saveAll(words);
        return words.size();
    }

    public Map<String, Object> toResponse(Word word) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", word.getId());
        response.put("wordBookId", word.getWordBook().getId());
        response.put("word", word.getWord());
        response.put("normalizedWord", word.getNormalizedWord());
        response.put("difficulty", word.getDifficulty());
        response.put("status", word.getStatus());
        response.put("phonetic", word.getPhonetic());
        response.put("partOfSpeech", word.getPartOfSpeech());
        response.put("definitionZh", word.getDefinitionZh());
        response.put("definitionEn", word.getDefinitionEn());
        response.put("commonPatterns", word.getCommonPatterns());
        response.put("exampleEn", word.getExampleEn());
        response.put("exampleZh", word.getExampleZh());
        response.put("sourceScene", word.getSourceScene());
        response.put("sourceTopicId", word.getSourceTopicId());
        response.put("sourceTopicTitle", word.getSourceTopicTitle());
        response.put("sourceTopics", wordTopicRepository.findByWordIdOrderByCreatedAtAsc(word.getId()).stream().map(topic -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("topicId", topic.getTopic().getId());
            item.put("titleEn", topic.getTopicTitleEn());
            item.put("titleZh", topic.getTopicTitleZh());
            return item;
        }).toList());
        response.put("audioUsUrl", word.getAudioUsUrl());
        response.put("audioUkUrl", word.getAudioUkUrl());
        response.put("exampleAudioUsUrl", word.getExampleAudioUsUrl());
        response.put("exampleAudioUkUrl", word.getExampleAudioUkUrl());
        response.put("audioStatus", word.getAudioStatus());
        response.put("audioError", word.getAudioError());
        response.put("sortOrder", word.getSortOrder());
        response.put("createdAt", word.getCreatedAt());
        response.put("updatedAt", word.getUpdatedAt());
        return response;
    }

    public WordDifficulty difficultyForBook(WordBook book) {
        return book.getLevel() == WordBookLevel.ADVANCED ? WordDifficulty.ADVANCED : WordDifficulty.BEGINNER;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }
}
