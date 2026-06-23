const RECENT_WORD_BOOK_KEY = 'recentWordPracticeBook';

function normalizeDifficulty(difficulty) {
  return difficulty === 'ADVANCED' ? 'ADVANCED' : 'BEGINNER';
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
  navigateToEntry: navigateToEntry
};
