package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.repository.UserWordProgressRepository;
import com.xiaoyouyingyu.repository.WordBookRepository;
import com.xiaoyouyingyu.repository.WordRepository;
import com.xiaoyouyingyu.service.wordpractice.WordPracticeRule;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WordPracticeService {
    private final WordBookRepository wordBookRepository;
    private final WordRepository wordRepository;
    private final UserWordProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final WordBookService wordBookService;
    private final WordService wordService;

    public List<Map<String, Object>> listPublishedBooks(String username) {
        User user = getUser(username);
        return wordBookRepository.findByDeletedFalseAndStatusOrderByUpdatedAtDesc(WordBookStatus.PUBLISHED)
                .stream()
                .map(book -> bookResponse(book, user.getId(), WordDifficulty.BEGINNER))
                .toList();
    }

    public Map<String, Object> getBook(Long bookId, String username, WordDifficulty difficulty) {
        User user = getUser(username);
        WordBook book = wordBookService.getRequired(bookId);
        if (book.getStatus() != WordBookStatus.PUBLISHED) {
            throw new IllegalArgumentException("单词本未发布");
        }
        return bookResponse(book, user.getId(), difficulty);
    }

    public Map<String, Object> progress(Long bookId, String username, WordDifficulty difficulty) {
        User user = getUser(username);
        return progressResponse(user.getId(), bookId, difficulty);
    }

    public Map<String, Object> next(Long bookId, String username, WordDifficulty difficulty, int limit) {
        User user = getUser(username);
        wordBookService.getRequired(bookId);
        LocalDateTime now = LocalDateTime.now();

        List<UserWordProgress> due = progressRepository.findDueReviews(user.getId(), bookId, difficulty, UserWordStatus.MASTERED, now, PageRequest.of(0, limit));
        List<Word> words = due.stream().map(UserWordProgress::getWord).collect(Collectors.toCollection(ArrayList::new));

        if (words.size() < limit) {
            List<Long> seenIds = progressRepository.findWordIdsByUserAndBook(user.getId(), bookId);
            if (seenIds.isEmpty()) {
                seenIds = List.of(-1L);
            }
            words.addAll(wordRepository.findNewPracticeWords(bookId, difficulty, WordStatus.PUBLISHED, seenIds, PageRequest.of(0, limit - words.size())));
        }

        List<Long> wordIds = words.stream().map(Word::getId).toList();
        Map<Long, UserWordProgress> progressByWord = progressRepository.findByUserIdAndWordIdIn(user.getId(), wordIds).stream()
                .collect(Collectors.toMap(p -> p.getWord().getId(), Function.identity()));

        List<Map<String, Object>> items = words.stream()
                .map(word -> wordWithProgress(word, progressByWord.get(word.getId())))
                .toList();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("words", items);
        response.put("progress", progressResponse(user.getId(), bookId, difficulty));
        return response;
    }

    public Map<String, Object> wordDetail(Long wordId, String username) {
        getUser(username);
        Word word = wordService.getRequired(wordId);
        if (word.getStatus() != WordStatus.PUBLISHED || word.getWordBook().getStatus() != WordBookStatus.PUBLISHED) {
            throw new IllegalArgumentException("单词未发布");
        }
        return wordService.toResponse(word);
    }

    @Transactional
    public Map<String, Object> answer(Long wordId, String username, WordPracticeResult result) {
        User user = getUser(username);
        Word word = wordService.getRequired(wordId);
        if (word.getStatus() != WordStatus.PUBLISHED || word.getWordBook().getStatus() != WordBookStatus.PUBLISHED) {
            throw new IllegalArgumentException("单词未发布");
        }
        UserWordProgress progress = progressRepository.findByUserIdAndWordId(user.getId(), wordId)
                .orElseGet(() -> {
                    UserWordProgress created = new UserWordProgress();
                    created.setUser(user);
                    created.setWord(word);
                    created.setWordBook(word.getWordBook());
                    created.setDifficulty(word.getDifficulty());
                    created.setStatus(UserWordStatus.LEARNING);
                    return created;
                });
        WordPracticeRule.apply(progress, result, LocalDateTime.now());
        progressRepository.save(progress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("progress", progressToMap(progress));
        response.put("bookProgress", progressResponse(user.getId(), word.getWordBook().getId(), word.getDifficulty()));
        return response;
    }

    public List<Map<String, Object>> learnedWords(Long bookId, String username, WordDifficulty difficulty) {
        User user = getUser(username);
        return progressRepository.findByUserIdAndWordBookIdAndWordDifficulty(user.getId(), bookId, difficulty)
                .stream()
                .map(progress -> wordWithProgress(progress.getWord(), progress))
                .toList();
    }

    private Map<String, Object> bookResponse(WordBook book, Long userId, WordDifficulty difficulty) {
        Map<String, Object> response = wordBookService.toResponse(book);
        response.put("progress", progressResponse(userId, book.getId(), difficulty));
        return response;
    }

    private Map<String, Object> progressResponse(Long userId, Long bookId, WordDifficulty difficulty) {
        LocalDateTime now = LocalDateTime.now();
        long total = wordRepository.countByWordBookIdAndDeletedFalseAndDifficultyAndStatus(bookId, difficulty, WordStatus.PUBLISHED);
        long learned = progressRepository.countByUserIdAndWordBookIdAndWordDifficulty(userId, bookId, difficulty);
        long mastered = progressRepository.countByUserIdAndWordBookIdAndWordDifficultyAndStatus(userId, bookId, difficulty, UserWordStatus.MASTERED);
        long due = progressRepository.countDueReviews(userId, bookId, difficulty, UserWordStatus.MASTERED, now);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("difficulty", difficulty);
        response.put("total", total);
        response.put("learned", learned);
        response.put("mastered", mastered);
        response.put("dueReview", due);
        response.put("remainingNew", Math.max(0, total - learned));
        return response;
    }

    private Map<String, Object> wordWithProgress(Word word, UserWordProgress progress) {
        Map<String, Object> response = wordService.toResponse(word);
        response.put("progress", progress == null ? null : progressToMap(progress));
        return response;
    }

    private Map<String, Object> progressToMap(UserWordProgress progress) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", progress.getStatus());
        response.put("difficulty", progress.getDifficulty());
        response.put("studyCount", progress.getStudyCount());
        response.put("knownCount", progress.getKnownCount());
        response.put("unknownCount", progress.getUnknownCount());
        response.put("fuzzyCount", progress.getFuzzyCount());
        response.put("consecutiveKnownCount", progress.getConsecutiveKnownCount());
        response.put("firstStudiedAt", progress.getFirstStudiedAt());
        response.put("lastPracticedAt", progress.getLastPracticedAt());
        response.put("nextReviewAt", progress.getNextReviewAt());
        response.put("masteredAt", progress.getMasteredAt());
        return response;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}
