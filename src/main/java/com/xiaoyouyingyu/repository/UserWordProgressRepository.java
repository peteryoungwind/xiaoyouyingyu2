package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, Long> {
    Optional<UserWordProgress> findByUserIdAndWordId(Long userId, Long wordId);

    @Query("SELECT p.word.id FROM UserWordProgress p WHERE p.user.id = :userId AND p.wordBook.id = :bookId")
    List<Long> findWordIdsByUserAndBook(@Param("userId") Long userId, @Param("bookId") Long bookId);

    @Query("SELECT p FROM UserWordProgress p WHERE p.user.id = :userId AND p.wordBook.id = :bookId " +
            "AND p.word.difficulty = :difficulty AND p.status <> :masteredStatus AND p.nextReviewAt IS NOT NULL " +
            "AND p.nextReviewAt <= :now ORDER BY p.nextReviewAt ASC")
    List<UserWordProgress> findDueReviews(@Param("userId") Long userId,
                                          @Param("bookId") Long bookId,
                                          @Param("difficulty") WordDifficulty difficulty,
                                          @Param("masteredStatus") UserWordStatus masteredStatus,
                                          @Param("now") LocalDateTime now,
                                          Pageable pageable);

    long countByUserIdAndWordBookIdAndWordDifficulty(Long userId, Long wordBookId, WordDifficulty difficulty);
    long countByUserIdAndWordBookIdAndWordDifficultyAndStatus(Long userId, Long wordBookId, WordDifficulty difficulty, UserWordStatus status);

    @Query("SELECT COUNT(p) FROM UserWordProgress p WHERE p.user.id = :userId AND p.wordBook.id = :bookId " +
            "AND p.word.difficulty = :difficulty AND p.status <> :masteredStatus AND p.nextReviewAt IS NOT NULL AND p.nextReviewAt <= :now")
    long countDueReviews(@Param("userId") Long userId,
                         @Param("bookId") Long bookId,
                         @Param("difficulty") WordDifficulty difficulty,
                         @Param("masteredStatus") UserWordStatus masteredStatus,
                         @Param("now") LocalDateTime now);

    List<UserWordProgress> findByUserIdAndWordBookIdAndWordDifficulty(Long userId, Long wordBookId, WordDifficulty difficulty);
    List<UserWordProgress> findByUserIdAndWordIdIn(Long userId, Collection<Long> wordIds);
}
