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
import heroBooks from "../assets/book1.svg";
import heroBackground from "../assets/book2.svg";

/* ============================================================================
 * 1. CONSTANTS & ICONS
 * ==========================================================================*/

const LS_TBR = "vibeshelf_tbr";

const REFINEMENTS = {
  darker: " but darker and more intense",
  lighter: " but lighter and uplifting",
  series: " preferably a series",
  standalone: " but standalone only",
  fastpaced: " fast-paced and gripping",
  slowburn: " slow-burn and atmospheric",
};

const HERO_SUGGESTIONS = [
  "Cozy fantasy",
  "Books like Harry Potter",
  "Dark academia",
  "Found family",
  "Slow romance",
  "Bittersweet endings",
  "Literary fiction",
  "Magical realism",
];

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
    case "sparkle-outline":
      return (
        <svg {...common}>
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
        </svg>
      );
    case "send":
      return (
        <svg {...common} style={{ transform: "rotate(45deg)", ...style }}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
    case "cup":
      return <svg {...common}><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>;
    case "library":
      return <svg {...common}><path d="M4 10v7" /><path d="M8 10v7" /><path d="M12 10v7" /><path d="M16 10v7" /><path d="M20 10v7" /><path d="M2 21h20" /><path d="M12 4l9 4H3l9-4z" /></svg>;
    case "users":
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "droplet":
      return <svg {...common} fill="currentColor" stroke="none"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
    default:
      return null;
  }
});

const getPillIcon = (text) => {
  const t = text.toLowerCase();
  if (t.includes("cozy")) return "cup";
  if (t.includes("harry")) return "zap";
  if (t.includes("academia")) return "library";
  if (t.includes("family")) return "users";
  if (t.includes("romance")) return "heart";
  if (t.includes("endings")) return "droplet";
  if (t.includes("fiction")) return "book";
  if (t.includes("magical")) return "sparkle-outline";
  return "sparkle";
};

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
      : "",
  coverUrl: raw.coverUrl || raw.cover || null,
});

/* ============================================================================
 * 5. SUB-COMPONENTS
 * ==========================================================================*/

