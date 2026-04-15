'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getTagColor, normalizeKnownTags, parseTags } from '@/lib/tag-colors';
import { useParams, useRouter } from 'next/navigation';
import {
  GraduationCap, BookOpen, MessageSquare, Lightbulb, ClipboardList,
  Sparkles, ChevronDown, ChevronUp, Send, ArrowLeft, Loader2, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

type Mode = 'beginner' | 'advanced';
type Section = 'warmup' | 'vocabulary' | 'expressions' | 'tasks' | 'review';

function parseJSON(str: string) {
  try {
    const cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-white hover:bg-blue-500 bg-blue-50 px-4 py-2 rounded-xl transition-all mt-4 ml-auto disabled:opacity-40">
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 换一批
    </button>
  );
}

function SectionHeader({ icon: Icon, title, open, onToggle }: { icon: any; title: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-xl">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-blue-500" />
        <span className="font-medium text-gray-900">{title}</span>
      </div>
      {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
    </button>
  );
}

type CacheKey = 'warmup' | 'vocabulary' | 'expressions' | 'tasks' | 'review';
type ContentCache = Partial<Record<`${CacheKey}_${Mode}`, any>>;

export default function TopicLearningCenter() {
  const { id } = useParams();
  const router = useRouter();
  const { isPremium } = useAuth();
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('lc-mode') as Mode) || 'beginner';
    return 'beginner';
  });
  const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
    warmup: true, vocabulary: false, expressions: false, tasks: false, review: false,
  });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [cache, setCache] = useState<ContentCache>({});

  const cacheSet = (key: CacheKey, data: any) => setCache(prev => ({ ...prev, [`${key}_${mode}`]: data }));
  const cacheGet = (key: CacheKey) => cache[`${key}_${mode}`];

  const topicId = Number(id);

  const { data: topic, isLoading, isError, error } = useQuery({
    queryKey: ['learning-topic', topicId],
    queryFn: () => api.getLearningTopic(topicId),
    enabled: isPremium && Number.isFinite(topicId),
  });

  const toggleSection = (s: Section) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  // AI generation mutations
  const warmupMut = useMutation({
    mutationFn: (exclude?: string) => api.generateWarmup(topic.title, topic.titleZh || '', mode, exclude),
    onSuccess: (data) => cacheSet('warmup', data),
  });
  const vocabMut = useMutation({
    mutationFn: (exclude?: string) => api.generateVocabulary(topic.title, topic.titleZh || '', mode, exclude),
    onSuccess: (data) => cacheSet('vocabulary', data),
  });
  const exprMut = useMutation({
    mutationFn: (exclude?: string) => api.generateExpressions(topic.title, topic.titleZh || '', mode, exclude),
    onSuccess: (data) => cacheSet('expressions', data),
  });
  const tasksMut = useMutation({
    mutationFn: (exclude?: string) => api.generateTasks(topic.title, topic.titleZh || '', mode, exclude),
    onSuccess: (data) => cacheSet('tasks', data),
  });
  const reviewMut = useMutation({
    mutationFn: () => api.reviewAnswer(topic.title, topic.titleZh || '', selectedTask?.title || '', answer, mode),
    onSuccess: (data) => cacheSet('review', data),
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem('lc-mode', m);
    warmupMut.reset();
    vocabMut.reset();
    exprMut.reset();
    tasksMut.reset();
    reviewMut.reset();
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <GraduationCap size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">该功能仅对高级用户开放</p>
        <Link href="/settings" className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm hover:bg-amber-100">
          开通会员 / 兑换卡密
        </Link>
      </div>
    );
  }

  if (isLoading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (isError) {
    const message = error instanceof Error ? error.message : '加载失败，请稍后重试';
    return <div className="text-center py-12 text-gray-400">{message}</div>;
  }
  if (!topic) return <div className="text-center py-12 text-gray-400">主题不存在</div>;

  const tags = normalizeKnownTags(topic.tags);
  const displayTags = tags.length > 0 ? tags : parseTags(topic.tags);
  const questions = typeof topic.questions === 'string' ? JSON.parse(topic.questions) : topic.questions;

  const cachedOrMut = (key: CacheKey, mut: any) => {
    const d = mut.data || cacheGet(key);
    return d ? parseJSON(d.content) : null;
  };

  // Helper to extract existing content as exclude string for dedup
  const getExclude = (key: CacheKey): string | undefined => {
    const data = cachedOrMut(key, { data: null });
    if (!data) return undefined;
    if (key === 'warmup') {
      const parts: string[] = [];
      data.warmupQuestions?.forEach((q: any) => parts.push(q.en));
      data.keywords?.forEach((k: any) => parts.push(k.word));
      return parts.join(', ') || undefined;
    }
    if (key === 'vocabulary') return data.vocabulary?.map((v: any) => v.word).join(', ');
    if (key === 'expressions') return data.expressions?.map((e: any) => e.template).join(', ');
    if (key === 'tasks') return data.tasks?.map((t: any) => t.title).join(', ');
    return undefined;
  };

  const warmupData = cachedOrMut('warmup', warmupMut);
  const vocabData = cachedOrMut('vocabulary', vocabMut);
  const exprData = cachedOrMut('expressions', exprMut);
  const tasksData = cachedOrMut('tasks', tasksMut);
  const reviewData = cachedOrMut('review', reviewMut);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 press-effect flex items-center gap-1">
        <ArrowLeft size={14} /> 返回
      </button>

      {/* Topic Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-semibold text-gray-900">{topic.title}</h1>
            {topic.titleZh && <p className="mt-1 break-words text-base text-gray-500">{topic.titleZh}</p>}
            {displayTags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {displayTags.map((tag: string) => (
                  <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getTagColor(tag.trim())}`}>
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap sm:ml-4">{topic.eventDate}</span>
        </div>

        {/* Discussion Questions */}
        <div className="mt-5 space-y-2">
          {questions.slice(0, 3).map((q: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm">
              <span className="text-gray-400 mr-2">Q{i + 1}</span>
              <span className="break-words text-gray-900">{q.en}</span>
              {mode === 'beginner' && <p className="ml-7 mt-0.5 break-words text-xs text-gray-500">{q.zh}</p>}
            </div>
          ))}
          {questions.length > 3 && (
            <p className="text-xs text-gray-400 text-center">还有 {questions.length - 3} 个讨论问题</p>
          )}
        </div>
      </div>

      {/* Mode Switch */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <span className="text-sm text-gray-500">学习模式</span>
          <div className="flex w-full bg-gray-100 rounded-xl p-1 sm:w-auto">
            <button onClick={() => switchMode('beginner')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all sm:flex-none ${mode === 'beginner' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500'}`}>
              初级模式
            </button>
            <button onClick={() => switchMode('advanced')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all sm:flex-none ${mode === 'advanced' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500'}`}>
              进阶模式
            </button>
          </div>
          <span className="text-xs text-gray-400 lg:ml-auto">
            {mode === 'beginner' ? '显示中文辅助，更多句型支架' : '弱化中文提示，强调逻辑与表达升级'}
          </span>
        </div>
      </div>

      {/* Section: Warmup */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <SectionHeader icon={Lightbulb} title="主题理解与热身" open={openSections.warmup} onToggle={() => toggleSection('warmup')} />
        {openSections.warmup && (
          <div className="px-4 pb-4">
            {!warmupData && !warmupMut.isPending && (
              <button onClick={() => warmupMut.mutate(undefined)}
                className="w-full py-3 text-sm text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                生成热身内容
              </button>
            )}
            {warmupMut.isPending && <LoadingBlock text="正在生成热身内容..." />}
            {warmupData && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-gray-900">{warmupData.introduction}</p>
                  {mode === 'beginner' && warmupData.introductionZh && (
                    <p className="text-xs text-gray-500 mt-1">{warmupData.introductionZh}</p>
                  )}
                </div>
                {warmupData.warmupQuestions && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">热身问题</p>
                    <div className="space-y-2">
                      {warmupData.warmupQuestions.map((q: any, i: number) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm">
                          <span className="break-words text-gray-900">{q.en}</span>
                          {mode === 'beginner' && <p className="mt-0.5 break-words text-xs text-gray-500">{q.zh}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {warmupData.keywords && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">关键词预览</p>
                    <div className="flex flex-wrap gap-2">
                      {warmupData.keywords.map((k: any, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 bg-gray-100 rounded-full text-gray-700">
                          {k.word} {mode === 'beginner' && <span className="text-gray-400">({k.zh})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {warmupData.speakingTips && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">开口提示</p>
                    <div className="flex flex-wrap gap-2">
                      {warmupData.speakingTips.map((tip: string, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full">{tip}</span>
                      ))}
                    </div>
                  </div>
                )}
                <RefreshButton onClick={() => warmupMut.mutate(getExclude('warmup'))} loading={warmupMut.isPending} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Vocabulary */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <SectionHeader icon={BookOpen} title="主题词汇" open={openSections.vocabulary} onToggle={() => toggleSection('vocabulary')} />
        {openSections.vocabulary && (
          <div className="px-4 pb-4">
            {!vocabData && !vocabMut.isPending && (
              <button onClick={() => vocabMut.mutate(undefined)}
                className="w-full py-3 text-sm text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                生成主题词汇
              </button>
            )}
            {vocabMut.isPending && <LoadingBlock text="正在生成词汇..." />}
            {vocabData?.vocabulary && (
              <div className="space-y-2">
                {vocabData.vocabulary.map((v: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 break-words">{v.word}</span>
                      <span className="text-xs text-gray-500 break-words">{v.zh}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        v.difficulty === 'basic' ? 'bg-green-50 text-green-600' :
                        v.difficulty === 'intermediate' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>{v.category}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5 italic">{v.example}</p>
                    {mode === 'beginner' && v.exampleZh && (
                      <p className="text-xs text-gray-400 mt-0.5">{v.exampleZh}</p>
                    )}
                  </div>
                ))}
                <RefreshButton onClick={() => vocabMut.mutate(getExclude('vocabulary'))} loading={vocabMut.isPending} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Expressions */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <SectionHeader icon={MessageSquare} title="表达工具箱" open={openSections.expressions} onToggle={() => toggleSection('expressions')} />
        {openSections.expressions && (
          <div className="px-4 pb-4">
            {!exprData && !exprMut.isPending && (
              <button onClick={() => exprMut.mutate(undefined)}
                className="w-full py-3 text-sm text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                生成表达模板
              </button>
            )}
            {exprMut.isPending && <LoadingBlock text="正在生成表达模板..." />}
            {exprData?.expressions && (
              <div className="space-y-2">
                {exprData.expressions.map((e: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{e.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{e.template}</p>
                    {mode === 'beginner' && <p className="text-xs text-gray-500 mt-0.5">{e.zh}</p>}
                    <p className="text-xs text-gray-600 mt-1.5 italic">{e.example}</p>
                    {mode === 'beginner' && e.exampleZh && (
                      <p className="text-xs text-gray-400 mt-0.5">{e.exampleZh}</p>
                    )}
                  </div>
                ))}
                <RefreshButton onClick={() => exprMut.mutate(getExclude('expressions'))} loading={exprMut.isPending} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: Practice Tasks */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <SectionHeader icon={ClipboardList} title="练习任务" open={openSections.tasks} onToggle={() => toggleSection('tasks')} />
        {openSections.tasks && (
          <div className="px-4 pb-4">
            {!tasksData && !tasksMut.isPending && (
              <button onClick={() => tasksMut.mutate(undefined)}
                className="w-full py-3 text-sm text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                生成练习任务
              </button>
            )}
            {tasksMut.isPending && <LoadingBlock text="正在生成练习任务..." />}
            {tasksData?.tasks && (
              <div className="space-y-3">
                {tasksData.tasks.map((t: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                    selectedTask === t ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50 hover:border-gray-200'
                  }`} onClick={() => { setSelectedTask(t); setOpenSections(prev => ({ ...prev, review: true })); }}>
                    <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium text-sm text-gray-900">{t.title}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                          t.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>{t.difficulty}</span>
                        {t.estimatedMinutes && <span className="text-xs text-gray-400">{t.estimatedMinutes}min</span>}
                      </div>
                    </div>
                    {mode === 'beginner' && t.titleZh && <p className="text-xs text-gray-500 mb-1">{t.titleZh}</p>}
                    <p className="text-sm text-gray-700">{t.description}</p>
                    {mode === 'beginner' && t.descriptionZh && <p className="text-xs text-gray-500 mt-0.5">{t.descriptionZh}</p>}
                    {t.hints && t.hints.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {t.hints.map((h: string, j: number) => (
                          <span key={j} className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600">{h}</span>
                        ))}
                      </div>
                    )}
                    {selectedTask === t && (
                      <p className="text-xs text-blue-500 mt-2">已选择此任务，请在下方作答区提交回答</p>
                    )}
                  </div>
                ))}
                <RefreshButton onClick={() => { tasksMut.mutate(getExclude('tasks')); setSelectedTask(null); }} loading={tasksMut.isPending} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: AI Review */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <SectionHeader icon={Sparkles} title="AI 点评与练习" open={openSections.review} onToggle={() => toggleSection('review')} />
        {openSections.review && (
          <div className="px-4 pb-4 space-y-4">
            {selectedTask ? (
              <div className="p-3 bg-blue-50 rounded-xl text-sm">
                <span className="text-xs text-blue-500">当前任务</span>
                <p className="font-medium text-gray-900 mt-0.5">{selectedTask.title}</p>
                <p className="text-gray-600 text-xs mt-0.5">{selectedTask.description}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">请先在上方选择一个练习任务</p>
            )}

            <div>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="在这里输入你的英文回答..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 outline-none focus:ring-2 focus:ring-blue-100 text-sm resize-none"
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-gray-400">{answer.length} 字符</span>
                <button
                  onClick={() => reviewMut.mutate(undefined)}
                  disabled={!answer.trim() || !selectedTask || reviewMut.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 disabled:opacity-40 press-effect transition-colors">
                  <Send size={14} />
                  {reviewMut.isPending ? '点评中...' : '提交 AI 点评'}
                </button>
              </div>
            </div>

            {reviewMut.isPending && <LoadingBlock text="AI 正在点评你的回答..." />}

            {reviewData && (
              <div className="space-y-4 pt-2">
                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">{reviewData.score}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">综合评分</p>
                    <p className="text-xs text-gray-500 mt-0.5">{reviewData.encouragement}</p>
                  </div>
                </div>

                {/* Strengths */}
                {reviewData.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2">做得好的地方</p>
                    <div className="space-y-1.5">
                      {reviewData.strengths.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5">✓</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {reviewData.improvements?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-600 mb-2">改进建议</p>
                    <div className="space-y-1.5">
                      {reviewData.improvements.map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-amber-500 mt-0.5">→</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corrections */}
                {reviewData.corrections?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-2">表达优化</p>
                    <div className="space-y-2">
                      {reviewData.corrections.map((c: any, i: number) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm">
                          <p className="text-red-400 line-through">{c.original}</p>
                          <p className="text-green-600 font-medium mt-0.5">{c.corrected}</p>
                          <p className="text-xs text-gray-500 mt-1">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retry */}
                <button onClick={() => { setAnswer(''); reviewMut.reset(); }}
                  className="w-full py-3 text-sm text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                  再练一次
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
