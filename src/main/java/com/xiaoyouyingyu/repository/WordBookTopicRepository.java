package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.WordBookTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WordBookTopicRepository extends JpaRepository<WordBookTopic, Long> {
    Optional<WordBookTopic> findByWordBookIdAndTopicId(Long wordBookId, Long topicId);
    long countByWordBookId(Long wordBookId);
}
