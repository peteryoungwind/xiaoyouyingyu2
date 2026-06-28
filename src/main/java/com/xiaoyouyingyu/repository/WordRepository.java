package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<Word, Long> {
    Optional<Word> findByWordBookIdAndNormalizedWordAndDeletedFalse(Long wordBookId, String normalizedWord);

    @Query("SELECT w FROM Word w WHERE w.wordBook.id = :bookId " +
            "AND w.deleted = false " +
            "AND (:difficulty IS NULL OR w.difficulty = :difficulty) " +
            "AND (:status IS NULL OR w.status = :status) " +
            "AND (:sourceTopicId IS NULL OR w.sourceTopicId = :sourceTopicId) " +
            "AND (:keyword IS NULL OR w.word LIKE %:keyword% OR w.definitionZh LIKE %:keyword% OR w.definitionEn LIKE %:keyword%) " +
            "ORDER BY w.sortOrder ASC, w.id ASC")
    Page<Word> search(@Param("bookId") Long bookId,
                      @Param("difficulty") WordDifficulty difficulty,
                      @Param("status") WordStatus status,
                      @Param("sourceTopicId") Long sourceTopicId,
                      @Param("keyword") String keyword,
                      Pageable pageable);

    long countByWordBookIdAndDeletedFalse(Long bookId);
    long countByWordBookIdAndDeletedFalseAndDifficulty(Long bookId, WordDifficulty difficulty);
    long countByWordBookIdAndDeletedFalseAndStatus(Long bookId, WordStatus status);
    long countByWordBookIdAndDeletedFalseAndDifficultyAndStatus(Long bookId, WordDifficulty difficulty, WordStatus status);
    long countByWordBookIdAndDeletedFalseAndSourceTopicIdIsNotNull(Long bookId);

    List<Word> findByIdInAndDeletedFalse(Collection<Long> ids);
    List<Word> findByIdInAndDeletedFalseOrderByIdAsc(Collection<Long> ids);

    @Query("SELECT w FROM Word w JOIN w.wordBook b WHERE w.deleted = false AND b.deleted = false " +
            "AND (w.audioUsUrl IS NULL OR w.audioUsUrl = '' OR w.audioUkUrl IS NULL OR w.audioUkUrl = '') " +
            "AND (w.audioError IS NULL OR w.audioError NOT IN ('PUBLIC_DICTIONARY_AUDIO_PARTIAL', 'PUBLIC_DICTIONARY_AUDIO_MISSING')) " +
            "ORDER BY w.wordBook.id ASC, w.sortOrder ASC, w.id ASC")
    List<Word> findMissingPublicAudio(Pageable pageable);

    @Query("SELECT w FROM Word w WHERE w.wordBook.id = :bookId AND w.deleted = false AND w.status = :status " +
            "AND w.difficulty = :difficulty AND w.id NOT IN :excludedIds ORDER BY w.sortOrder ASC, w.id ASC")
    List<Word> findNewPracticeWords(@Param("bookId") Long bookId,
                                    @Param("difficulty") WordDifficulty difficulty,
                                    @Param("status") WordStatus status,
                                    @Param("excludedIds") Collection<Long> excludedIds,
                                    Pageable pageable);
}
