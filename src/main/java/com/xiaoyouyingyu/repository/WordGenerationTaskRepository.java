package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.WordGenerationTask;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WordGenerationTaskRepository extends JpaRepository<WordGenerationTask, Long> {
    List<WordGenerationTask> findByWordBookDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
}
