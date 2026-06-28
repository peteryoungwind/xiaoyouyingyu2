package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TopicSubmissionRepository extends JpaRepository<TopicSubmission, Long> {
    @Query("""
            select ts from TopicSubmission ts
            where (:status is null or ts.status = :status)
              and (:keyword is null or :keyword = ''
                or lower(ts.title) like lower(concat('%', :keyword, '%'))
                or lower(ts.reason) like lower(concat('%', :keyword, '%'))
                or lower(ts.extraInfo) like lower(concat('%', :keyword, '%')))
            order by ts.createdAt desc
            """)
    Page<TopicSubmission> search(
            @Param("status") TopicSubmissionStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
