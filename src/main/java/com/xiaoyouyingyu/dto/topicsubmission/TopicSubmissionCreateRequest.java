package com.xiaoyouyingyu.dto.topicsubmission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TopicSubmissionCreateRequest {
    @NotBlank(message = "话题标题不能为空")
    @Size(min = 2, max = 100, message = "话题标题需为2-100个字符")
    private String title;

    @Size(max = 500, message = "想练原因最多500个字符")
    private String reason;

    @Size(max = 50, message = "分类最多50个字符")
    private String category;

    @Size(max = 500, message = "补充说明最多500个字符")
    private String extraInfo;
}
