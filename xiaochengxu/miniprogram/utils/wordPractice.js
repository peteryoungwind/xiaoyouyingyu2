const RECENT_WORD_BOOK_KEY = 'recentWordPracticeBook';
const WORD_BOOK_CACHE_PREFIX = 'wordPracticeBookCache:';
const WORD_BOOK_CACHE_TTL_MS = 30 * 60 * 1000;

function normalizeDifficulty(difficulty) {
  return difficulty === 'ADVANCED' ? 'ADVANCED' : 'BEGINNER';
}

function currentUsername() {
  try {
    return wx.getStorageSync('username') || 'guest';
  } catch (e) {
    return 'guest';
  }
}

function cacheKey(bookId, difficulty) {
  return WORD_BOOK_CACHE_PREFIX + currentUsername() + ':' + bookId + ':' + normalizeDifficulty(difficulty);
}

function readBookCache(bookId, difficulty, options) {
  try {
    const cached = wx.getStorageSync(cacheKey(bookId, difficulty));
    if (!cached || !Array.isArray(cached.words)) {
      return null;
    }
    if (!options || options.allowExpired !== true) {
      const age = Date.now() - (cached.updatedAt || 0);
      if (age > WORD_BOOK_CACHE_TTL_MS) {
        return null;
      }
    }
    return cached;
  } catch (e) {
    console.warn('Read word book cache failed:', e);
    return null;
  }
}

function saveBookCache(bookId, difficulty, payload) {
  if (!bookId || !payload) {
    return;
  }
  try {
    wx.setStorageSync(cacheKey(bookId, difficulty), {
      bookId: bookId,
      difficulty: normalizeDifficulty(difficulty),
      words: Array.isArray(payload.words) ? payload.words : [],
      progress: payload.progress || {},
      updatedAt: Date.now()
    });
  } catch (e) {
    console.warn('Save word book cache failed:', e);
  }
}

function removeBookCache(bookId, difficulty) {
  try {
    wx.removeStorageSync(cacheKey(bookId, difficulty));
  } catch (e) {
    console.warn('Remove word book cache failed:', e);
  }
}

function clearBookCaches() {
  try {
    const info = wx.getStorageInfoSync();
    (info.keys || []).forEach(function (key) {
      if (key.indexOf(WORD_BOOK_CACHE_PREFIX) === 0) {
        wx.removeStorageSync(key);
      }
    });
  } catch (e) {
    console.warn('Clear word book caches failed:', e);
  }
}

function updateCachedWordProgress(bookId, difficulty, wordId, progress, bookProgress) {
  const cached = readBookCache(bookId, difficulty, { allowExpired: true });
  if (!cached) {
    return;
  }
  const words = (cached.words || []).map(function (item) {
    if (String(item.id) !== String(wordId)) {
      return item;
    }
    return Object.assign({}, item, { progress: progress || item.progress || null });
  });
  saveBookCache(bookId, difficulty, {
    words: words,
    progress: bookProgress || cached.progress || {}
  });
}

function parseTime(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasStartedProgress(progress) {
  if (!progress) {
    return false;
  }
  if (progress.status === 'NEW') {
    return false;
  }
  if ((progress.studyCount || 0) > 0) {
    return true;
  }
  return !!(progress.firstStudiedAt || progress.lastPracticedAt || progress.masteredAt);
}

function selectNextWord(bookId, difficulty) {
  const cached = readBookCache(bookId, difficulty);
  if (!cached) {
    return null;
  }
  const words = cached.words || [];
  const now = Date.now();
  const dueWords = words.filter(function (word) {
    const progress = word.progress;
    const reviewAt = progress && parseTime(progress.nextReviewAt);
    return hasStartedProgress(progress) && progress.status !== 'MASTERED' && reviewAt !== null && reviewAt <= now;
  }).sort(function (a, b) {
    return parseTime(a.progress && a.progress.nextReviewAt) - parseTime(b.progress && b.progress.nextReviewAt);
  });
  const newWords = words.filter(function (word) {
    return !hasStartedProgress(word.progress);
  });
  const nextWord = dueWords[0] || newWords[0] || null;
  if (!nextWord) {
    return {
      word: null,
      progress: cached.progress || {},
      remainingCount: 0
    };
  }
  return {
    word: nextWord,
    progress: cached.progress || {},
    remainingCount: dueWords.length + newWords.length
  };
}

function findCachedWord(wordId) {
  try {
    const info = wx.getStorageInfoSync();
    const keys = info.keys || [];
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (key.indexOf(WORD_BOOK_CACHE_PREFIX) !== 0) {
        continue;
      }
      const cached = wx.getStorageSync(key);
      const matched = cached && Array.isArray(cached.words)
        ? cached.words.find(function (word) { return String(word.id) === String(wordId); })
        : null;
      if (matched) {
        return matched;
      }
    }
  } catch (e) {
    console.warn('Find cached word failed:', e);
  }
  return null;
}

function getRecentBook() {
  try {
    const recent = wx.getStorageSync(RECENT_WORD_BOOK_KEY);
    if (!recent || !recent.bookId) {
      return null;
    }
    return {
      bookId: recent.bookId,
      difficulty: normalizeDifficulty(recent.difficulty)
    };
  } catch (e) {
    console.warn('Get recent word book failed:', e);
    return null;
  }
}

function saveRecentBook(bookId, difficulty) {
  if (!bookId) {
    return;
  }
  try {
    wx.setStorageSync(RECENT_WORD_BOOK_KEY, {
      bookId: bookId,
      difficulty: normalizeDifficulty(difficulty),
      updatedAt: Date.now()
    });
  } catch (e) {
    console.warn('Save recent word book failed:', e);
  }
}

function clearRecentBook() {
  try {
    wx.removeStorageSync(RECENT_WORD_BOOK_KEY);
  } catch (e) {
    console.warn('Clear recent word book failed:', e);
  }
}

function navigateToEntry() {
  const recent = getRecentBook();
  if (recent) {
    wx.navigateTo({
      url: '/pages/wordPractice/index?bookId=' + recent.bookId + '&difficulty=' + recent.difficulty,
      fail: function () {
        clearRecentBook();
        wx.navigateTo({ url: '/pages/wordBooks/index' });
      }
    });
    return;
  }
  wx.navigateTo({ url: '/pages/wordBooks/index' });
}

module.exports = {
  getRecentBook: getRecentBook,
  saveRecentBook: saveRecentBook,
  clearRecentBook: clearRecentBook,
  readBookCache: readBookCache,
  saveBookCache: saveBookCache,
  removeBookCache: removeBookCache,
  clearBookCaches: clearBookCaches,
  updateCachedWordProgress: updateCachedWordProgress,
  selectNextWord: selectNextWord,
  hasStartedProgress: hasStartedProgress,
  findCachedWord: findCachedWord,
  navigateToEntry: navigateToEntry
};
