package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.WordBook;
import com.xiaoyouyingyu.entity.WordBookStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WordBookRepository extends JpaRepository<WordBook, Long> {
    Page<WordBook> findByDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);
    List<WordBook> findByDeletedFalseAndStatusOrderByUpdatedAtDesc(WordBookStatus status);
}
