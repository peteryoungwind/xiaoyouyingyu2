'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORY_ORDER, getTagColor, parseTags } from '@/lib/tag-colors';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, RotateCcw, Check, Plus, Trash2, Star, Settings2, Loader2 } from 'lucide-react';

// ===================== Types =====================

interface TitleOption {
  en: string;
  zh: string;
}

interface QuestionOption {
  en: string;
  zh: string;
}

interface AiModelType {
  id: number;
  name: string;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  isDefault: boolean;
}

// ===================== AI Generation Steps =====================
type AiStep = 'input' | 'titles' | 'questions' | 'save';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'ai' | 'manual' | 'topics' | 'users' | 'models'>('ai');

  // ===== AI new flow state =====
  const [aiStep, setAiStep] = useState<AiStep>('input');
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);

  // Step 1 result: 5 titles
  const [generatedTitles, setGeneratedTitles] = useState<TitleOption[]>([]);
  // Step 2: selected title
  const [selectedTitle, setSelectedTitle] = useState<TitleOption | null>(null);
  // Step 2 result: 10 questions
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionOption[]>([]);
  // Step 3: selected questions
  const [selectedQuestionIndices, setSelectedQuestionIndices] = useState<Set<number>>(new Set());
  // Save: event date & tags
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiTags, setAiTags] = useState('');
  const [saving, setSaving] = useState(false);

  // ===== Model management state =====
  const [showModelForm, setShowModelForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModelType | null>(null);
  const [modelForm, setModelForm] = useState({ name: '', apiUrl: '', apiKey: '', modelName: '', isDefault: false });

  // ===== Manual form state =====
  const emptyForm = { title: '', titleZh: '', tags: '', eventDate: new Date().toISOString().split('T')[0], questions: [{ en: '', zh: '' }] };
  const [form, setForm] = useState(emptyForm);
  const [manualSaving, setManualSaving] = useState(false);

  // ===== Queries =====
  const { data: topics } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => api.getTopics({ page: '0', size: '100' }),
    enabled: tab === 'topics',
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getUsers(),
    enabled: tab === 'users',
  });

  const { data: aiModels, refetch: refetchModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => api.getAiModels(),
    enabled: isAdmin,
  });

  // ===== Mutations =====
  const deleteTopic = useMutation({
    mutationFn: (id: number) => api.deleteTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-topics'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (!isAdmin) {
    return <div className="text-center py-12 text-gray-400">无权限访问</div>;
  }

  const toggleTags = (currentTags: string, category: string) => {
    const parsed = parseTags(currentTags);
    const next = parsed.includes(category)
      ? parsed.filter(tag => tag !== category)
      : [...parsed, category];
    return next.join(',');
  };


  // Set default model on initial load
  const getEffectiveModelId = () => {
    if (selectedModelId !== undefined) return selectedModelId;
    const defaultModel = (aiModels || []).find((m: AiModelType) => m.isDefault);
    return defaultModel?.id;
  };

  const handleGenerateTitles = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.aiGenerateTitles(prompt || undefined, getEffectiveModelId());
      const content = res.content;
      const parsed = JSON.parse(content);
      if (parsed.error) {
        setAiError(parsed.error);
        return;
      }
      if (parsed.titles && Array.isArray(parsed.titles)) {
        setGeneratedTitles(parsed.titles);
        setAiStep('titles');
      } else {
        setAiError('AI 返回格式异常，请重试');
      }
    } catch (err: any) {
      setAiError(err.message || 'AI 生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerateTitles = async () => {
    setGeneratedTitles([]);
    await handleGenerateTitles();
  };

  const handleSelectTitle = async (title: TitleOption) => {
    setSelectedTitle(title);
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.aiGenerateQuestions(title.en, title.zh, getEffectiveModelId());
      const content = res.content;
      const parsed = JSON.parse(content);
      if (parsed.error) {
        setAiError(parsed.error);
        return;
      }
      if (parsed.questions && Array.isArray(parsed.questions)) {
        setGeneratedQuestions(parsed.questions);
        setSelectedQuestionIndices(new Set(parsed.questions.map((_: any, i: number) => i)));
        setAiStep('questions');
      } else {
        setAiError('AI 返回格式异常，请重试');
      }
    } catch (err: any) {
      setAiError(err.message || '问题生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setSelectedQuestionIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSaveFromAi = async () => {
    if (!selectedTitle || selectedQuestionIndices.size === 0) return;
    setSaving(true);
    setAiError('');
    try {
      const selectedQuestions = generatedQuestions.filter((_, i) => selectedQuestionIndices.has(i));
      await api.createTopic({
        title: selectedTitle.en,
        titleZh: selectedTitle.zh,
        tags: aiTags,
        eventDate,
        questions: JSON.stringify(selectedQuestions),
      });
      // Reset flow
      resetAiFlow();
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    } catch (err: any) {
      setAiError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const resetAiFlow = () => {
    setAiStep('input');
    setPrompt('');
    setGeneratedTitles([]);
    setSelectedTitle(null);
    setGeneratedQuestions([]);
    setSelectedQuestionIndices(new Set());
    setAiError('');
    setAiTags('');
    setEventDate(new Date().toISOString().split('T')[0]);
  };

  // ===================== Model Management Handlers =====================

  const handleSaveModel = async () => {
    try {
      if (editingModel) {
        await api.updateAiModel(editingModel.id, modelForm);
      } else {
        await api.createAiModel(modelForm);
      }
      setShowModelForm(false);
      setEditingModel(null);
      setModelForm({ name: '', apiUrl: '', apiKey: '', modelName: '', isDefault: false });
      refetchModels();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleDeleteModel = async (id: number) => {
    if (!confirm('确定删除此模型？')) return;
    try {
      await api.deleteAiModel(id);
      refetchModels();
      // If deleted model was selected, reset selection
      if (selectedModelId === id) setSelectedModelId(undefined);
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const handleEditModel = (model: AiModelType) => {
    setEditingModel(model);
    setModelForm({
      name: model.name,
      apiUrl: model.apiUrl,
      apiKey: model.apiKey,
      modelName: model.modelName,
      isDefault: model.isDefault,
    });
    setShowModelForm(true);
  };

  // ===================== Manual Handlers =====================

  const handleSaveManual = async () => {
    if (!form.title || !form.eventDate || form.questions.some(q => !q.en)) return;
    setManualSaving(true);
    try {
      await api.createTopic({
        title: form.title,
        titleZh: form.titleZh,
        tags: form.tags,
        eventDate: form.eventDate,
        questions: JSON.stringify(form.questions.filter(q => q.en)),
      });
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    } finally {
      setManualSaving(false);
    }
  };

  // ===================== Tabs =====================

  const tabs = [
    { key: 'ai', label: 'AI 生成', icon: Sparkles },
    { key: 'manual', label: '手动创建' },
    { key: 'topics', label: '主题管理' },
    { key: 'users', label: '用户管理' },
    { key: 'models', label: '模型管理', icon: Settings2 },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">管理后台</h1>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-apple press-effect transition-colors flex items-center gap-1.5
              ${tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {'icon' in t && t.icon && <t.icon size={14} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== AI Generation Tab ==================== */}
      {tab === 'ai' && (
        <div className="bg-white rounded-apple-lg p-6 shadow-sm space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${aiStep === 'input' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              1. 输入需求
            </span>
            <ChevronRight size={14} />
            <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${aiStep === 'titles' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              2. 选择主题
            </span>
            <ChevronRight size={14} />
            <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${aiStep === 'questions' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
              3. 选择问题并保存
            </span>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 whitespace-nowrap">AI 模型：</label>
            <select
              value={selectedModelId ?? ''}
              onChange={e => setSelectedModelId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 min-w-[180px]"
            >
              <option value="">默认模型 ({(aiModels || []).find((m: AiModelType) => m.isDefault)?.name || '系统配置'})</option>
              {(aiModels || []).map((m: AiModelType) => (
                <option key={m.id} value={m.id}>{m.name} ({m.modelName})</option>
              ))}
            </select>
          </div>

          {/* Error display */}
          {aiError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-apple text-sm flex items-center justify-between">
              <span>{aiError}</span>
              <button onClick={() => setAiError('')} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {/* ===== Step 1: Input ===== */}
          {aiStep === 'input' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder="输入主题方向偏好（可选，如：关于工作压力、关于社交媒体...），留空则随机生成"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !aiLoading && handleGenerateTitles()}
                  className="flex-1 px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                <button onClick={handleGenerateTitles} disabled={aiLoading}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" /> 生成中...</> : <><Sparkles size={14} /> 生成5个主题</>}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                AI 将根据您的需求生成 5 个英语口语练习主题标题，自动避免与近一年已有主题重复。
              </p>
            </div>
          )}

          {/* ===== Step 2: Title Selection ===== */}
          {aiStep === 'titles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">请选择一个主题：</h3>
                <div className="flex gap-2">
                  <button onClick={() => { resetAiFlow(); }}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <RotateCcw size={12} /> 返回重新输入
                  </button>
                  <button onClick={handleRegenerateTitles} disabled={aiLoading}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-apple hover:bg-gray-200 flex items-center gap-1 disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                    重新生成
                  </button>
                </div>
              </div>

              {aiLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> 正在生成主题...
                </div>
              ) : (
                <div className="grid gap-2">
                  {generatedTitles.map((title, i) => (
                    <button key={i} onClick={() => handleSelectTitle(title)}
                      className="w-full text-left p-4 rounded-apple bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-all group">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{title.en}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{title.zh}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== Step 3: Question Selection & Save ===== */}
          {aiStep === 'questions' && (
            <div className="space-y-4">
              {/* Selected title display */}
              <div className="p-3 bg-blue-50 rounded-apple border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">{selectedTitle?.en}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{selectedTitle?.zh}</p>
                  </div>
                  <button onClick={() => { setAiStep('titles'); setGeneratedQuestions([]); setSelectedTitle(null); }}
                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                    <RotateCcw size={12} /> 重选主题
                  </button>
                </div>
              </div>

              {aiLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> 正在生成问题...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      选择要保留的问题（已选 {selectedQuestionIndices.size}/{generatedQuestions.length}）：
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (selectedQuestionIndices.size === generatedQuestions.length) {
                            setSelectedQuestionIndices(new Set());
                          } else {
                            setSelectedQuestionIndices(new Set(generatedQuestions.map((_, i) => i)));
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700">
                        {selectedQuestionIndices.size === generatedQuestions.length ? '取消全选' : '全选'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {generatedQuestions.map((q, i) => {
                      const isSelected = selectedQuestionIndices.has(i);
                      return (
                        <button key={i} onClick={() => toggleQuestion(i)}
                          className={`w-full text-left p-3 rounded-apple border transition-all flex items-start gap-3
                            ${isSelected
                              ? 'bg-green-50 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100 opacity-60'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">Q{i + 1}: {q.en}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{q.zh}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Save section */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-500 whitespace-nowrap">分类标签：</label>
                        <input type="text" placeholder="逗号分隔，如 自我成长,学习方法" value={aiTags}
                          onChange={e => setAiTags(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-gray-200" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_ORDER.map(category => {
                          const selected = parseTags(aiTags).includes(category);
                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setAiTags(toggleTags(aiTags, category))}
                              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selected ? 'bg-gray-900 text-white' : getTagColor(category)}`}
                            >
                              {category}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-500">话题日期：</label>
                      <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                        className="px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-gray-200" />
                      <div className="flex-1" />
                      <button onClick={() => resetAiFlow()}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-apple hover:bg-gray-100">
                        取消
                      </button>
                      <button onClick={handleSaveFromAi}
                        disabled={saving || selectedQuestionIndices.size === 0}
                        className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                        {saving ? <><Loader2 size={14} className="animate-spin" /> 保存中...</> : <><Check size={14} /> 保存主题</>}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== Manual Creation Tab ==================== */}
      {tab === 'manual' && (
        <div className="bg-white rounded-apple-lg p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            <input type="text" placeholder="主题标题 *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
            <input type="text" placeholder="中文标题" value={form.titleZh}
              onChange={e => setForm(f => ({ ...f, titleZh: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
            <div className="space-y-2">
              <input type="text" placeholder="分类（逗号分隔，如 自我成长,学习方法）" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map(category => {
                  const selected = parseTags(form.tags).includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tags: toggleTags(f.tags, category) }))}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selected ? 'bg-gray-900 text-white' : getTagColor(category)}`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">问题列表</p>
            {form.questions.map((q, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input type="text" placeholder={`Q${i + 1} English *`} value={q.en}
                    onChange={e => setForm(f => ({ ...f, questions: f.questions.map((x, j) => j === i ? { ...x, en: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  <input type="text" placeholder="中文对应" value={q.zh}
                    onChange={e => setForm(f => ({ ...f, questions: f.questions.map((x, j) => j === i ? { ...x, zh: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                </div>
                {form.questions.length > 1 && (
                  <button onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }))}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none mt-2">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, questions: [...f.questions, { en: '', zh: '' }] }))}
              className="text-sm text-blue-500 hover:text-blue-600">+ 添加问题</button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input type="date" value={form.eventDate}
              onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
              className="px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none" />
            <button onClick={handleSaveManual} disabled={manualSaving || !form.title || !form.eventDate}
              className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50">
              {manualSaving ? '保存中...' : '保存主题'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== Topics Management Tab ==================== */}
      {tab === 'topics' && (
        <div className="space-y-3">
          {(topics?.content || []).map((topic: any) => (
            <div key={topic.id} className="bg-white rounded-apple-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{topic.title}</h3>
                {topic.titleZh && <p className="text-xs text-gray-500">{topic.titleZh}</p>}
                <p className="text-xs text-gray-400">{topic.eventDate}</p>
              </div>
              <button onClick={() => deleteTopic.mutate(topic.id)}
                className="text-xs text-red-400 hover:text-red-600 press-effect">删除</button>
            </div>
          ))}
        </div>
      )}

      {/* ==================== Users Management Tab ==================== */}
      {tab === 'users' && (
        <div className="space-y-3">
          {(users || []).map((user: any) => (
            <div key={user.id} className="bg-white rounded-apple-lg p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{user.username}</span>
                <select value={user.role}
                  onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                  disabled={user.role === 'ADMIN' && (users || []).filter((x: any) => x.role === 'ADMIN').length <= 1}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-gray-200">
                  <option value="USER">普通用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              {user.role !== 'ADMIN' && (
                <button onClick={() => deleteUser.mutate(user.id)}
                  className="text-xs text-red-400 hover:text-red-600 press-effect">删除</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================== Model Management Tab ==================== */}
      {tab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">管理 AI 模型配置，支持多种 AI 服务提供商。</p>
            <button onClick={() => { setShowModelForm(true); setEditingModel(null); setModelForm({ name: '', apiUrl: '', apiKey: '', modelName: '', isDefault: false }); }}
              className="px-4 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 flex items-center gap-1.5">
              <Plus size={14} /> 新增模型
            </button>
          </div>

          {/* Model list */}
          <div className="space-y-3">
            {(aiModels || []).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无自定义模型，将使用系统默认配置。
              </div>
            )}
            {(aiModels || []).map((model: AiModelType) => (
              <div key={model.id} className="bg-white rounded-apple-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.name}</span>
                    {model.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                        <Star size={10} /> 默认
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditModel(model)}
                      className="text-xs text-gray-400 hover:text-gray-600">编辑</button>
                    <button onClick={() => handleDeleteModel(model.id)}
                      className="text-xs text-red-400 hover:text-red-600">删除</button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                  <p>模型：{model.modelName}</p>
                  <p>API：{model.apiUrl}</p>
                  <p>Key：{model.apiKey.substring(0, 8)}{'*'.repeat(Math.max(0, model.apiKey.length - 12))}{model.apiKey.substring(Math.max(0, model.apiKey.length - 4))}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Model form modal */}
          {showModelForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModelForm(false)}>
              <div className="bg-white rounded-apple-lg p-6 shadow-xl w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-medium">{editingModel ? '编辑模型' : '新增模型'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">显示名称 *</label>
                    <input type="text" placeholder="如：GPT-4o、DeepSeek" value={modelForm.name}
                      onChange={e => setModelForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">API 地址 *</label>
                    <input type="text" placeholder="https://api.openai.com/v1/chat/completions" value={modelForm.apiUrl}
                      onChange={e => setModelForm(f => ({ ...f, apiUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">API Key *</label>
                    <input type="password" placeholder="sk-..." value={modelForm.apiKey}
                      onChange={e => setModelForm(f => ({ ...f, apiKey: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">模型名称 *</label>
                    <input type="text" placeholder="gpt-4o / deepseek-chat / claude-3.5-sonnet" value={modelForm.modelName}
                      onChange={e => setModelForm(f => ({ ...f, modelName: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={modelForm.isDefault}
                      onChange={e => setModelForm(f => ({ ...f, isDefault: e.target.checked }))}
                      className="rounded" />
                    设为默认模型
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowModelForm(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-apple">
                    取消
                  </button>
                  <button onClick={handleSaveModel}
                    disabled={!modelForm.name || !modelForm.apiUrl || !modelForm.apiKey || !modelForm.modelName}
                    className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50">
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
