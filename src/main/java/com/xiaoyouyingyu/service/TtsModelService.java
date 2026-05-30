package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.TtsModel;
import com.xiaoyouyingyu.repository.TtsModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TtsModelService {
    private final TtsModelRepository ttsModelRepository;

    public List<Map<String, Object>> list() {
        return ttsModelRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TtsModel getDefaultEnabled() {
        return ttsModelRepository.findByIsDefaultTrueAndEnabledTrue()
                .or(() -> ttsModelRepository.findByEnabledTrueOrderByCreatedAtDesc().stream().findFirst())
                .orElseThrow(() -> new IllegalArgumentException("请先配置可用的 TTS 模型"));
    }

    public TtsModel getEnabled(Long id) {
        if (id == null) {
            return getDefaultEnabled();
        }
        TtsModel model = ttsModelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TTS 模型不存在"));
        if (!Boolean.TRUE.equals(model.getEnabled())) {
            throw new IllegalArgumentException("TTS 模型未启用");
        }
        return model;
    }

    @Transactional
    public TtsModel create(TtsModel model) {
        if (Boolean.TRUE.equals(model.getIsDefault())) {
            ttsModelRepository.clearDefault();
        }
        return ttsModelRepository.save(model);
    }

    @Transactional
    public TtsModel update(Long id, TtsModel updated) {
        TtsModel model = ttsModelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TTS 模型不存在"));
        if (Boolean.TRUE.equals(updated.getIsDefault())) {
            ttsModelRepository.clearDefault();
        }
        model.setName(updated.getName());
        model.setBaseUrl(updated.getBaseUrl());
        model.setApiKey(updated.getApiKey());
        model.setModelName(updated.getModelName());
        model.setProvider(updated.getProvider());
        model.setVoiceUs(updated.getVoiceUs());
        model.setVoiceUk(updated.getVoiceUk());
        model.setOutputFormat(updated.getOutputFormat());
        model.setEnabled(updated.getEnabled());
        model.setIsDefault(updated.getIsDefault());
        return ttsModelRepository.save(model);
    }

    @Transactional
    public TtsModel setDefault(Long id) {
        TtsModel model = ttsModelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TTS 模型不存在"));
        ttsModelRepository.clearDefault();
        model.setEnabled(true);
        model.setIsDefault(true);
        return ttsModelRepository.save(model);
    }

    public void delete(Long id) {
        ttsModelRepository.deleteById(id);
    }

    public Map<String, Object> toResponse(TtsModel model) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", model.getId());
        response.put("name", model.getName());
        response.put("baseUrl", model.getBaseUrl());
        response.put("apiKey", mask(model.getApiKey()));
        response.put("modelName", model.getModelName());
        response.put("provider", model.getProvider());
        response.put("voiceUs", model.getVoiceUs());
        response.put("voiceUk", model.getVoiceUk());
        response.put("outputFormat", model.getOutputFormat());
        response.put("enabled", model.getEnabled());
        response.put("isDefault", model.getIsDefault());
        response.put("createdAt", model.getCreatedAt());
        response.put("updatedAt", model.getUpdatedAt());
        return response;
    }

    private static String mask(String value) {
        if (value == null || value.length() <= 8) {
            return "********";
        }
        return value.substring(0, 4) + "****" + value.substring(value.length() - 4);
    }
}