const EmptyState = memo(function EmptyState({ onReset, mood, onSuggestion }) {
  // Checkered Washi Tape
  const WashiTape = () => (
    <svg width="80" height="20" style={{ position: 'absolute', top: -10, left: '50%', zIndex: 2, pointerEvents: 'none', transform: 'translateX(-50%) rotate(-1deg)' }} aria-hidden="true">
      <rect x="0" y="0" width="80" height="20" fill="#f8b6cc" opacity="0.9"/>
      <pattern id="checkers" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#f09cb8" />
        <rect x="4" y="4" width="4" height="4" fill="#f09cb8" />
      </pattern>
      <rect x="0" y="0" width="80" height="20" fill="url(#checkers)" opacity="0.8"/>
      <rect x="0" y="0" width="80" height="20" fill="url(#noise)" opacity="0.1"/>
      <defs>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
        </filter>
      </defs>
    </svg>
  );

  // Cute Band-aid Sticker
  const BandAid = () => (
    <svg width="48" height="24" style={{ position: 'absolute', bottom: -8, right: -12, zIndex: 3, pointerEvents: 'none', transform: 'rotate(-15deg)' }} viewBox="0 0 60 30" aria-hidden="true">
      <rect x="2" y="5" width="56" height="20" rx="10" fill="#ffb4a2" stroke="#e5989b" strokeWidth="1.5" />
      <rect x="18" y="5" width="24" height="20" fill="#ffd1c8" />
      <circle cx="23" cy="11" r="1.5" fill="#e5989b" />
      <circle cx="37" cy="11" r="1.5" fill="#e5989b" />
      <circle cx="23" cy="19" r="1.5" fill="#e5989b" />
      <circle cx="37" cy="19" r="1.5" fill="#e5989b" />
      {/* Happy Face */}
      <circle cx="27" cy="15" r="1.5" fill="#6d597a" />
      <circle cx="33" cy="15" r="1.5" fill="#6d597a" />
      <path d="M28 17.5 Q30 20 32 17.5" fill="none" stroke="#6d597a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  // Hand-drawn Stars & Sparkles
  const StarDoodle = ({ style }) => (
    <svg width="24" height="24" viewBox="0 0 100 100" style={{ position: 'absolute', pointerEvents: 'none', ...style }} aria-hidden="true">
      <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" fill="none" stroke="var(--pink-300)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );

  const SparkleDoodle = ({ style }) => (
    <svg width="14" height="14" viewBox="0 0 100 100" style={{ position: 'absolute', pointerEvents: 'none', ...style }} aria-hidden="true">
      <path d="M50 5 Q50 50 95 50 Q50 50 50 95 Q50 50 5 50 Q50 50 50 5 Z" fill="var(--pink-300)" />
    </svg>
  );

  return (
    <div className="vs-hero vs-fade-in" role="status" aria-live="polite">
      <div className="vs-hero-card-scrapbook">
        
        <div className="vs-hero-top-section">
          <div className="vs-hero-left">
            <div className="vs-hero-eyebrow-sticker">made for you ♡</div>
            
            <StarDoodle style={{ top: -5, left: 140, transform: 'rotate(15deg)' }} />
            <SparkleDoodle style={{ top: 20, right: 30 }} />
            
            <h2 className="vs-hero-title">
              Find your next favorite story.
              <SparkleDoodle style={{ display: 'inline-block', position: 'relative', top: -12, left: 5, width: 20, height: 20 }} />
            </h2>
            <p className="vs-hero-sub">
              Tell us a mood, a genre, or a book you couldn't stop thinking about.<br/>
              We'll recommend stories that feel like magic, just for you.
            </p>
            
            <button className="vs-hero-cta-scrapbook" onClick={onReset} tabIndex={0}>
              Start discovering <Icon name="sparkle" size={14} />
            </button>
          </div>
          
          <div className="vs-hero-right">
            <div className="vs-hero-polaroid-scrapbook">
              <WashiTape />
              <div className="vs-polaroid-image-container">
                <img src={heroBooks} alt="A curated stack of books" />
              </div>
              <div className="vs-hero-quote-scrapbook">books are a uniquely portable magic ✨</div>
              <BandAid />
            </div>
          </div>
        </div>

        <div className="vs-hero-bottom-section">
          <div className="vs-hero-pills-scrapbook">
            {HERO_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="vs-hero-pill-scrapbook"
                onClick={() => onSuggestion(s)}
              >
                <Icon name={getPillIcon(s)} size={13} className="vs-pill-icon" />
                {s}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
});

const NoResultsState = memo(function NoResultsState({ onReset }) {
  return (
    <div className="vs-noresults vs-fade-in" role="status" aria-live="polite">
      <p className="vs-noresults-title">No matches for that one</p>
      <p className="vs-noresults-text">Try describing the mood or vibe a little differently.</p>
      <button className="vs-ghost-btn" onClick={onReset} tabIndex={0}>
        <Icon name="refresh" size={14} /> New search
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
 * STYLESHEET
 * ==========================================================================*/

const StyleSheet = memo(function StyleSheet() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

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
        height: 100vh;
        width: 100%;
        overflow: hidden;
        font-family: var(--sans);
        color: var(--ink);
        background:
          radial-gradient(1200px 800px at 10% 5%, #FFF7FB 0%, rgba(255,247,251,0) 60%),
          radial-gradient(900px 700px at 90% 100%, #FFE4EF 0%, rgba(255,228,239,0) 60%),
          linear-gradient(160deg, #FFF7FB 0%, #FFE4EF 55%, #FFC7DE 100%);
        padding: 16px 20px;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
      }

      /* ---------------------------------------------------------------- */
      /* NEW SCRAPBOOK HERO                                               */
      /* ---------------------------------------------------------------- */
      
      .vs-hero {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        flex: 1;
        width: 100%;
        min-height: auto;
        margin: 0;
        padding-top: 16px;
        padding-bottom: 8px;
        animation: heroFadeUp .7s cubic-bezier(.16,1,.3,1);
      }
      @keyframes heroFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

      .vs-hero-card-scrapbook {
        position: relative;
        display: flex;
        flex-direction: column;
        width: min(1100px, 95vw);
        min-height: 520px;
        justify-content: space-between;
        background: rgba(253, 249, 250, 0.6);
        backdrop-filter: blur(12px);
        border-radius: 24px;
        padding: 48px 56px 36px;
        box-shadow: 0 12px 40px -12px rgba(210, 110, 140, 0.25), 0 2px 10px rgba(210, 110, 140, 0.08);
        border: 1px solid rgba(248, 225, 231, 0.8);
        box-sizing: border-box;
        z-index: 2;
        border: 8px double rgba(231, 84, 128, 0.3); outline: 2px solid rgba(231, 84, 128, 0.1); outline-offset: 6px;
      }

      .vs-hero-top-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 32px;
        margin-top: auto; 
        margin-bottom: auto; 
      }

      .vs-hero-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        position: relative;
      }

      .vs-hero-right {
        flex: 0 0 340px; 
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }

      .vs-hero-eyebrow-sticker {
        font-family: 'Caveat', cursive;
        font-size: 17px;
        color: #9c1f48;
        background: #fff0f5;
        padding: 5px 14px;
        border-radius: 6px;
        transform: rotate(-2deg);
        margin-bottom: 20px;
        box-shadow: 2px 2px 0px rgba(231, 84, 128, 0.15);
        border: 1px dashed rgba(231, 84, 128, 0.4);
        display: inline-block;
        font-weight: 600;
        cursor: default;
      }

      .vs-hero-title {
        font-family: var(--serif);
        font-size: 44px;
        line-height: 1.05;
        color: var(--pink-700);
        margin: 0 0 16px 0;
        letter-spacing: -1.2px;
        font-weight: 700;
        position: relative;
        text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.5);
      }

      .vs-hero-sub {
        font-size: 16px;
        color: var(--ink-soft);
        line-height: 1.6;
        margin-bottom: 24px;
        max-width: 520px;
        font-weight: 500;
      }

      .vs-hero-cta-scrapbook {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #FFF;
        border: none;
        padding: 14px 30px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 15px;
        font-family: var(--sans);
        cursor: pointer;
        box-shadow: 0 8px 20px -6px rgba(231, 84, 128, 0.4);
        transition: transform .2s, box-shadow .2s, filter .2s;
        position: relative;
        z-index: 10;
      }
      .vs-hero-cta-scrapbook:hover {
        filter: brightness(1.05);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 24px -6px rgba(231, 84, 128, 0.5);
      }

      /* Clean Flex Layout for Pills */
      .vs-hero-bottom-section {
        width: 100%;
        display: flex;
        justify-content: center;
        border-top: 1px dashed rgba(244, 213, 223, 0.8);
        padding-top: 24px; 
        margin-top: 32px; 
      }

      .vs-hero-pills-scrapbook {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        max-width: 1000px; 
      }

      .vs-hero-pill-scrapbook {
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid var(--pink-200);
        padding: 8px 16px;
        border-radius: 20px;
        color: var(--pink-700);
        font-size: 13.5px;
        font-weight: 600;
        font-family: var(--sans);
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(231,84,128,0.04);
        transition: all .2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .vs-hero-pill-scrapbook:hover {
        background: var(--pink-50);
        border-color: var(--pink-300);
        color: var(--pink-700);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(231, 84, 128, 0.12);
      }
      .vs-pill-icon {
        color: var(--pink-500);
      }

      /* Polaroid Styling */
      .vs-hero-polaroid-scrapbook {
        background: #FFFFFF;
        padding: 14px 14px 64px 14px; 
        transform: rotate(3deg);
        box-shadow: 0 16px 32px -10px rgba(160, 60, 90, 0.15), 0 2px 8px rgba(0,0,0,0.03);
        border-radius: 2px;
        position: relative;
        z-index: 3;
        border: 1px solid #F5E6EA;
        transition: transform .3s ease;
        width: 100%;
      }
      .vs-hero-polaroid-scrapbook:hover {
        transform: rotate(1deg) scale(1.02);
      }
      .vs-polaroid-image-container {
        overflow: hidden;
        border-radius: 2px;
        background: #FDF9FA;
      }
      .vs-hero-polaroid-scrapbook img {
        width: 100%;
        height: auto;
        display: block;
        filter: sepia(0.05) contrast(1.02);
      }
      .vs-hero-quote-scrapbook {
        position: absolute;
        bottom: 22px; 
        left: 0;
        right: 0;
        text-align: center;
        font-family: 'Caveat', cursive;
        font-size: 22px; 
        line-height: 1.2;
        color: var(--ink-soft);
        opacity: 0.9;
        letter-spacing: 0.02em;
      }

      @media (max-width: 900px) {
        .vs-hero-card-scrapbook { padding: 32px 24px; min-height: auto; }
        .vs-hero-top-section { flex-direction: column; text-align: center; gap: 32px; }
        .vs-hero-left { align-items: center; }
        .vs-hero-eyebrow-sticker { margin: 0 auto 16px; }
        .vs-hero-polaroid-scrapbook { max-width: 280px; }
      }
      @media (max-width: 540px) {
        .vs-hero-title { font-size: 32px; }
        .vs-hero-card-scrapbook { padding: 24px 16px; }
        .vs-hero-polaroid-scrapbook { max-width: 90vw; }
      }

      /* ---------------------------------------------------------------- */
      /* SEARCH BAR & INPUT AREA                                          */
      /* ---------------------------------------------------------------- */
      .vs-input-area { 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
        width: min(1100px, 95vw); 
        margin: 0 auto; 
        position: relative;
        z-index: 10;
        margin-bottom: 2px; 
      }
      
      .vs-refine-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
      .vs-refine-chip {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.7); border: 1px solid var(--pink-200);
        color: var(--pink-700); font-size: 12px; font-weight: 600;
        padding: 6px 12px; border-radius: 999px; cursor: pointer;
        transition: background .2s, transform .15s, box-shadow .2s;
      }
      .vs-refine-chip:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(231,84,128,0.16); }

      .vs-form { display: flex; gap: 12px; align-items: center; }
      
      .vs-input {
        flex: 1; min-width: 0;
        padding: 16px 24px; 
        background: rgba(255, 253, 254, 0.85);
        backdrop-filter: blur(20px);
        border: 2px solid #FFC7DE;
        border-radius: 999px;
        font-family: 'Plus Jakarta Sans', sans-serif; 
        font-size: 16px; 
        font-weight: 600;
        color: var(--pink-700);
        box-shadow: 0 8px 20px -8px rgba(199,60,110,0.2);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .vs-input:focus { 
        outline: none; 
        background: #fff; 
        border-color: var(--pink-300); 
        box-shadow: 0 10px 24px -6px rgba(199,60,110,0.3);
        transform: translateY(-2px);
      }
      .vs-input::placeholder { color: #E75480; opacity: 0.6; font-weight: 400; font-style: italic; }

      .vs-send-btn {
        width: 52px; height: 52px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, var(--pink-300), var(--pink-500));
        color: #fff; border: none; cursor: pointer; flex-shrink: 0;
        box-shadow: 0 12px 24px -8px rgba(231,84,128,0.5);
        transition: all .25s ease;
      }
      .vs-send-btn:hover:not(:disabled) { 
        transform: translateY(-2px) scale(1.05); 
        box-shadow: 0 16px 28px -6px rgba(231,84,128,0.6); 
      }
      .vs-send-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
      
      .vs-stop-btn { 
        background: linear-gradient(135deg, #FF7EB3, #FF5D9E, #F06292) !important;
        box-shadow: 0 8px 20px -5px rgba(240, 98, 146, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        backdrop-filter: blur(4px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .vs-stop-btn:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.02) !important;
        filter: brightness(1.1);
        box-shadow: 0 12px 30px -5px rgba(240, 98, 146, 0.6) !important;
      }
      .vs-stop-btn:active {
        transform: scale(0.95) !important;
      }

      .vs-spinner {
        width: 20px; height: 20px; border-radius: 50%;
        border: 2.5px solid rgba(255,255,255,0.35); border-top-color: #fff;
        animation: spin .8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .vs-noresults {
        text-align: center;
        padding: 30px 16px;
      }
      .vs-noresults-title { font-family: var(--serif); font-size: 20px; color: var(--pink-700); margin: 0 0 6px; }
      .vs-noresults-text { color: var(--ink-soft); font-size: 13.5px; margin: 0 0 16px; }

      .vs-aurora { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
      .vs-grain {
        position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .vs-shell {
        position: relative; z-index: 1;
        display: flex; gap: 24px;
        width: 100%; max-width: 1240px;
        margin: 0 auto; height: calc(100vh - 32px);
      }
      .vs-main {
        flex: 1; display: flex; flex-direction: column; gap: 18px;
        min-width: 0; min-height: 0;
      }

      .vs-glass {
        background: linear-gradient(160deg, rgba(255,255,255,0.78), rgba(255,255,255,0.5));
        backdrop-filter: blur(28px) saturate(150%);
        border: 1px solid rgba(255,255,255,0.9);
        box-shadow: var(--shadow-lg);
      }

      .vs-sidebar-body::-webkit-scrollbar,
      .vs-modal-body::-webkit-scrollbar { width: 8px; }
      .vs-sidebar-body::-webkit-scrollbar-thumb,
      .vs-modal-body::-webkit-scrollbar-thumb {
        background: linear-gradient(var(--pink-200), var(--pink-300));
        border-radius: 10px;
      }

      .vs-chat::-webkit-scrollbar { width: 8px; }
      .vs-chat::-webkit-scrollbar-track {
        background: #FCE7F3;
        border-radius: 10px;
        margin: 16px 0;
      }
      .vs-chat::-webkit-scrollbar-thumb {
        background: #EC4899;
        border-radius: 10px;
      }
      .vs-chat::-webkit-scrollbar-thumb:hover {
        background: #DB2777;
      }

      .vs-chat {
        flex: 1; min-height: 0;
        display: flex; flex-direction: column;
        overflow-y: auto; overscroll-behavior: contain;
        border-radius: var(--radius-lg); 
        padding: 8px 32px 16px 32px; 
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: #EC4899 #FCE7F3;
      }

      .vs-conv { margin-bottom: 40px; width: 100%; }
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

      .vs-skeleton-card { pointer-events: none; background: linear-gradient(165deg, #FFFBFD, #FFF8FB); }
      .vs-skeleton {
        background: linear-gradient(90deg, #F8DCE8, #FFEFF6, #F8DCE8);
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

      .vs-fade-in {
        opacity: 0;
        animation: fadeIn .55s cubic-bezier(.16,1,.3,1) forwards;
        animation-delay: calc(var(--i, 0) * 0.06s);
      }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

      @media (max-width: 900px) {
        .vs-shell { flex-direction: column; }
        .vs-sidebar { width: 100%; max-height: 320px; }
        .vs-hero-card { flex-direction: column; padding: 30px; gap: 30px; }
      }
      @media (max-width: 540px) {
        .vs-sidebar { display: none !important; }
      }
      @media (max-width: 640px) {
        .vs-root { padding: 14px 12px; }
        .vs-chat { padding: 18px 16px; }
        .vs-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .vs-input { padding: 13px 18px; font-size: 14px; }
        .vs-send-btn { width: 48px; height: 48px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .vs-fade-in, .vs-modal-pop, .vs-dot, .vs-spinner {
          animation: none !important;
        }
      }
    `}</style>
  );
});

/* ============================================================================
 * 6. MAIN COMPONENT
 * ==========================================================================*/

const PersonalizedRecsComponent = () => {
  useBooksData();

  const chatRef = useRef(null);
  const abortControllerRef = useRef(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now())
  );

  const [mood, setMood] = useState("");
  const [currentMood, setCurrentMood] = useState("");
  const [conversations, setConversations] = useState([]);
  const [tbrList, setTbrList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    setTbrList(safeParse(localStorage.getItem(LS_TBR), []));
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

  const handleHeroSuggestion = useCallback((text) => {
    setMood(text);
    const input = document.querySelector('.vs-input');
    if (input) input.focus();
  }, []);

  const refine = useCallback((type) => {
    setMood(currentMood + (REFINEMENTS[type] || ""));
  }, [currentMood]);

  const requestRecs = useCallback(async (query, signal) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: query, sessionId: sessionIdRef.current }),
      signal
    });
    if (!response.ok) throw new Error("Backend connection failed.");
    const data = await response.json();
    return extractBooks(data);
  }, []);

  const stopSearch = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setLoading(false);
        setConversations(prev => prev.slice(0, -1));
    }
  }, []);

  const submitMood = useCallback(async (e) => {
    e?.preventDefault?.();
    const query = mood.trim();
    if (!query || loading) return;

    setCurrentMood(query);
    setMood("");
    setLoading(true);

    abortControllerRef.current = new AbortController();
    
    const convId = `c-${Date.now()}`;
    setConversations((prev) => [
      ...prev,
      { id: convId, query, books: [], timestamp: new Date(), isLoading: true, error: null },
    ]);

    try {
      const { books } = await requestRecs(query, abortControllerRef.current.signal);

      const unique = dedupeAgainstSeen(books);
      const formatted = unique.map((b, i) => formatBook(b, `${convId}-${i}`));

      setConversations((prev) => prev.map((c) =>
        c.id === convId ? { ...c, books: formatted, isLoading: false } : c
      ));
    } catch (err) {
      if (err.name === 'AbortError') {
          return;
      }
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
      const { books } = await requestRecs(currentMood);
      const unique = dedupeAgainstSeen(books).slice(0, 4);

      const formatted = unique.map((b, i) => formatBook(b, `more-${Date.now()}-${i}`));

      setConversations((prev) => {
        const next = prev.slice();
        const last = { ...next[next.length - 1] };
        last.books = [...last.books, ...formatted];
        last.isLoadingMore = false;
        next[next.length - 1] = last;
        next[next.length - 1].books = unique.map((b, i) => formatBook(b, `more-${Date.now()}-${i}`));
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
   <div 
      className="vs-root"
      style={conversations.length === 0 ? {
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      } : {}}
    >
      <StyleSheet />

      <div className="vs-aurora" aria-hidden="true">
        <div className="vs-grain" />
      </div>

      <div className="vs-shell">
        <main className="vs-main" style={{ maxWidth: tbrList.length > 0 ? 820 : '100%' }}>
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
                type={loading ? "button" : "submit"}
                className={`vs-send-btn ${loading ? 'vs-stop-btn' : ''}`}
                onClick={loading ? stopSearch : undefined}
                disabled={!loading && !mood.trim()}
                aria-label={loading ? "Stop searching" : "Get recommendations"}
              >
                {loading ? <Icon name="close" size={18} /> : <Icon name="send" size={18} />}
              </button>
            </form>
          </div>

          <section ref={chatRef} className={`vs-chat ${conversations.length === 0 ? "" : "vs-glass"}`}>
            {conversations.length === 0 ? (
              <EmptyState onReset={handleEmptyReset} mood={mood} onSuggestion={handleHeroSuggestion} />
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
                  ) : conv.books?.length > 0 ? null : !conv.isLoading && conv.books?.length === 0 ? (
                      <NoResultsState onReset={handleEmptyReset} />
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
                    {conv.books?.map((book, bidx) => (
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
                      Array.from({ length: 12 }).map((_, i) => (
                        <SkeletonCard key={`sk-${conv.id}-${i}`} index={conv.books?.length + i} />
                      ))}
                  </div>

                  {convIdx === conversations.length - 1 &&
                    !loading &&
                    conv.books?.length > 0 && (
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
    </div>
  );
};

export default memo(PersonalizedRecsComponent);