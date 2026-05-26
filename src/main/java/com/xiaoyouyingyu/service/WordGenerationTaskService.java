package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.WordGenerationTaskRepository;
import com.xiaoyouyingyu.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WordGenerationTaskService {
    private final WordGenerationTaskRepository taskRepository;
    private final WordBookService wordBookService;
    private final WordGenerationService wordGenerationService;
    private final WordRepository wordRepository;

    @Transactional
    public WordGenerationTask createTask(WordBook book, WordGenerationTaskType type, Long createdBy) {
        WordGenerationTask task = new WordGenerationTask();
        task.setWordBook(book);
        task.setType(type);
        task.setCreatedBy(createdBy);
        return taskRepository.save(task);
    }

    public List<Map<String, Object>> listRecent() {
        return taskRepository.findByWordBookDeletedFalseOrderByCreatedAtDesc(PageRequest.of(0, 20))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Map<String, Object> getResponse(Long id) {
        return toResponse(getRequired(id));
    }

    public WordGenerationTask getRequired(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("生成任务不存在"));
    }

    @Async
    public void runSceneTask(Long taskId, Long bookId, Map<String, Object> body) {
        runTask(taskId, bookId, body, WordGenerationTaskType.SCENE);
    }

    @Async
    public void runTopicsTask(Long taskId, Long bookId, Map<String, Object> body) {
        runTask(taskId, bookId, body, WordGenerationTaskType.TOPICS);
    }

    private void runTask(Long taskId, Long bookId, Map<String, Object> body, WordGenerationTaskType type) {
        try {
            Long ttsModelId = longValue(body.get("ttsModelId"));
            update(taskId, WordGenerationTaskStatus.RUNNING, WordGenerationTaskStage.GENERATING_WORDS, 10, "生成单词中", null);
            WordBook book = wordBookService.getRequired(bookId);
            List<Word> candidates = type == WordGenerationTaskType.SCENE
                    ? wordGenerationService.generateSceneCandidates(body)
                    : wordGenerationService.generateTopicCandidates(book, body);

            updateTotals(taskId, candidates.size(), 0, 0, "保存单词中");
            WordGenerationService.SaveResult saved = wordGenerationService.saveCandidatesWithoutAudio(book, candidates);
            updateAfterSave(taskId, saved.savedWords().size(), saved.skipped(), saved.errors());

            if (saved.savedWords().isEmpty()) {
                complete(taskId, saved, List.of());
                return;
            }

            int total = saved.savedWords().size();
            for (int i = 0; i < total; i++) {
                Word word = saved.savedWords().get(i);
                updateAudioProgress(taskId, total, i, "生成音频中：" + word.getWord());
                wordGenerationService.generateAudio(word, ttsModelId);
            }
            updateAudioProgress(taskId, total, total, "音频生成完成");
            List<Word> updatedWords = wordRepository.findByIdInAndDeletedFalseOrderByIdAsc(saved.savedWords().stream().map(Word::getId).toList());
            complete(taskId, saved, updatedWords);
        } catch (Exception e) {
            fail(taskId, e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void update(Long taskId, WordGenerationTaskStatus status, WordGenerationTaskStage stage, int progress, String message, String error) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(status);
        task.setStage(stage);
        task.setProgress(progress);
        task.setMessage(message);
        task.setError(error);
        if (task.getStartedAt() == null && status == WordGenerationTaskStatus.RUNNING) {
            task.setStartedAt(LocalDateTime.now());
        }
        taskRepository.save(task);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateTotals(Long taskId, int totalWords, int savedWords, int skippedWords, String message) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(WordGenerationTaskStatus.RUNNING);
        task.setStage(WordGenerationTaskStage.SAVING_WORDS);
        task.setTotalWords(totalWords);
        task.setSavedWords(savedWords);
        task.setSkippedWords(skippedWords);
        task.setProgress(35);
        task.setMessage(message);
        taskRepository.save(task);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateAfterSave(Long taskId, int savedWords, int skippedWords, List<String> errors) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(WordGenerationTaskStatus.RUNNING);
        task.setStage(WordGenerationTaskStage.GENERATING_AUDIO);
        task.setSavedWords(savedWords);
        task.setSkippedWords(skippedWords);
        task.setAudioTotal(savedWords);
        task.setAudioDone(0);
        task.setProgress(savedWords == 0 ? 100 : 55);
        task.setMessage(savedWords == 0 ? "生成单词完成，无需生成音频" : "生成单词完成，生成音频中");
        if (!errors.isEmpty()) {
            task.setError(truncate(String.join("\n", errors)));
        }
        taskRepository.save(task);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateAudioProgress(Long taskId, int total, int done, String message) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(WordGenerationTaskStatus.RUNNING);
        task.setStage(WordGenerationTaskStage.GENERATING_AUDIO);
        task.setAudioTotal(total);
        task.setAudioDone(done);
        int progress = total <= 0 ? 90 : 55 + (int) Math.floor(done * 40.0 / total);
        task.setProgress(Math.min(95, progress));
        task.setMessage(message);
        taskRepository.save(task);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void complete(Long taskId, WordGenerationService.SaveResult result, List<Word> words) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(WordGenerationTaskStatus.COMPLETED);
        task.setStage(WordGenerationTaskStage.COMPLETED);
        task.setProgress(100);
        task.setSavedWords(result.saved());
        task.setSkippedWords(result.skipped());
        task.setAudioTotal(result.saved());
        task.setAudioDone(result.saved());
        task.setMessage("完成");
        if (!result.errors().isEmpty()) {
            task.setError(truncate(String.join("\n", result.errors())));
        }
        task.setFinishedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void fail(Long taskId, Exception e) {
        WordGenerationTask task = getRequired(taskId);
        task.setStatus(WordGenerationTaskStatus.FAILED);
        task.setStage(WordGenerationTaskStage.FAILED);
        task.setMessage("任务失败");
        task.setError(truncate(e.getMessage() == null ? "生成任务失败" : e.getMessage()));
        task.setFinishedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    public Map<String, Object> toResponse(WordGenerationTask task) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", task.getId());
        response.put("wordBookId", task.getWordBook().getId());
        response.put("wordBookName", task.getWordBook().getName());
        response.put("type", task.getType());
        response.put("status", task.getStatus());
        response.put("stage", task.getStage());
        response.put("message", task.getMessage());
        response.put("progress", task.getProgress());
        response.put("totalWords", task.getTotalWords());
        response.put("savedWords", task.getSavedWords());
        response.put("skippedWords", task.getSkippedWords());
        response.put("audioTotal", task.getAudioTotal());
        response.put("audioDone", task.getAudioDone());
        response.put("error", task.getError());
        response.put("createdAt", task.getCreatedAt());
        response.put("startedAt", task.getStartedAt());
        response.put("finishedAt", task.getFinishedAt());
        response.put("updatedAt", task.getUpdatedAt());
        return response;
    }

    private static Long longValue(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(String.valueOf(value));
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 900 ? value.substring(0, 900) : value;
    }
}
