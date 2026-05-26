package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.WordTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WordTopicRepository extends JpaRepository<WordTopic, Long> {
    Optional<WordTopic> findByWordIdAndTopicId(Long wordId, Long topicId);
    List<WordTopic> findByWordIdOrderByCreatedAtAsc(Long wordId);
}
