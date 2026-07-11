// PersonalizedRecsComponent.jsx
// Handcrafted reading experience component
// Premium UI inspired by Apple Books, Pinterest, and StoryGraph
// Thoughtful interactions and elegant typography

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { useBooksData } from "../contexts/BooksDataContext";
import UserProfileComponent from "./UserProfileComponent";

/* ============================================================================
 * 1. CONSTANTS & ICONS
 * ==========================================================================*/

const LS_TBR = "vibeshelf_tbr";
const LS_CONV = "vibeshelf_conversations";

const REFINEMENTS = {
  darker: " but darker and more intense",
  lighter: " but lighter and uplifting",
  series: " preferably a series",
  standalone: " but standalone only",
  fastpaced: " fast-paced and gripping",
  slowburn: " slow-burn and atmospheric",
};

const Icon = memo(function Icon({ name, size = 20, stroke = 2, fill = "none", className, style }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill, stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
    className, style,
  };
  switch (name) {
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "send":
      return (
        <svg {...common} style={{ transform: "rotate(45deg)", ...style }}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      );
    case "save":
      return (
        <svg {...common}>
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      );
    case "folder":
      return <svg {...common}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
    case "link":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "book":
      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case "heart":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case "close":
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case "moon":
      return <svg {...common} fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
    case "zap":
      return <svg {...common} fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "fire":
      return <svg {...common}><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 1 5 3 5 2 0 3-2 2-4-1-3-2-5-2-7z" /></svg>;
    case "refresh":
      return <svg {...common}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10" /></svg>;
    case "vault":
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="12" cy="12" r="3.5" /><path d="M12 8.5V6M12 18v-2.5M8.5 12H6M18 12h-2.5" /></svg>;
    default:
      return null;
  }
});

/* ============================================================================
 * 3. HELPERS
 * ==========================================================================*/

const seenTitles = new Set();

const dedupeAgainstSeen = (books) => {
  const out = [];
  for (const b of books || []) {
    const key = b?.title?.toLowerCase().trim();
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);
    out.push(b);
  }
  return out;
};

const extractBooks = (data) => {
  if (Array.isArray(data)) return { books: data, source: undefined };
  if (data?.recommendations) return { books: data.recommendations, source: data.source };
  if (data?.books) return { books: data.books, source: data.source };
  return { books: [], source: undefined };
};

const safeParse = (str, fallback) => {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
};

const formatBook = (raw, id) => ({
  id,
  title: raw.title || "Unknown",
  author: raw.author || "Unknown",
  reason:
    raw.reason && raw.reason.trim().length > 10
      ? raw.reason.trim()
      : "", // Remove generic fallback copy
  coverUrl: raw.coverUrl || raw.cover || null,
});

/* ============================================================================
 * 5. SUB-COMPONENTS
 * ==========================================================================*/

const EmptyState = memo(function EmptyState({ onReset }) {
  return (
    <div className="vs-empty-state vs-fade-in" role="status" aria-live="polite">
      <img 
        src="https://i.pinimg.com/originals/1e/9a/43/1e9a433cd24aff0bb9c533414a5b1633.jpg" 
        alt="A cozy reading nook with a stack of books and a cup of tea"
        className="vs-empty-img"
        style={{opacity: 0.92, filter: 'grayscale(0.08)'}}
      />
      <h2 className="vs-empty-title">
        No recommendations yet
      </h2>
      <p className="vs-empty-text">
        Begin your search by sharing a mood, genre, or book you adore.
      </p>
      <button className="vs-primary-btn" onClick={onReset} tabIndex={0}>
        Initiate a new search
      </button>
    </div>
  );
});

