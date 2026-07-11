import React, { useState, useEffect } from "react";

/**
 * User Profile Component - Phase 4
 * - User stats & analytics
 * - TBR sync & sharing
 * - Follow friends
 * - Trending recommendations
 */
const UserProfileComponent = ({ user = {}, onClose }) => {
  const [profile, setProfile] = useState({
    username: user?.name || "Reader",
    email: user?.email || "reader@vibeshelf.com",
    avatar: user?.avatar || "👤",
    bio: "Book lover and mood reader",
    joinedDate: new Date().toLocaleDateString(),
  });

  const [stats, setStats] = useState({
    totalBooksRead: 0,
    booksInTBR: 0,
    totalRecommendations: 0,
    favoriteGenre: "Fiction",
    averageRating: 4.5,
    followersCount: 0,
    followingCount: 0,
  });

  const [tbrList, setTbrList] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [activeTab, setActiveTab] = useState("stats"); // stats, tbr, followers, trending

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vibeshelf_tbr");
    if (saved) {
      try {
        const books = JSON.parse(saved);
        setTbrList(books);
        setStats(prev => ({ ...prev, booksInTBR: books.length }));
      } catch (e) {
        console.error("Failed to load TBR");
      }
    }

    // Simulate loading followers
    const simulatedFollowers = [
      { id: 1, name: "Sarah", avatar: "👩", bio: "Romance lover" },
      { id: 2, name: "Mike", avatar: "👨", bio: "Sci-fi enthusiast" },
    ];
    setFollowers(simulatedFollowers);
    setStats(prev => ({ ...prev, followersCount: simulatedFollowers.length }));
  }, []);

  // Calculate trending books from TBR
  useEffect(() => {
    if (tbrList.length > 0) {
      const trending = tbrList.slice(0, 5).map(book => ({
        ...book,
        savedByCount: Math.floor(Math.random() * 100) + 10,
      }));
      setTrendingBooks(trending);
    }
  }, [tbrList]);

  const handleFollowUser = (userId) => {
    // Toggle follow
    const isFollowing = following.some(f => f.id === userId);
    if (isFollowing) {
      setFollowing(following.filter(f => f.id !== userId));
    } else {
      // Add to following
      const follower = followers.find(f => f.id === userId);
      if (follower) {
        setFollowing([...following, follower]);
      }
    }
  };

  const exportTBR = () => {
    const csv = [
      ["Title", "Author", "Genre", "Rating"],
      ...tbrList.map(book => [
        book.title,
        book.author,
        book.genre || "N/A",
        book.rating || "N/A",
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-tbr-list.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 dark:bg-[#0f0f11] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">
            My Profile
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-3xl"
            >
              ×
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-[#13131a] rounded-2xl border border-white/80 dark:border-white/10 p-8 mb-6 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <div className="text-7xl">{profile.avatar}</div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.username}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {profile.bio}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Joined {profile.joinedDate}
                </p>
              </div>
            </div>

            {/* Follow Stats */}
            <div className="space-y-2 text-right">
              <div className="text-sm">
                <p className="text-2xl font-bold text-rose-600 dark:text-fuchsia-400">
                  {stats.followersCount}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Followers</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition">
                Edit Profile
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.booksInTBR}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">In TBR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">
                ⭐ {stats.averageRating}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRecommendations}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Recommended</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.favoriteGenre}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Favorite</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
          {[
            { id: "stats", label: "📊 Stats", icon: "📊" },
            { id: "tbr", label: "📚 My TBR", icon: "📚" },
            { id: "followers", label: "👥 Followers", icon: "👥" },
            { id: "trending", label: "🔥 Trending", icon: "🔥" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-600 dark:text-fuchsia-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-[#13131a] rounded-2xl border border-white/80 dark:border-white/10 p-6 shadow-lg">
          {/* Stats Tab */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Reading Analytics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-500/10">
                    <p className="text-2xl font-bold text-rose-600 dark:text-fuchsia-400 mb-1">
                      {stats.totalBooksRead}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Books Read
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {stats.booksInTBR}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To Be Read
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {stats.totalRecommendations}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Recommendations
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                      ⭐ {stats.averageRating}/5
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Book Rating
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  🎯 Reading Goals
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        2024 Reading Goal
                      </p>
                      <p className="text-sm font-bold text-rose-600 dark:text-fuchsia-400">
                        {Math.round((stats.totalBooksRead / 24) * 100)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.totalBooksRead / 24) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TBR Tab */}
          {activeTab === "tbr" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  My TBR List ({tbrList.length})
                </h3>
                <button
                  onClick={exportTBR}
                  className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition"
                >
                  📥 Export CSV
                </button>
              </div>

              {tbrList.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tbrList.map((book, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    >
                      <div className="text-3xl flex-shrink-0">📖</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {book.author}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {book.genre && (
                            <span className="text-xs bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-2 py-1 rounded">
                              {book.genre}
                            </span>
                          )}
                          {book.rating && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                              ⭐ {book.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Your TBR list is empty. Start adding books! 📚
                </p>
              )}
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === "followers" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  👥 My Followers ({followers.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {followers.map(follower => (
                    <div
                      key={follower.id}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl">{follower.avatar}</div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {follower.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {follower.bio}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollowUser(follower.id)}
                        className={`w-full py-2 rounded-lg font-semibold text-sm transition ${
                          following.some(f => f.id === follower.id)
                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30"
                        }`}
                      >
                        {following.some(f => f.id === follower.id) ? "✓ Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {following.length > 0 && (
                <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    📌 Following ({following.length})
                  </h3>
                  <div className="space-y-2">
                    {following.map(user => (
                      <div
                        key={user.id}
                        className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{user.avatar}</div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {user.bio}
                            </p>
                          </div>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold">
                          →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trending Tab */}
          {activeTab === "trending" && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                🔥 Trending Among Your TBR
              </h3>

              {trendingBooks.length > 0 ? (
                <div className="space-y-3">
                  {trendingBooks.map((book, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-500/10 dark:to-pink-500/10 border border-rose-200 dark:border-rose-500/30"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-rose-600 dark:text-fuchsia-400">
                              #{idx + 1}
                            </span>
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {book.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {book.author}
                          </p>
                          <div className="flex gap-2">
                            <span className="text-xs bg-white dark:bg-white/10 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                              ⭐ {book.rating}/5
                            </span>
                            <span className="text-xs bg-white dark:bg-white/10 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                              💾 Saved {book.savedByCount}x
                            </span>
                          </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-rose-600 dark:text-fuchsia-400 font-semibold transition">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Add books to your TBR to see trending recommendations! 📚
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileComponent;
