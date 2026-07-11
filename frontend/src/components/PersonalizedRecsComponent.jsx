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
    case "flower":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="2.1" />
          <ellipse cx="12" cy="6.2" rx="2" ry="3.2" />
          <ellipse cx="12" cy="17.8" rx="2" ry="3.2" />
          <ellipse cx="6.2" cy="12" rx="3.2" ry="2" />
          <ellipse cx="17.8" cy="12" rx="3.2" ry="2" />
        </svg>
      );
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
      : "",
  coverUrl: raw.coverUrl || raw.cover || null,
});

/* ============================================================================
 * 5. SUB-COMPONENTS
 * ==========================================================================*/

const EmptyState = memo(function EmptyState({ onReset, mood, onSuggestion }) {
  // Scrapbook details: washi tape and pressed flower SVGs
  const WashiTape = () => (
    <svg width="74" height="22" style={{ position: 'absolute', top: -14, left: 24, zIndex: 2, pointerEvents: 'none', transform: 'rotate(-4deg)' }} aria-hidden="true">
      <rect x="0" y="0" width="74" height="22" rx="6" fill="#ffe4ef" stroke="#ffc7de" strokeDasharray="6 3" strokeWidth="1.5"/>
      <rect x="0" y="0" width="74" height="22" rx="6" fill="url(#washiPattern)" opacity="0.18"/>
      <defs>
        <pattern id="washiPattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.5" fill="#e75480" />
        </pattern>
      </defs>
    </svg>
  );
  const PressedFlower = () => (
    <svg width="32" height="32" style={{ position: 'absolute', bottom: 8, right: 14, zIndex: 2, pointerEvents: 'none', transform: 'rotate(7deg)' }} aria-hidden="true">
      <g opacity="0.7">
        <circle cx="16" cy="16" r="7" fill="#ffc7de" />
        <ellipse cx="16" cy="10" rx="3" ry="6" fill="#e75480" opacity="0.18" />
        <ellipse cx="10" cy="18" rx="2" ry="4" fill="#e75480" opacity="0.18" />
        <ellipse cx="22" cy="20" rx="2" ry="4" fill="#e75480" opacity="0.18" />
      </g>
    </svg>
  );
  return (
    <div className="vs-hero vs-fade-in" role="status" aria-live="polite">
      <div className="vs-hero-card vs-hero-card-premium">
        <div className="vs-hero-left">
          <span className="vs-hero-eyebrow">made for you ♡</span>
          <h2 className="vs-hero-title">Find your next favorite story.</h2>
          <p className="vs-hero-sub">
            Tell us a mood, a genre, or a book you couldn't stop thinking about.<br/>
            We'll recommend stories that feel like magic, just for you.
          </p>
          <button className="vs-hero-cta vs-hero-cta-premium" onClick={onReset} tabIndex={0}>
            Start discovering <Icon name="sparkle" size={15} />
          </button>
          <div className="vs-hero-pills vs-hero-pills-premium">
            {HERO_SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                type="button"
                className="vs-hero-pill vs-hero-pill-premium"
                style={{
                  transform: i % 2 === 0 ? 'rotate(-2.5deg)' : 'rotate(1.5deg)',
                  marginTop: i % 3 === 0 ? 2 : 0,
                  marginBottom: i % 4 === 0 ? 2 : 0,
                  zIndex: 1
                }}
                onClick={() => onSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="vs-hero-right">
          <div className="vs-hero-polaroid vs-hero-polaroid-premium">
            <WashiTape />
            <img src={heroBooks} alt="A curated stack of books" style={{ borderRadius: 10, boxShadow: '0 2px 16px 0 rgba(231,84,128,0.10)' }} />
            <div className="vs-hero-quote vs-hero-quote-premium">books are a uniquely portable magic ✨</div>
            <PressedFlower />
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
 * STYLESHEET (moved before main component to avoid TDZ)
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
        padding: 24px 20px;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
      }

      /* ---------------------------------------------------------------- */
      /* NEW EDITORIAL HERO (2-COLUMN)                                    */
      /* ---------------------------------------------------------------- */
      
      .vs-hero {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        width: 100%;
        min-height: auto; /* Changed to auto to ensure strict vertical fitting */
        margin: 0;
        animation: heroFadeUp .7s cubic-bezier(.16,1,.3,1);
      }
      @keyframes heroFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

      .vs-hero-card-premium {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        width: min(940px, 92vw);
        background: rgba(255, 255, 255, 0.8); /* Reduced opacity for more bookshelf visibility */
        border: 1.5px solid rgba(255, 228, 239, 0.55);
        border-radius: 40px;
        padding: 28px 36px; /* Tightened from 32px 40px */
        gap: 24px; /* Tightened from 36px */
        box-shadow: 0 24px 50px -20px rgba(199, 60, 110, 0.22), 0 2px 16px 0 rgba(255,199,222,0.10);
        backdrop-filter: blur(16px) saturate(120%); /* Stronger frosted glass effect */
        box-sizing: border-box;
        z-index: 2;
      }
      .vs-hero-left {
        flex: 0 0 44%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        min-width: 0;
        padding: 18px 0 0 0; /* Move block lower by ~18px, no bottom pad */
      }
      .vs-hero-right {
        flex: 0 0 56%;
        display: flex;
        justify-content: center;
        align-items: flex-start; /* Changed to flex-start to align with headline top */
        min-width: 0;
        position: relative;
        padding-top: 12px; /* Small nudge to visually align precisely with the headline */
      }
      .vs-hero-eyebrow {
        font-family: var(--serif);
        font-size: 14px;
        color: var(--pink-500);
        margin-bottom: 18px; /* More breathing room above headline */
        display: block;
        font-style: italic;
        letter-spacing: 0.01em;
        opacity: 0.92;
      }
      .vs-hero-title {
        font-family: var(--serif);
        font-size: 40px;
        line-height: 1.08;
        color: var(--pink-700);
        margin: 0 0 6px 0; /* Tighten gap below headline */
        letter-spacing: -1.2px;
        font-weight: 700;
        text-shadow: 0 2px 0 rgba(255,255,255,0.18);
      }
      .vs-hero-sub {
        font-size: 15px;
        color: var(--ink-soft);
        line-height: 1.6;
        margin-bottom: 10px; /* Tighten gap below paragraph */
        max-width: 440px;
        font-weight: 500;
        letter-spacing: 0.01em;
        opacity: 0.93;
      }
      .vs-hero-cta-premium {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(90deg, #ffc7de 0%, #ff8fb3 100%); /* Slightly darker pink for contrast */
        color: var(--pink-700);
        border: none;
        padding: 12px 28px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 15px;
        font-family: var(--sans);
        cursor: pointer;
        box-shadow: 0 6px 24px -8px rgba(231,84,128,0.13), 0 1.5px 0 rgba(255,255,255,0.18);
        transition: background .22s, color .22s, box-shadow .22s, transform .18s;
        margin-bottom: 10px; /* Tighten gap below CTA */
        border: 1.5px solid #ff8fb3; /* Darkened border to match new gradient */
        letter-spacing: 0.01em;
      }
      .vs-hero-cta-premium:hover, .vs-hero-cta-premium:focus-visible {
        background: linear-gradient(90deg, #ff8fb3 0%, #ffc7de 100%); /* Reversed hover gradient */
        color: var(--pink-700);
        box-shadow: 0 12px 32px -8px rgba(231,84,128,0.18), 0 2px 0 rgba(255,255,255,0.18);
        transform: translateY(-2px) scale(1.03) rotate(-0.5deg);
      }
      .vs-hero-pills-premium {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 8px;
        margin-top: 0;
        margin-bottom: 0;
        align-items: center; /* Ensure chips are aligned */
      }
      .vs-hero-pill-premium {
        background: linear-gradient(90deg, #fff7fb 0%, #ffe4ef 100%);
        border: 1.5px solid #ffc7de;
        padding: 8px 12px; /* Slightly taller, less horizontal padding */
        border-radius: 999px;
        color: var(--pink-700);
        font-size: 12px;
        font-weight: 600;
        font-family: var(--sans);
        cursor: pointer;
        box-shadow: 0 2px 8px -2px rgba(231,84,128,0.07);
        transition: background .18s, color .18s, box-shadow .18s, border-color .18s, transform .18s;
        margin-bottom: 0;
        position: relative;
        min-height: 32px; /* Ensure consistent height */
        display: flex;
        align-items: center;
      }
      .vs-hero-pill-premium:hover, .vs-hero-pill-premium:focus-visible {
        background: linear-gradient(90deg, #fff 0%, #ffe4ef 100%);
        color: var(--pink-500);
        border-color: var(--pink-300);
        box-shadow: 0 6px 18px -4px rgba(231,84,128,0.16), 0 1.5px 0 rgba(255,255,255,0.13);
        z-index: 2;
        transform: scale(1.045) rotate(-0.5deg);
      }
      .vs-hero-polaroid-premium {
        background: #fff8fb;
        padding: 16px 16px 54px 16px; /* Increased bottom padding for caption */
        transform: rotate(2.7deg) skew(-0.5deg, 0.7deg);
        box-shadow: 0 28px 56px -20px rgba(199,60,110,0.15), 0 2px 20px 0 rgba(255,199,222,0.12);
        max-width: 350px; /* Increased size by ~13% */
        border-radius: 8px;
        position: relative;
        min-height: 315px; /* Proportional height increase */
        margin-bottom: 0;
        margin-top: 0;
        border: 1.5px solid #ffe4ef;
        overflow: visible;
        z-index: 3;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 28px 56px -20px rgba(199,60,110,0.15), 0 2px 20px 0 rgba(255,199,222,0.12);
      }
      .vs-hero-polaroid-premium::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: 8px;
        bottom: 8px;
        background: rgba(255, 228, 239, 0.3);
        border-radius: 8px;
        z-index: -1;
        transform: rotate(-1.5deg);
        opacity: 0.6;
      }
      .vs-hero-polaroid-premium::after {
        content: '';
        position: absolute;
        top: 6px;
        left: 6px;
        right: -6px;
        bottom: -6px;
        background: rgba(255, 228, 239, 0.2);
        border-radius: 8px;
        z-index: -2;
        transform: rotate(1.2deg);
        opacity: 0.4;
      }
      .vs-hero-polaroid-premium::before {
        background-image: radial-gradient(circle at 20% 20%, rgba(231, 84, 128, 0.08) 0%, transparent 40%),
                         radial-gradient(circle at 80% 80%, rgba(255, 199, 222, 0.12) 0%, transparent 35%);
        border-radius: 8px;
      }
      .vs-hero-polaroid-premium::after {
        background: linear-gradient(45deg, transparent 48%, rgba(255, 228, 239, 0.15) 50%, transparent 52%),
                    linear-gradient(-45deg, transparent 48%, rgba(255, 228, 239, 0.15) 50%, transparent 52%);
        border-radius: 8px;
      }
      .vs-hero-polaroid-premium img {
        width: 100%;
        height: auto;
        display: block;
        border-radius: 10px;
        box-shadow: 0 2px 16px 0 rgba(231,84,128,0.10);
        position: relative;
        z-index: 1;
      }
      .vs-hero-quote-premium {
        position: absolute;
        bottom: 16px; /* Centered in the 54px bottom padding area */
        left: 0;
        right: 0;
        text-align: center;
        font-family: 'Caveat', cursive; /* Whimsical handwritten font */
        font-size: 24px;
        color: #b01549; /* Richer pink color */
        transform: rotate(-1.5deg); /* Slight handwritten slant */
        opacity: 0.95;
        letter-spacing: 0.04em; /* Increased letter spacing */
        background: transparent; /* Removed background to look natively written */
        padding: 0;
        border: none;
        box-shadow: none;
        white-space: nowrap; /* Forces one clean line */
        z-index: 2;
      }

      @media (max-width: 900px) {
        .vs-hero-card-premium {
          flex-direction: column;
          padding: 24px 16px;
          gap: 20px;
        }
        .vs-hero-left, .vs-hero-right {
          flex: 1 1 100%;
          padding: 0;
        }
        .vs-hero-polaroid-premium {
          margin-top: 0;
          max-width: 280px;
          min-height: 260px;
        }
        .vs-hero-polaroid-premium::before,
        .vs-hero-polaroid-premium::after {
          display: none;
        }
      }
      @media (max-width: 540px) {
        .vs-hero-title {
          font-size: 32px;
        }
        .vs-hero-card-premium {
          padding: 16px 8px;
          gap: 12px;
        }
        .vs-hero-polaroid-premium {
          max-width: 96vw;
          min-height: 240px;
        }
        .vs-hero-polaroid-premium::before,
        .vs-hero-polaroid-premium::after {
          display: none;
        }
      }


      /* ---------------------------------------------------------------- */
      /* SEARCH BAR & INPUT AREA                                          */
      /* ---------------------------------------------------------------- */
      .vs-input-area { 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
        width: min(1100px, 92vw); 
        margin: 0 auto; 
        position: relative;
        z-index: 10;
        margin-bottom: 24px;
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
      
      /* Redesigned Stop Button */
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
        margin: 0 auto; height: calc(100vh - 48px);
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
        border-radius: var(--radius-lg); padding: 28px 32px;
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
        .vs-hero-title { font-size: 40px; }
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
    const response = await fetch("/api/recommend", {
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