const BookCover = memo(function BookCover({ coverUrl, title, className, style }) {
  const [loaded, setLoaded] = useState(false);
  const src = coverUrl && /^https?:/.test(coverUrl)
   ? coverUrl
    : "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 192'>
          <defs>
            <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0' stop-color='#FFE4EF'/>
              <stop offset='1' stop-color='#FFC7DE'/>
            </linearGradient>
          </defs>
          <rect width='128' height='192' rx='10' fill='url(#g)'/>
          <path d='M64 68c-10 0-18 6-18 14v34c0-8 8-14 18-14s18 6 18 14V82c0-8-8-14-18-14z'
                fill='none' stroke='#E75480' stroke-width='2.2' stroke-linejoin='round'/>
        </svg>`);
  return (
    <div className={`vs-cover ${className || ""}`} style={style}>
      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          opacity: loaded? 1 : 0, 
          transition: 'opacity.4s cubic-bezier(.4,1,.3,1), transform.35s ease-out' 
        }}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <div className="vs-cover-skeleton" />}
    </div>
  );
});

const SkeletonCard = memo(function SkeletonCard({ index }) {
  return (
    <div className="vs-card vs-skeleton-card vs-fade-in" style={{ "--i": index }}>
      <div className="vs-skeleton vs-skeleton-cover" />
      <div className="vs-card-body">
        <div className="vs-skeleton vs-skeleton-line" style={{ width: "85%", height: 18, marginBottom: 8 }} />
        <div className="vs-skeleton vs-skeleton-line" style={{ width: "65%", height: 14, marginBottom: 12 }} />
        <div className="vs-skeleton vs-skeleton-line" style={{ width: "40%", height: 14, marginBottom: 12 }} />
        <div className="vs-skeleton vs-skeleton-block" style={{ height: 40, marginTop: "auto" }} />
      </div>
    </div>
  );
});

const BookCard = memo(function BookCard({ book, saved, onSelect, onToggleTbr, index }) {
  const handleTbr = useCallback((e) => {
    e.stopPropagation();
    onToggleTbr(book);
  }, [book, onToggleTbr]);
  const handleSelect = useCallback(() => onSelect(book), [book, onSelect]);

  return (
    <article
      className="vs-card vs-fade-in"
      style={{ "--i": index }}
      onClick={handleSelect}
      tabIndex={0}
      role="button"
      aria-pressed="false"
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleSelect(); }}
    >
      <div className="vs-card-cover-wrap">
        <BookCover 
          coverUrl={book.coverUrl} 
          title={book.title} 
        />
      </div>
      <div className="vs-card-body">
        <h3 className="vs-card-title" title={book.title}>{book.title}</h3>
        <p className="vs-card-author">by {book.author}</p>
        {book.reason && <p className="vs-card-reason">{book.reason}</p>}
      </div>
      <button
        type="button"
        className={`vs-tbr-btn ${saved? "is-saved" : ""}`}
        onClick={handleTbr}
        tabIndex={0}
        aria-pressed={saved}
        aria-label={saved? `Remove ${book.title} from your list` : `Add ${book.title} to your list`}
      >
        {saved? (<><Icon name="heart" size={14} fill="currentColor" /> Saved</>) : (<><Icon name="heart" size={14} /> Add to list</>)}
      </button>
    </article>
  );
});

const TbrItem = memo(function TbrItem({ book, onRemove }) {
  const handleRemove = useCallback(() => onRemove(book), [book, onRemove]);
  return (
    <div className="vs-tbr-item">
      <BookCover coverUrl={book.coverUrl} title={book.title} className="vs-tbr-cover" />
      <div className="vs-tbr-meta">
        <p className="vs-tbr-title">{book.title}</p>
        <p className="vs-tbr-author">by {book.author}</p>
        <button type="button" className="vs-link-btn" onClick={handleRemove} tabIndex={0} aria-label={`Remove ${book.title} from your list`}>Remove</button>
      </div>
    </div>
  );
});

const Modal = memo(function Modal({ open, onClose, children, width = 460 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="vs-modal-backdrop" onClick={onClose} tabIndex={-1} aria-modal="true" role="dialog">
      <div
        className="vs-modal vs-modal-pop"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
});

/* ============================================================================
 * 6. MAIN COMPONENT
 * ==========================================================================*/

const PersonalizedRecsComponent = () => {
  useBooksData();

  const chatRef = useRef(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now())
  );

  const [mood, setMood] = useState("");
  const [currentMood, setCurrentMood] = useState("");
  const [conversations, setConversations] = useState([]);
  const [savedConversations, setSavedConversations] = useState([]);
  const [tbrList, setTbrList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [groqSource, setGroqSource] = useState(false);
  const [copyState, setCopyState] = useState("idle");

  useEffect(() => {
    setTbrList(safeParse(localStorage.getItem(LS_TBR), []));
    setSavedConversations(safeParse(localStorage.getItem(LS_CONV), []));
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [conversations]);

  const tbrTitleSet = useMemo(
    () => new Set(tbrList.map((b) => b.title?.toLowerCase())),
    [tbrList]
  );
  const isInTbr = useCallback(
    (book) => tbrTitleSet.has(book?.title?.toLowerCase()),
    [tbrTitleSet]
  );

  const toggleTbr = useCallback((book) => {
    setTbrList((prev) => {
      const exists = prev.some((b) => b.title === book.title);
      const next = exists
        ? prev.filter((b) => b.title !== book.title)
        : [...prev, book];
      localStorage.setItem(LS_TBR, JSON.stringify(next));
      return next;
    });
  }, []);

  const shareConversation = useCallback(() => {
    if (conversations.length === 0) return;
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(conversations))));
      setShareLink(`${window.location.origin}?shared=${encoded}`);
    } catch { /* noop */ }
  }, [conversations]);

  const saveConversation = useCallback(() => {
    if (conversations.length === 0) return;
    setSavedConversations((prev) => {
      const next = [
        { id: Date.now(), conversations, savedAt: new Date().toLocaleString() },
        ...prev.slice(0, 9),
      ];
      localStorage.setItem(LS_CONV, JSON.stringify(next));
      return next;
    });
  }, [conversations]);

  const loadSavedConversation = useCallback((saved) => {
    setConversations(saved.conversations);
    setShowSaved(false);
  }, []);

  const clearAll = useCallback(() => {
    setConversations([]);
    setCurrentMood("");
    setMood("");
    seenTitles.clear();
  }, []);

  const handleEmptyReset = useCallback(() => {
    clearAll();
    const input = document.querySelector('.vs-input');
    if (input) input.focus();
  }, [clearAll]);

  const refine = useCallback((type) => {
    setMood(currentMood + (REFINEMENTS[type] || ""));
  }, [currentMood]);

  const copyShareLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1600);
    }
  }, [shareLink]);

  const requestRecs = useCallback(async (query) => {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: query, sessionId: sessionIdRef.current }),
    });
    if (!response.ok) throw new Error("Backend connection failed.");
    const data = await response.json();
    return extractBooks(data);
  }, []);

  const submitMood = useCallback(async (e) => {
    e?.preventDefault?.();
    const query = mood.trim();
    if (!query || loading) return;

    setCurrentMood(query);
    setMood("");
    setLoading(true);

    const convId = `c-${Date.now()}`;
    setConversations((prev) => [
      ...prev,
      { id: convId, query, books: [], timestamp: new Date(), isLoading: true, error: null },
    ]);

    try {
      const { books, source } = await requestRecs(query);
      setGroqSource(source === "groq");

      const unique = dedupeAgainstSeen(books);
      const formatted = unique.map((b, i) => formatBook(b, `${convId}-${i}`));

      setConversations((prev) => prev.map((c) =>
        c.id === convId ? { ...c, books: formatted, isLoading: false } : c
      ));
    } catch (err) {
      setConversations((prev) => prev.map((c) =>
        c.id === convId ? { ...c, isLoading: false, error: err.message || "Network error. Is the backend running?" } : c
      ));
    } finally {
      setLoading(false);
    }
  }, [mood, loading, requestRecs]);

  const loadMore = useCallback(async () => {
    if (!currentMood || loading) return;
    setLoading(true);

    setConversations((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice();
      next[next.length - 1] = { ...next[next.length - 1], isLoadingMore: true };
      return next;
    });

    try {
      const { books, source } = await requestRecs(currentMood);
      setGroqSource(source === "groq");
      const unique = dedupeAgainstSeen(books).slice(0, 4);

      const formatted = unique.map((b, i) => formatBook(b, `more-${Date.now()}-${i}`));

      setConversations((prev) => {
        const next = prev.slice();
        const last = { ...next[next.length - 1] };
        last.books = [...last.books, ...formatted];
        last.isLoadingMore = false;
        next[next.length - 1] = last;
        return next;
      });
    } catch {
      setConversations((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { ...next[next.length - 1], isLoadingMore: false };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, [currentMood, loading, requestRecs]);

  const retryLast = useCallback(() => {
    const last = conversations[conversations.length - 1];
    if (!last?.error) return;
    setConversations((prev) => prev.slice(0, -1));
    setMood(last.query);
    setTimeout(() => {
      const form = document.getElementById("vs-mood-form");
      form?.requestSubmit?.();
    }, 0);
  }, [conversations]);

  const refineButtons = useMemo(() => ([
    { key: "darker", label: "Darker", icon: "moon" },
    { key: "lighter", label: "Lighter", icon: "sun" },
    { key: "fastpaced", label: "Fast-Paced", icon: "zap" },
    { key: "slowburn", label: "Slow Burn", icon: "fire" },
  ]), []);

  return (
    <div className="vs-root">
      <StyleSheet />

      {/* Remove excessive decorative blobs for less visual noise */}
      <div className="vs-aurora" aria-hidden="true">
        <div className="vs-grain" />
      </div>

      <div className="vs-shell">
        <main className="vs-main" style={{ maxWidth: tbrList.length > 0 ? 820 : 940 }}>
          <header className="vs-header vs-glass">
            <div className="vs-header-left" style={{gap: 12}}>
              <h1 className="vs-title">
                VibeShelf
              </h1>
            </div>
            <div className="vs-header-right">
              <button type="button" className="vs-icon-btn" onClick={() => setShowProfile(true)} aria-label="View profile and settings">
                <Icon name="vault" size={18} />
              </button>
            </div>
          </header>

          <section ref={chatRef} className="vs-chat vs-glass">
            {conversations.length === 0 ? (
              <EmptyState onReset={handleEmptyReset} />
            ) : (
              conversations.map((conv, convIdx) => (
                <div key={conv.id} className="vs-conv vs-fade-in">
                  <div className="vs-user-row">
                    <div className="vs-user-bubble">{conv.query}</div>
                  </div>

                  {conv.isLoading ? (
                    <div className="vs-typing" aria-busy="true">
                      <span>Finding books for you</span>
                      <span className="vs-dot" /><span className="vs-dot" /><span className="vs-dot" />
                    </div>
                  ) : conv.books.length > 0 ? null : !conv.isLoading && conv.books.length === 0 ? (
                     <EmptyState onReset={handleEmptyReset} />
                  ) : null}

                  {conv.error && (
                    <div className="vs-error" role="alert">
                      <p>{conv.error}</p>
                      <button type="button" className="vs-ghost-btn" onClick={retryLast}>
                        <Icon name="refresh" size={14} /> Try again
                      </button>
                    </div>
                  )}

                  <div className="vs-grid">
                    {conv.books.map((book, bidx) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        saved={isInTbr(book)}
                        onSelect={setSelectedBook}
                        onToggleTbr={toggleTbr}
                        index={bidx}
                      />
                    ))}
                    {(conv.isLoading || conv.isLoadingMore) &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={`sk-${conv.id}-${i}`} index={conv.books.length + i} />
                      ))}
                  </div>

                  {convIdx === conversations.length - 1 &&
                    !loading &&
                    conv.books.length > 0 && (
                      <div className="vs-more-row">
                        <button className="vs-primary-btn" onClick={loadMore}>
                          Show more books
                        </button>
                      </div>
                    )}
                </div>
              ))
            )}
          </section>

          <div className="vs-input-area">
            {conversations.length > 0 && !loading && currentMood && (
              <div className="vs-refine-row">
                {refineButtons.map((r) => (
                  <button key={r.key} type="button" className="vs-refine-chip" onClick={() => refine(r.key)}>
                    <Icon name={r.icon} size={13} /> {r.label}
                  </button>
                ))}
              </div>
            )}

            <form id="vs-mood-form" onSubmit={submitMood} className="vs-form" autoComplete="off">
              <input
                className="vs-input"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Tell me what you're looking for..."
                disabled={loading}
                aria-label="Search for books by mood, title, or author"
                autoFocus
              />
              <button
                type="submit"
                className="vs-send-btn"
                disabled={loading || !mood.trim()}
                aria-label="Get recommendations"
              >
                {loading ? <span className="vs-spinner" /> : <Icon name="send" size={18} />}
              </button>
              {conversations.length > 0 && (
                <div className="vs-toolbar vs-glass">
                  <button type="button" className="vs-icon-btn" onClick={saveConversation} aria-label="Save this conversation"><Icon name="save" size={16} /></button>
                  {savedConversations.length > 0 && (
                    <button type="button" className="vs-icon-btn" onClick={() => setShowSaved(true)} aria-label="View saved conversations"><Icon name="folder" size={16} /></button>
                  )}
                  <button type="button" className="vs-icon-btn" onClick={shareConversation} aria-label="Share this conversation"><Icon name="link" size={16} /></button>
                  <button type="button" className="vs-icon-btn vs-icon-btn-danger" onClick={clearAll} aria-label="Clear all conversations"><Icon name="trash" size={16} /></button>
                </div>
              )}
            </form>
          </div>
        </main>

        {tbrList.length > 0 && (
          <aside className="vs-sidebar vs-glass vs-fade-in" role="complementary" aria-label="Your reading list">
            <div className="vs-sidebar-header">
              <h2><Icon name="vault" size={18} /> Your List</h2>
              <p>{tbrList.length} {tbrList.length === 1 ? "book" : "books"} saved</p>
            </div>
            <div className="vs-sidebar-body">
              {tbrList.map((book) => (
                <TbrItem key={book.title} book={book} onRemove={toggleTbr} />
              ))}
            </div>
          </aside>
        )}
      </div>

      <Modal open={showSaved && savedConversations.length > 0} onClose={() => setShowSaved(false)}>
        <div className="vs-modal-header">
          <h2><Icon name="folder" size={18} /> Saved Conversations</h2>
          <button className="vs-icon-btn" onClick={() => setShowSaved(false)} aria-label="Close saved conversations"><Icon name="close" size={16} /></button>
        </div>
        <div className="vs-modal-body">
          {savedConversations.map((saved) => (
            <button key={saved.id} className="vs-saved-item" onClick={() => loadSavedConversation(saved)}>
              <div className="vs-saved-title">"{saved.conversations[0]?.query}"</div>
              <div className="vs-saved-time">{saved.savedAt}</div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!selectedBook} onClose={() => setSelectedBook(null)}>
        {selectedBook && (
          <>
            <div className="vs-modal-header">
              <h2 className="vs-modal-title" title={selectedBook.title}>{selectedBook.title}</h2>
              <button className="vs-icon-btn" onClick={() => setSelectedBook(null)} aria-label="Close book details"><Icon name="close" size={16} /></button>
            </div>
            <BookCover
              coverUrl={selectedBook.coverUrl}
              title={selectedBook.title}
              className="vs-modal-cover"
            />
            <p className="vs-modal-author">by {selectedBook.author}</p>
            {selectedBook.reason && <div className="vs-modal-reason">{selectedBook.reason}</div>}
            <button
              className="vs-primary-btn vs-primary-btn-block"
              onClick={() => toggleTbr(selectedBook)}
              aria-label={isInTbr(selectedBook) ? `Remove ${selectedBook.title} from your list` : `Add ${selectedBook.title} to your list`}
            >
              {isInTbr(selectedBook) ? "In your list" : "Save to list"}
            </button>
          </>
        )}
      </Modal>

      <Modal open={!!shareLink} onClose={() => setShareLink(null)}>
        <div className="vs-modal-header">
          <h2>Share this conversation</h2>
          <button className="vs-icon-btn" onClick={() => setShareLink(null)} aria-label="Close share dialog"><Icon name="close" size={16} /></button>
        </div>
        <div className="vs-share-row">
          <input readOnly value={shareLink || ""} className="vs-input vs-share-input" aria-label="Share link" />
          <button className="vs-primary-btn" onClick={copyShareLink} aria-label="Copy share link to clipboard">
            {copyState === "copied" ? "Copied!" : copyState === "error" ? "Failed to copy" : "Copy link"}
          </button>
        </div>
      </Modal>

      {showProfile && (
        <div className="vs-modal-backdrop" onClick={() => setShowProfile(false)} tabIndex={-1} aria-modal="true" role="dialog">
          <div onClick={(e) => e.stopPropagation()}>
            <UserProfileComponent onClose={() => setShowProfile(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PersonalizedRecsComponent);

const StyleSheet = memo(function StyleSheet() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      .vs-root {
        --pink-50:  #FFF7FB;
        --pink-100: #FFE4EF;
        --pink-200: #FFC7DE;
        --pink-300: #FF8FB3;
        --pink-500: #E75480;
        --pink-700: #C2185B;
        --ink:      #4A0F2A;
        --ink-soft: #7A3457;
        --serif: 'DM Serif Display', 'Playfair Display', Georgia, serif;
        --sans:  'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        --radius-lg: 28px;
        --radius-md: 20px;
        --radius-sm: 14px;
        --shadow-lg: 0 24px 60px -20px rgba(199, 60, 110, 0.28), 0 8px 20px -10px rgba(199, 60, 110, 0.18);
        --shadow-md: 0 12px 30px -12px rgba(199, 60, 110, 0.22);

        position: relative;
        min-height: 100vh;
        width: 100%;
        overflow: hidden;
        font-family: var(--sans);
        color: var(--ink);
        background:
          radial-gradient(1200px 800px at 10% 5%, #FFF7FB 0%, rgba(255,247,251,0) 60%),
          radial-gradient(900px 700px at 90% 100%, #FFE4EF 0%, rgba(255,228,239,0) 60%),
          linear-gradient(160deg, #FFF7FB 0%, #FFE4EF 55%, #FFC7DE 100%);
        padding: 24px 20px;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
      }

      .vs-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: 40px 20px;
        animation: floatContainer 6s ease-in-out infinite;
      }
      @keyframes floatContainer { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

      .vs-empty-img {
        width: 240px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(199, 60, 110, 0.2);
        margin-bottom: 24px;
        animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

      .vs-empty-title {
        font-family: var(--serif);
        font-size: 28px;
        color: var(--pink-700);
        margin-bottom: 12px;
      }
      .vs-empty-text {
        color: var(--ink-soft);
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 24px;
        max-width: 350px;
      }

      .vs-aurora { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
      .vs-blob   { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.55; mix-blend-mode: screen; will-change: transform; }
      .vs-blob-1 { width: 520px; height: 520px; background: var(--pink-300); top: -160px; left: -120px; animation: drift1 22s ease-in-out infinite; }
      .vs-blob-2 { width: 440px; height: 440px; background: var(--pink-200); bottom: -140px; right: -100px; animation: drift2 26s ease-in-out infinite; }
      .vs-blob-3 { width: 360px; height: 360px; background: #ffb8d0;         top: 45%; left: 55%; animation: drift3 30s ease-in-out infinite; }
      .vs-blob-4 { width: 300px; height: 300px; background: #ffd6e8;         bottom: 20%; left: 8%; animation: drift1 34s ease-in-out infinite reverse; }
      @keyframes drift1 { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(60px,50px,0) scale(1.15); } }
      @keyframes drift2 { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-70px,-40px,0) scale(1.1); } }
      @keyframes drift3 { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-40px,60px,0) scale(0.9); } }
      .vs-grain {
        position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .vs-shell {
        position: relative; z-index: 1;
        display: flex; gap: 24px;
        width: 100%; max-width: 1240px;
        margin: 0 auto; min-height: calc(100vh - 48px);
      }
      .vs-main {
        flex: 1; display: flex; flex-direction: column; gap: 18px;
        min-width: 0;
      }

      .vs-glass {
        background: linear-gradient(160deg, rgba(255,255,255,0.78), rgba(255,255,255,0.5));
        backdrop-filter: blur(28px) saturate(150%);
        border: 1px solid rgba(255,255,255,0.9);
        box-shadow: var(--shadow-lg);
      }

      .vs-chat::-webkit-scrollbar, .vs-sidebar-body::-webkit-scrollbar,
      .vs-modal-body::-webkit-scrollbar { width: 8px; }
      .vs-chat::-webkit-scrollbar-thumb, .vs-sidebar-body::-webkit-scrollbar-thumb,
      .vs-modal-body::-webkit-scrollbar-thumb {
        background: linear-gradient(var(--pink-200), var(--pink-300));
        border-radius: 10px;
      }

      .vs-header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 20px; padding: 18px 24px; border-radius: var(--radius-lg);
      }
      .vs-header-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
      .vs-logo {
        position: relative; width: 52px; height: 52px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at 30% 25%, #fff, var(--pink-100));
        color: var(--pink-500);
        box-shadow: inset 0 2px 6px rgba(255,255,255,0.9), 0 8px 20px rgba(231,84,128,0.25);
        flex-shrink: 0;
      }
      .vs-logo-ring {
        position: absolute; inset: -4px; border-radius: 50%;
        border: 1.5px dashed var(--pink-300); opacity: 0.7;
        animation: spinSlow 18s linear infinite;
      }
      .vs-logo-ring-2 { inset: -10px; border-color: var(--pink-200); animation-duration: 30s; animation-direction: reverse; }
      @keyframes spinSlow { to { transform: rotate(360deg); } }

      .vs-header-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .vs-title {
        font-family: var(--serif); font-size: 34px; line-height: 1; margin: 0;
        background: linear-gradient(90deg, var(--pink-700), var(--pink-500), var(--pink-300), var(--pink-500), var(--pink-700));
        background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: shimmer 8s linear infinite; letter-spacing: -0.5px;
      }
      @keyframes shimmer { to { background-position: 200% 0; } }
      .vs-subtitle {
        margin: 4px 0 0; font-size: 12px; color: var(--ink-soft);
        font-weight: 500; letter-spacing: 0.4px; text-transform: uppercase; opacity: 0.75;
      }
      .vs-pill {
        display: inline-flex; align-items: center; gap: 5px;
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px;
        padding: 4px 10px; border-radius: 20px;
        box-shadow: 0 4px 10px rgba(231,84,128,0.35);
      }
      .vs-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .vs-header-hint {
        background: rgba(255,255,255,0.7); border: 1px solid var(--pink-200);
        color: var(--pink-700); font-size: 12px; font-weight: 600;
        padding: 8px 14px; border-radius: 20px;
      }

      .vs-chat {
        flex: 1; min-height: 400px;
        overflow-y: auto; overscroll-behavior: contain;
        border-radius: var(--radius-lg); padding: 28px 32px;
      }

      .vs-welcome {
        display: flex; flex-direction: column; align-items: center;
        text-align: center; padding: 40px 16px; gap: 12px;
      }
      .vs-welcome-orb {
        width: 84px; height: 84px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: var(--pink-500);
        background: radial-gradient(circle at 30% 25%, #fff, var(--pink-100));
        box-shadow: 0 20px 40px -12px rgba(231,84,128,0.35), inset 0 2px 6px rgba(255,255,255,0.9);
        animation: floaty 3.6s ease-in-out infinite; margin-bottom: 8px;
      }
      @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      .vs-welcome-title { font-family: var(--serif); font-size: 40px; color: var(--pink-700); margin: 0; letter-spacing: -1px; }
      .vs-welcome-sub  { max-width: 440px; margin: 0; color: var(--ink-soft); font-size: 15px; line-height: 1.55; }
      .vs-quick-moods  { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; max-width: 640px; }

      .vs-chip {
        background: rgba(255,255,255,0.75); border: 1px solid rgba(255,143,179,0.3);
        color: var(--pink-700); font-family: var(--sans); font-size: 13px; font-weight: 600;
        padding: 10px 18px; border-radius: 999px; cursor: pointer;
        transition: transform .2s cubic-bezier(.16,1,.3,1), background .2s, box-shadow .25s, border-color .2s;
        backdrop-filter: blur(10px);
      }
      .vs-chip:hover { background: #fff; border-color: var(--pink-300); transform: translateY(-2px); box-shadow: 0 10px 22px rgba(231,84,128,0.18); }
      .vs-chip:active { transform: translateY(0); }

      .vs-conv { margin-bottom: 40px; }
      .vs-user-row { display: flex; justify-content: flex-end; margin-bottom: 18px; }
      .vs-user-bubble {
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #fff; padding: 12px 20px; border-radius: 22px 22px 6px 22px;
        max-width: 78%; font-size: 14.5px; font-weight: 500; line-height: 1.4;
        box-shadow: 0 10px 24px rgba(231,84,128,0.28);
      }
      .vs-typing {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.7); border: 1px solid var(--pink-200);
        color: var(--pink-700); font-weight: 600; font-size: 14px;
        padding: 10px 16px; border-radius: 18px;
      }
      .vs-dot {
        width: 5px; height: 5px; border-radius: 50%; background: var(--pink-500);
        display: inline-block; animation: bounceDot 1.2s infinite ease-in-out;
      }
      .vs-dot:nth-child(3) { animation-delay: 0.15s; }
      .vs-dot:nth-child(4) { animation-delay: 0.3s; }
      @keyframes bounceDot { 0%,60%,100% { transform: translateY(0); opacity: 0.6; } 30% { transform: translateY(-5px); opacity: 1; } }

      .vs-found {
        display: inline-flex; align-items: center; gap: 8px;
        color: var(--ink-soft); font-size: 14px; font-weight: 600; margin: 12px 0 18px;
      }
      .vs-found-pill {
        background: linear-gradient(135deg, #fff, var(--pink-100));
        border: 1px solid var(--pink-200); color: var(--pink-700);
        padding: 3px 12px; border-radius: 999px; font-weight: 800; font-size: 14px;
      }
      .vs-groq-badge {
        margin-left: 4px;
        background: linear-gradient(90deg, var(--pink-200), var(--pink-300));
        color: var(--ink); padding: 3px 10px; border-radius: 10px;
        font-size: 10px; font-weight: 800; letter-spacing: 1px;
      }

      .vs-error {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        background: rgba(255,255,255,0.7); border: 1px solid var(--pink-200);
        border-radius: var(--radius-sm); padding: 12px 16px; margin: 8px 0 16px;
        color: var(--pink-700);
      }
      .vs-error p { margin: 0; font-size: 14px; }

      .vs-grid {
        display: grid; gap: 22px;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        padding: 6px 0;
      }
      .vs-card {
        position: relative;
        background: linear-gradient(165deg, rgba(255,255,255,0.92), rgba(255,247,251,0.85));
        border: 1px solid rgba(255,255,255,0.95);
        border-radius: 20px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 12px 30px -12px rgba(199,60,110,0.15);
        cursor: pointer;
        transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s, border-color .3s;
        will-change: transform;
        outline: none;
        min-height: 320px;
      }
      .vs-card:hover,
      .vs-card:focus-visible {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 18px 38px -10px rgba(199,60,110,0.22);
        border-color: var(--pink-200);
        outline: 2px solid var(--pink-200);
        outline-offset: 2px;
      }
      .vs-card-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        margin-top: 8px;
        min-height: 110px;
        justify-content: flex-start;
      }
      .vs-card-title {
        font-family: var(--serif);
        font-size: 16.5px;
        color: var(--pink-700);
        margin: 0 0 4px;
        line-height: 1.25;
        letter-spacing: -0.2px;
        font-weight: 700;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
      }
      .vs-card-author {
        font-size: 13px;
        color: var(--ink-soft);
        font-style: normal;
        font-weight: 500;
        line-height: 1.4;
        margin-bottom: 10px;
      }
      .vs-card-reason {
        flex: 1;
        margin: 0 0 12px;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--ink-soft);
        background: rgba(255,231,240,0.45);
        border: 1px solid rgba(255,199,222,0.5);
        padding: 10px 12px;
        border-radius: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 0;
      }
      .vs-tbr-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--pink-200);
        background: rgba(255,255,255,0.7);
        color: var(--pink-500);
        font-size: 13px;
        font-weight: 600;
        transition: all .25s ease-out;
        margin-top: auto;
      }
      .vs-tbr-btn:hover,
      .vs-tbr-btn:focus-visible {
        background: var(--pink-100);
        border-color: var(--pink-300);
        color: var(--pink-700);
      }
      .vs-tbr-btn.is-saved {
        background: var(--pink-500);
        border-color: var(--pink-500);
        color: white;
      }
      .vs-tbr-btn.is-saved:hover,
      .vs-tbr-btn.is-saved:focus-visible {
        background: var(--pink-600);
        border-color: var(--pink-600);
      }

      .vs-skeleton-card { pointer-events: none; }
      .vs-skeleton {
        background: linear-gradient(90deg, rgba(255,231,240,0.5), rgba(255,255,255,0.7), rgba(255,231,240,0.5));
        background-size: 200% 100%;
        animation: skeletonShimmer 1.5s ease-in-out infinite;
        border-radius: 8px;
      }
      .vs-skeleton-cover {
        aspect-ratio: 2/3;
        width: 100%;
        margin-bottom: 12px;
      }
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .vs-more-row { text-align: center; margin-top: 22px; }
      .vs-primary-btn {
        display: inline-flex; align-items: center; gap: 8px;
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #fff; border: none; border-radius: 999px;
        padding: 12px 26px; font-family: var(--sans); font-size: 14px; font-weight: 700;
        cursor: pointer; letter-spacing: 0.2px;
        box-shadow: 0 10px 24px -8px rgba(231,84,128,0.55), inset 0 1px 0 rgba(255,255,255,0.4);
        transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .25s;
      }
      .vs-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 30px -10px rgba(231,84,128,0.65); }
      .vs-primary-btn:active { transform: translateY(0); }
      .vs-primary-btn-block { width: 100%; justify-content: center; padding: 14px; }

      .vs-ghost-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: transparent; border: 1px solid var(--pink-300); color: var(--pink-700);
        padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer;
        transition: background .2s;
      }
      .vs-ghost-btn:hover { background: rgba(255,255,255,0.7); }

      .vs-input-area { display: flex; flex-direction: column; gap: 12px; }
      .vs-refine-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .vs-refine-chip {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.7); border: 1px solid var(--pink-200);
        color: var(--pink-700); font-size: 12.5px; font-weight: 600;
        padding: 7px 14px; border-radius: 999px; cursor: pointer;
        transition: background .2s, transform .15s, box-shadow .2s;
      }
      .vs-refine-chip:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(231,84,128,0.16); }

      .vs-form { display: flex; gap: 10px; align-items: center; }
      .vs-input {
        flex: 1; min-width: 0;
        padding: 15px 22px;
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(255,199,222,0.7);
        border-radius: 999px;
        font-family: var(--sans); font-size: 14.5px; color: var(--ink);
        box-shadow: inset 0 2px 6px rgba(0,0,0,0.03), 0 6px 18px rgba(199,60,110,0.08);
        transition: border-color .2s, box-shadow .2s, background .2s;
      }
      .vs-input:focus { outline: none; background: #fff; border-color: var(--pink-300); box-shadow: 0 0 0 4px rgba(255,143,179,0.25); }
      .vs-input::placeholder { color: #d489a4; }

      .vs-send-btn {
        width: 52px; height: 52px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #fff; border: none; cursor: pointer; flex-shrink: 0;
        box-shadow: 0 10px 24px -8px rgba(231,84,128,0.55);
        transition: transform .2s, box-shadow .2s;
      }
      .vs-send-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.03); }
      .vs-send-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .vs-spinner {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
        animation: spin .8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .vs-toolbar { display: flex; gap: 4px; padding: 6px; border-radius: 999px; flex-shrink: 0; }
      .vs-icon-btn {
        width: 38px; height: 38px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        background: transparent; border: none; color: var(--pink-700); cursor: pointer;
        transition: background .2s, color .2s, transform .15s;
      }
      .vs-icon-btn:hover { background: rgba(255,199,222,0.5); transform: translateY(-1px); }
      .vs-icon-btn-danger { color: var(--pink-500); }
      .vs-icon-btn-danger:hover { background: rgba(231,84,128,0.12); }

      .vs-sidebar {
        width: 320px; flex-shrink: 0;
        border-radius: var(--radius-lg); overflow: hidden;
        display: flex; flex-direction: column; align-self: stretch;
      }
      .vs-sidebar-header {
        padding: 20px 24px;
        background: linear-gradient(135deg, rgba(255,143,179,0.2), rgba(255,255,255,0));
        border-bottom: 1px solid rgba(255,255,255,0.5);
      }
      .vs-sidebar-header h2 {
        font-family: var(--serif); font-size: 22px; color: var(--pink-700);
        margin: 0; display: flex; align-items: center; gap: 8px;
      }
      .vs-sidebar-header p { margin: 4px 0 0; color: var(--ink-soft); font-size: 12px; font-style: italic; }
      .vs-sidebar-body {
        flex: 1; min-height: 0; overflow-y: auto;
        padding: 16px; display: flex; flex-direction: column; gap: 12px;
      }
      .vs-tbr-item {
        display: flex; gap: 12px; align-items: center;
        background: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.8);
        border-radius: var(--radius-sm); padding: 10px;
        transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s;
      }
      .vs-tbr-item:hover { transform: translateX(4px); box-shadow: 0 10px 20px -10px rgba(199,60,110,0.28); }
      .vs-tbr-cover { width: 48px; height: 72px; flex-shrink: 0; border-radius: 8px; }
      .vs-tbr-meta { flex: 1; min-width: 0; }
      .vs-tbr-title { font-family: var(--serif); font-size: 15px; color: var(--pink-700); margin: 0 0 2px; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vs-tbr-author { font-size: 11px; color: var(--ink-soft); margin: 0 0 6px; font-style: italic; }
      .vs-link-btn { background: transparent; border: none; color: var(--pink-500); font-size: 11px; padding: 0; cursor: pointer; text-decoration: underline; font-family: var(--sans); }

      .vs-modal-backdrop {
        position: fixed; inset: 0; z-index: 100;
        background: rgba(74,15,42,0.42); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        outline: none;
      }
      .vs-modal {
        width: 100%; max-height: 84vh; overflow-y: auto;
        background: rgba(255,255,255,0.96);
        border-radius: var(--radius-lg); padding: 28px;
        border: 1px solid rgba(255,255,255,0.9);
        box-shadow: 0 40px 80px -20px rgba(199,60,110,0.45);
        outline: none;
      }
      .vs-modal-pop { animation: modalPop .4s cubic-bezier(.16,1,.3,1); }
      @keyframes modalPop { from { opacity: 0; transform: translateY(16px) scale(.97); } to { opacity: 1; transform: none; } }
      .vs-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
      .vs-modal-header h2 { font-family: var(--serif); font-size: 24px; color: var(--pink-700); margin: 0; display: flex; align-items: center; gap: 8px; }
      .vs-modal-title { flex: 1; }
      .vs-modal-body { display: flex; flex-direction: column; gap: 10px; }
      .vs-modal-cover { width: 100%; aspect-ratio: 3 / 4; margin-bottom: 16px; border-radius: var(--radius-md); }
      .vs-modal-author { color: var(--ink-soft); font-style: italic; margin: 0 0 12px; font-size: 14px; }
      .vs-modal-reason {
        background: rgba(255,143,179,0.1);
        border: 1px solid var(--pink-200);
        border-radius: var(--radius-sm);
        padding: 14px 16px; margin-bottom: 20px;
        font-size: 14px; line-height: 1.6; color: var(--ink);
      }

      .vs-saved-item {
        text-align: left; background: #fff; border: 1px solid var(--pink-200);
        border-radius: var(--radius-sm); padding: 12px 16px; cursor: pointer;
        transition: transform .2s, box-shadow .2s, border-color .2s;
      }
      .vs-saved-item:hover { transform: translateY(-2px); border-color: var(--pink-300); box-shadow: 0 10px 20px -10px rgba(231,84,128,0.28); }
      .vs-saved-title { font-family: var(--serif); font-size: 15px; color: var(--pink-700); margin-bottom: 4px; }
      .vs-saved-time  { font-size: 11px; color: var(--ink-soft); }

      .vs-share-row { display: flex; gap: 10px; align-items: center; }
      .vs-share-input { padding: 12px 16px; font-size: 12.5px; border-radius: 14px; }

      .vs-fade-in {
        opacity: 0;
        animation: fadeIn .55s cubic-bezier(.16,1,.3,1) forwards;
        animation-delay: calc(var(--i, 0) * 0.06s);
      }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

      @media (max-width: 900px) {
        .vs-shell { flex-direction: column; }
        .vs-sidebar { width: 100%; max-height: 320px; }
      }
      @media (max-width: 540px) {
        .vs-sidebar { display: none !important; }
      }
      @media (max-width: 640px) {
        .vs-root { padding: 14px 12px; }
        .vs-header { padding: 14px 16px; }
        .vs-title { font-size: 26px; }
        .vs-header-hint { display: none; }
        .vs-chat { padding: 18px 16px; }
        .vs-welcome-title { font-size: 30px; }
        .vs-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .vs-toolbar { display: none; }
        .vs-input { padding: 13px 18px; font-size: 14px; }
        .vs-send-btn { width: 48px; height: 48px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .vs-blob, .vs-logo-ring, .vs-title, .vs-cover-skeleton, .vs-skeleton,
        .vs-welcome-orb, .vs-fade-in, .vs-modal-pop, .vs-dot, .vs-spinner {
          animation: none !important;
        }
      }
    `}</style>
  );
});