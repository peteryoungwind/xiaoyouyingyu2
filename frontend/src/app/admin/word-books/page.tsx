'use client';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, isAuthExpiredError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpen, CheckSquare, Loader2, Plus, RefreshCw } from 'lucide-react';

const emptyBook = { name: '', description: '', scene: '', level: 'BEGINNER', status: 'DRAFT' };
const emptySceneBook = { name: '', description: '', level: 'BEGINNER', status: 'DRAFT' };
const emptyTopicBook = { name: '', description: '', scene: '', level: 'BEGINNER', status: 'DRAFT' };
const emptyWord = {
  word: '',
  difficulty: 'BEGINNER',
  status: 'DRAFT',
  phonetic: '',
  partOfSpeech: '',
  definitionZh: '',
  definitionEn: '',
  commonPatterns: '',
  exampleEn: '',
  exampleZh: '',
  sourceScene: '',
};
export default function AdminWordBooksPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [creationMode, setCreationMode] = useState<'manual' | 'ai' | 'topic'>('manual');
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<number[]>([]);
  const [bookForm, setBookForm] = useState<any>(emptyBook);
  const [sceneBookForm, setSceneBookForm] = useState<any>(emptySceneBook);
  const [topicBookForm, setTopicBookForm] = useState<any>(emptyTopicBook);
  const [wordForm, setWordForm] = useState<any>(emptyWord);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [selectedTtsModelId, setSelectedTtsModelId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sceneForm, setSceneForm] = useState({ scene: '', count: 8, modelId: '' });
  const [topicForm, setTopicForm] = useState({ topicIds: [] as number[], beginnerCount: 5, advancedCount: 5, modelId: '' });
  const [message, setMessage] = useState('');

  const { data: booksPage } = useQuery({
    queryKey: ['admin-word-books'],
    queryFn: () => api.getWordBooks({ page: '0', size: '100' }),
    enabled: isAdmin,
  });
  const books = booksPage?.content || [];
  const selectedBook = useMemo(
    () => books.find((book: any) => book.id === selectedBookId) || null,
    [books, selectedBookId]
  );
  const activeBookId = selectedBook?.id;

  const { data: wordsPage } = useQuery({
    queryKey: ['admin-words', activeBookId, difficulty, status, keyword],
    queryFn: () => api.getWords(activeBookId, { page: '0', size: '100', difficulty, status, keyword }),
    enabled: isAdmin && !!activeBookId,
  });
  const words = wordsPage?.content || [];

  const { data: aiModels = [] } = useQuery({
    queryKey: ['ai-models'],
    queryFn: () => api.getAiModels(),
    enabled: isAdmin,
  });
  const { data: topicsPage } = useQuery({
    queryKey: ['word-topic-options'],
    queryFn: () => api.getTopics({ page: '0', size: '200' }),
    enabled: isAdmin,
  });
  const topics = topicsPage?.content || [];
  const { data: ttsModels = [] } = useQuery({
    queryKey: ['tts-models'],
    queryFn: () => api.getTtsModels(),
    enabled: isAdmin,
  });
  const { data: generationTasks = [] } = useQuery({
    queryKey: ['word-generation-tasks'],
    queryFn: () => api.getWordGenerationTasks(),
    enabled: isAdmin,
    refetchInterval: (query) => {
      const tasks = (query.state.data as any[]) || [];
      return tasks.some(task => task.status === 'PENDING' || task.status === 'RUNNING') ? 2000 : false;
    },
  });
  const runningTaskCount = generationTasks.filter((task: any) => task.status === 'PENDING' || task.status === 'RUNNING').length;

  const selectedCount = selectedWordIds.length;
  const allVisibleSelected = words.length > 0 && words.every((word: any) => selectedWordIds.includes(word.id));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-word-books'] });
    queryClient.invalidateQueries({ queryKey: ['admin-words'] });
    queryClient.invalidateQueries({ queryKey: ['tts-models'] });
    queryClient.invalidateQueries({ queryKey: ['word-generation-tasks'] });
  };

  function handleError(err: any) {
    if (isAuthExpiredError(err)) return;
    setMessage(err?.message || '操作失败');
  }

  const createBook = useMutation({
    mutationFn: () => api.createWordBook(bookForm),
    onSuccess: (book: any) => {
      setMessage('单词本已创建');
      setBookForm(emptyBook);
      setSelectedBookId(null);
      refresh();
    },
    onError: handleError,
  });
  const createBookByScene = useMutation({
    mutationFn: async () => {
      return api.createWordGenerationTaskByScene({
        name: sceneBookForm.name,
        description: sceneBookForm.description,
        level: sceneBookForm.level,
        scene: sceneForm.scene,
        count: sceneForm.count,
        modelId: sceneForm.modelId ? Number(sceneForm.modelId) : undefined,
        ttsModelId: selectedTtsModelId ? Number(selectedTtsModelId) : undefined,
      });
    },
    onSuccess: (task: any) => {
      setMessage(`后台任务已创建：${task.wordBookName}`);
      setSceneBookForm(emptySceneBook);
      setSceneForm({ scene: '', count: 8, modelId: '' });
      setSelectedBookId(task.wordBookId || null);
      refresh();
    },
    onError: handleError,
  });
  const createBookByTopics = useMutation({
    mutationFn: async () => {
      return api.createWordGenerationTaskByTopics({
        name: topicBookForm.name,
        description: topicBookForm.description,
        scene: topicBookForm.scene,
        level: topicBookForm.level,
        topicIds: topicForm.topicIds,
        beginnerCount: topicForm.beginnerCount,
        advancedCount: topicForm.advancedCount,
        modelId: topicForm.modelId ? Number(topicForm.modelId) : undefined,
        ttsModelId: selectedTtsModelId ? Number(selectedTtsModelId) : undefined,
      });
    },
    onSuccess: (task: any) => {
      setMessage(`后台任务已创建：${task.wordBookName}`);
      setTopicBookForm(emptyTopicBook);
      setTopicForm({ topicIds: [], beginnerCount: 5, advancedCount: 5, modelId: '' });
      setSelectedBookId(task.wordBookId || null);
      refresh();
    },
    onError: handleError,
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'publish' | 'offline' }) =>
      action === 'publish' ? api.publishWordBook(id) : api.offlineWordBook(id),
    onSuccess: refresh,
    onError: handleError,
  });
  const updateBook = useMutation({
    mutationFn: () => api.updateWordBook(editingBook.id, editingBook),
    onSuccess: () => {
      setMessage('单词本已更新');
      setEditingBook(null);
      refresh();
    },
    onError: handleError,
  });
  const deleteBook = useMutation({
    mutationFn: (id: number) => api.deleteWordBook(id),
    onSuccess: () => {
      setSelectedBookId(null);
      refresh();
    },
    onError: handleError,
  });
  const createWord = useMutation({
    mutationFn: () => api.createWord(activeBookId, wordForm, selectedTtsModelId ? Number(selectedTtsModelId) : undefined),
    onSuccess: () => {
      setMessage('单词已保存，音频已触发生成');
      setWordForm(emptyWord);
      refresh();
    },
    onError: handleError,
  });
  const updateWord = useMutation({
    mutationFn: () => api.updateWord(editingWord.id, editingWord),
    onSuccess: () => {
      setMessage('单词已更新');
      setEditingWord(null);
      refresh();
    },
    onError: handleError,
  });
  const deleteWord = useMutation({
    mutationFn: (id: number) => api.deleteWord(id),
    onSuccess: refresh,
    onError: handleError,
  });
  const batch = useMutation({
    mutationFn: async (action: string) => {
      if (action === 'publish') return api.batchPublishWords(selectedWordIds);
      if (action === 'offline') return api.batchOfflineWords(selectedWordIds);
      if (action === 'delete') return api.batchDeleteWords(selectedWordIds);
      if (action === 'audio') return api.batchRegenerateWordAudio(selectedWordIds, selectedTtsModelId ? Number(selectedTtsModelId) : undefined);
      if (action === 'sort') {
        return api.batchSortWords(words
          .filter((word: any) => selectedWordIds.includes(word.id))
          .map((word: any, index: number) => ({ id: word.id, sortOrder: index * 10 })));
      }
      return null;
    },
    onSuccess: () => {
      setMessage('批量操作已完成');
      setSelectedWordIds([]);
      refresh();
    },
    onError: handleError,
  });

  const regenerateEditingWordAudio = useMutation({
    mutationFn: () => api.batchRegenerateWordAudio([editingWord.id], selectedTtsModelId ? Number(selectedTtsModelId) : undefined),
    onSuccess: () => {
      setMessage('音频已重新生成');
      refresh();
    },
    onError: handleError,
  });

  function toggleWord(id: number) {
    setSelectedWordIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : prev.concat(id));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedWordIds(prev => prev.filter(id => !words.some((word: any) => word.id === id)));
    } else {
      setSelectedWordIds(Array.from(new Set(selectedWordIds.concat(words.map((word: any) => word.id)))));
    }
  }

  function toggleTopic(id: number) {
    setTopicForm(prev => ({
      ...prev,
      topicIds: prev.topicIds.includes(id) ? prev.topicIds.filter(item => item !== id) : prev.topicIds.concat(id),
    }));
  }

  const createTabs = [
    { key: 'manual', label: '手动创建' },
    { key: 'ai', label: 'AI 创建' },
    { key: 'topic', label: '根据主题创建' },
  ] as const;
  const stageText: Record<string, string> = {
    PENDING: '等待中',
    GENERATING_WORDS: '生成单词中',
    SAVING_WORDS: '保存单词中',
    GENERATING_AUDIO: '生成音频中',
    COMPLETED: '完成',
    FAILED: '失败',
  };
  const ttsSelect = (
    <select value={selectedTtsModelId} onChange={e => setSelectedTtsModelId(e.target.value)} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
      <option value="">默认 TTS</option>
      {ttsModels.map((model: any) => <option key={model.id} value={model.id}>{model.name}</option>)}
    </select>
  );

  if (!isAdmin) return <div className="py-12 text-center text-gray-400">无权限访问</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">单词训练</h1>
          <p className="mt-1 text-sm text-gray-500">管理单词本、AI 生成、TTS 音频和批量运营。</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw size={16} /> 刷新{runningTaskCount > 0 ? `（${runningTaskCount} 个任务执行中）` : ''}
        </button>
      </div>

      {message && <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

      {generationTasks.length > 0 && (
        <section className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">生成任务进度</h2>
            {runningTaskCount > 0 && <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Loader2 size={13} className="animate-spin" /> 自动刷新中</span>}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {generationTasks.slice(0, 4).map((task: any) => (
              <button
                key={task.id}
                onClick={() => setSelectedBookId(task.wordBookId)}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-left hover:border-blue-100 hover:bg-blue-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{task.wordBookName}</p>
                    <p className="mt-1 text-xs text-gray-500">{task.message || stageText[task.stage] || task.stage}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : task.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {stageText[task.stage] || task.status}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${task.status === 'FAILED' ? 'bg-red-400' : task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.max(0, Math.min(100, task.progress || 0))}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>{task.progress || 0}%</span>
                  <span>单词 {task.savedWords || 0}/{task.totalWords || 0}</span>
                  <span>音频 {task.audioDone || 0}/{task.audioTotal || 0}</span>
                  {task.skippedWords > 0 && <span>跳过 {task.skippedWords}</span>}
                </div>
                {task.error && <p className="mt-2 line-clamp-2 text-xs text-red-500">{task.error}</p>}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <section className="space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900"><Plus size={16} /> 创建单词本</h2>
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1">
              {createTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCreationMode(tab.key)}
                  className={`rounded-md px-2 py-2 text-xs font-medium transition ${creationMode === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {creationMode === 'manual' && (
              <div className="space-y-2">
                <input value={bookForm.name} onChange={e => setBookForm({ ...bookForm, name: e.target.value })} placeholder="单词本名称" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <select value={bookForm.level} onChange={e => setBookForm({ ...bookForm, level: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="BEGINNER">初级词书</option>
                  <option value="ADVANCED">进阶词书</option>
                </select>
                <input value={bookForm.scene} onChange={e => setBookForm({ ...bookForm, scene: e.target.value })} placeholder="适用场景" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <textarea value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} placeholder="描述" className="min-h-20 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <button onClick={() => createBook.mutate()} disabled={!bookForm.name || createBook.isPending} className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{createBook.isPending ? '创建中...' : '创建空单词本'}</button>
              </div>
            )}
            {creationMode === 'ai' && (
              <div className="space-y-2">
                <input value={sceneBookForm.name} onChange={e => setSceneBookForm({ ...sceneBookForm, name: e.target.value })} placeholder="单词本名称" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <select value={sceneBookForm.level} onChange={e => setSceneBookForm({ ...sceneBookForm, level: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="BEGINNER">初级词书</option>
                  <option value="ADVANCED">进阶词书</option>
                </select>
                <textarea value={sceneBookForm.description} onChange={e => setSceneBookForm({ ...sceneBookForm, description: e.target.value })} placeholder="单词本描述" className="min-h-16 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <textarea value={sceneForm.scene} onChange={e => setSceneForm({ ...sceneForm, scene: e.target.value })} placeholder="生成场景，例如下班后和朋友约饭、点餐、闲聊" className="min-h-24 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min={1} max={50} value={sceneForm.count} onChange={e => setSceneForm({ ...sceneForm, count: Number(e.target.value) })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <select value={sceneForm.modelId} onChange={e => setSceneForm({ ...sceneForm, modelId: e.target.value })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">默认模型</option>
                    {aiModels.map((model: any) => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                </div>
                {ttsSelect}
                <button onClick={() => createBookByScene.mutate()} disabled={!sceneBookForm.name || !sceneForm.scene || createBookByScene.isPending} className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{createBookByScene.isPending ? '提交任务中...' : '创建后台生成任务'}</button>
              </div>
            )}
            {creationMode === 'topic' && (
              <div className="space-y-2">
                <input value={topicBookForm.name} onChange={e => setTopicBookForm({ ...topicBookForm, name: e.target.value })} placeholder="单词本名称" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <select value={topicBookForm.level} onChange={e => setTopicBookForm({ ...topicBookForm, level: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="BEGINNER">初级词书</option>
                  <option value="ADVANCED">进阶词书</option>
                </select>
                <input value={topicBookForm.scene} onChange={e => setTopicBookForm({ ...topicBookForm, scene: e.target.value })} placeholder="适用场景" className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <textarea value={topicBookForm.description} onChange={e => setTopicBookForm({ ...topicBookForm, description: e.target.value })} placeholder="单词本描述" className="min-h-16 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-2">
                  {topics.map((topic: any) => (
                    <label key={topic.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={topicForm.topicIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
                      <span className="truncate">{topic.titleZh || topic.title}</span>
                    </label>
                  ))}
                  {topics.length === 0 && <div className="py-4 text-center text-xs text-gray-400">暂无可选主题</div>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={0} value={topicForm.beginnerCount} onChange={e => setTopicForm({ ...topicForm, beginnerCount: Number(e.target.value) })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <input type="number" min={0} value={topicForm.advancedCount} onChange={e => setTopicForm({ ...topicForm, advancedCount: Number(e.target.value) })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <select value={topicForm.modelId} onChange={e => setTopicForm({ ...topicForm, modelId: e.target.value })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">默认模型</option>
                    {aiModels.map((model: any) => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                </div>
                {ttsSelect}
                <button onClick={() => createBookByTopics.mutate()} disabled={!topicBookForm.name || topicForm.topicIds.length === 0 || createBookByTopics.isPending} className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{createBookByTopics.isPending ? '提交任务中...' : '创建后台生成任务'}</button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="px-1 text-sm font-semibold text-gray-900">单词本列表</h2>
            {books.map((book: any) => (
              <button key={book.id} onClick={() => { setSelectedBookId(book.id); setSelectedWordIds([]); }} className={`w-full rounded-lg border p-4 text-left transition ${activeBookId === book.id ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{book.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{book.level === 'ADVANCED' ? '进阶词书' : '初级词书'} · {book.description || book.scene || '暂无描述'}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">{book.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-gray-500">
                  <span>{book.level === 'ADVANCED' ? '进阶' : '初级'}</span>
                  <span>词数 {book.stats?.totalWords || 0}</span>
                  <span>发布 {book.stats?.publishedWords || 0}</span>
                  <span>主题 {book.stats?.linkedTopics || 0}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {!selectedBook ? (
            <div className="rounded-lg bg-white p-12 text-center text-gray-400">点击左侧单词本查看详情</div>
          ) : (
            <>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><BookOpen size={18} /> {selectedBook.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{selectedBook.description || selectedBook.scene}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateStatus.mutate({ id: selectedBook.id, action: 'publish' })} className="rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white">发布</button>
                    <button onClick={() => setEditingBook({ ...selectedBook })} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600">编辑</button>
                    <button onClick={() => updateStatus.mutate({ id: selectedBook.id, action: 'offline' })} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white">下架</button>
                    <button onClick={() => deleteBook.mutate(selectedBook.id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">删除</button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">手动新增单词</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} placeholder="英文单词" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <input value={wordForm.phonetic} onChange={e => setWordForm({ ...wordForm, phonetic: e.target.value })} placeholder="音标" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <input value={selectedBook.level === 'ADVANCED' ? '进阶词书' : '初级词书'} readOnly className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none" />
                  <select value={wordForm.status} onChange={e => setWordForm({ ...wordForm, status: e.target.value })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">发布</option>
                    <option value="OFFLINE">下架</option>
                  </select>
                  <input value={wordForm.definitionZh} onChange={e => setWordForm({ ...wordForm, definitionZh: e.target.value })} placeholder="中文释义" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <input value={wordForm.definitionEn} onChange={e => setWordForm({ ...wordForm, definitionEn: e.target.value })} placeholder="英文释义" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
                <textarea value={wordForm.commonPatterns} onChange={e => setWordForm({ ...wordForm, commonPatterns: e.target.value })} placeholder="常用搭配/句型" className="mt-2 min-h-16 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <textarea value={wordForm.exampleEn} onChange={e => setWordForm({ ...wordForm, exampleEn: e.target.value })} placeholder="英文例句" className="mt-2 min-h-16 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                <div className="mt-2">{ttsSelect}</div>
                <button onClick={() => createWord.mutate()} disabled={!wordForm.word || !wordForm.definitionZh || !wordForm.definitionEn || createWord.isPending} className="mt-3 w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">保存并生成音频</button>
              </div>

              <div className="rounded-lg bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-100 p-4 lg:flex-row">
                  <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索单词/释义" className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">全部难度</option>
                    <option value="BEGINNER">初级</option>
                    <option value="ADVANCED">进阶</option>
                  </select>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">全部状态</option>
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">发布</option>
                    <option value="OFFLINE">下架</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4 text-xs">
                  <span className="inline-flex items-center gap-1 text-gray-500"><CheckSquare size={14} /> 已选 {selectedCount}</span>
                  <button disabled={selectedCount === 0 || batch.isPending} onClick={() => batch.mutate('publish')} className="rounded-lg bg-green-50 px-3 py-2 font-medium text-green-700 disabled:opacity-50">批量发布</button>
                  <button disabled={selectedCount === 0 || batch.isPending} onClick={() => batch.mutate('offline')} className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 disabled:opacity-50">批量下架</button>
                  <button disabled={selectedCount === 0 || batch.isPending} onClick={() => batch.mutate('audio')} className="rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-700 disabled:opacity-50">重新生成音频</button>
                  {ttsSelect}
                  <button disabled={selectedCount === 0 || batch.isPending} onClick={() => batch.mutate('sort')} className="rounded-lg bg-purple-50 px-3 py-2 font-medium text-purple-700 disabled:opacity-50">按当前顺序排序</button>
                  <button disabled={selectedCount === 0 || batch.isPending} onClick={() => batch.mutate('delete')} className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700 disabled:opacity-50">批量删除</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
                        <th className="px-4 py-3 font-medium">单词</th>
                        <th className="px-4 py-3 font-medium">释义</th>
                        <th className="px-4 py-3 font-medium">来源</th>
                        <th className="px-4 py-3 font-medium">难度</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">音频</th>
                        <th className="px-4 py-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {words.map((word: any) => (
                        <tr key={word.id}>
                          <td className="px-4 py-3"><input type="checkbox" checked={selectedWordIds.includes(word.id)} onChange={() => toggleWord(word.id)} /></td>
                          <td className="px-4 py-3 font-medium text-gray-900">{word.word}<div className="text-xs font-normal text-gray-400">{word.phonetic}</div></td>
                          <td className="max-w-md px-4 py-3 text-gray-600">{word.definitionZh}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{(word.sourceTopics || []).map((t: any) => t.titleZh || t.titleEn).join('、') || word.sourceTopicTitle || word.sourceScene || '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{word.difficulty}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{word.status}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{word.audioStatus}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setEditingWord({ ...word })} className="text-xs text-blue-500 hover:text-blue-700">编辑</button>
                              <button onClick={() => deleteWord.mutate(word.id)} className="text-xs text-red-500 hover:text-red-700">删除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {words.length === 0 && <div className="p-8 text-center text-sm text-gray-400">暂无单词</div>}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setEditingBook(null)}>
          <div className="w-full max-w-md space-y-3 rounded-lg bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900">编辑单词本</h3>
            <input value={editingBook.name || ''} onChange={e => setEditingBook({ ...editingBook, name: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            <input value={editingBook.scene || ''} onChange={e => setEditingBook({ ...editingBook, scene: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            <select value={editingBook.level || 'BEGINNER'} onChange={e => setEditingBook({ ...editingBook, level: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
              <option value="BEGINNER">初级词书</option>
              <option value="ADVANCED">进阶词书</option>
            </select>
            <textarea value={editingBook.description || ''} onChange={e => setEditingBook({ ...editingBook, description: e.target.value })} className="min-h-24 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            <select value={editingBook.status || 'DRAFT'} onChange={e => setEditingBook({ ...editingBook, status: e.target.value })} className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="OFFLINE">下架</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingBook(null)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">取消</button>
              <button onClick={() => updateBook.mutate()} disabled={!editingBook.name || updateBook.isPending} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}

      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setEditingWord(null)}>
          <div className="max-h-[86vh] w-full max-w-3xl space-y-3 overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900">编辑单词详情</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={editingWord.word || ''} onChange={e => setEditingWord({ ...editingWord, word: e.target.value })} placeholder="英文单词" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              <input value={editingWord.phonetic || ''} onChange={e => setEditingWord({ ...editingWord, phonetic: e.target.value })} placeholder="音标" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              <input value={editingWord.partOfSpeech || ''} onChange={e => setEditingWord({ ...editingWord, partOfSpeech: e.target.value })} placeholder="词性" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              <input value={selectedBook?.level === 'ADVANCED' ? '进阶词书' : '初级词书'} readOnly className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none" />
              <select value={editingWord.status || 'DRAFT'} onChange={e => setEditingWord({ ...editingWord, status: e.target.value })} className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">发布</option>
                <option value="OFFLINE">下架</option>
              </select>
              <input value={editingWord.sourceScene || ''} onChange={e => setEditingWord({ ...editingWord, sourceScene: e.target.value })} placeholder="来源场景" className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea value={editingWord.definitionZh || ''} onChange={e => setEditingWord({ ...editingWord, definitionZh: e.target.value })} placeholder="中文释义" className="min-h-20 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              <textarea value={editingWord.definitionEn || ''} onChange={e => setEditingWord({ ...editingWord, definitionEn: e.target.value })} placeholder="英文释义" className="min-h-20 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <textarea value={editingWord.commonPatterns || ''} onChange={e => setEditingWord({ ...editingWord, commonPatterns: e.target.value })} placeholder="常用搭配/句型" className="min-h-20 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            <div className="grid gap-2 sm:grid-cols-2">
              <textarea value={editingWord.exampleEn || ''} onChange={e => setEditingWord({ ...editingWord, exampleEn: e.target.value })} placeholder="英文例句" className="min-h-20 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              <textarea value={editingWord.exampleZh || ''} onChange={e => setEditingWord({ ...editingWord, exampleZh: e.target.value })} placeholder="例句中文翻译" className="min-h-20 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-3">音频状态：{editingWord.audioStatus || '-'}</div>
              <div className="rounded-lg bg-gray-50 p-3">来源主题：{(editingWord.sourceTopics || []).map((t: any) => t.titleZh || t.titleEn).join('、') || '-'}</div>
            </div>
            {editingWord.audioError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{editingWord.audioError}</div>}
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => regenerateEditingWordAudio.mutate()} disabled={regenerateEditingWordAudio.isPending} className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 disabled:opacity-50">重新生成音频</button>
              <button onClick={() => setEditingWord(null)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600">取消</button>
              <button onClick={() => updateWord.mutate()} disabled={!editingWord.word || !editingWord.definitionZh || !editingWord.definitionEn || updateWord.isPending} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
