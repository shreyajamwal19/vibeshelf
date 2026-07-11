import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Explore.css';
import BookshelfGrid from '../components/BookshelfGrid.jsx';
import { useAuth } from "../auth/AuthContext.jsx";
import useBooksApi from '../hooks/useBooksApi.js';
import useBookAIContext from '../hooks/useBookAIContext.js';

// Inline GenreDropdown component
function GenreDropdown({ available = [], selected = [], onChange, isFiltering = false }) {
    const [open, setOpen] = React.useState(false);
    const [filter, setFilter] = React.useState('');
    const ref = React.useRef(null);
    const searchRef = React.useRef(null);

    React.useEffect(() => {
        const onDocClick = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        window.addEventListener('click', onDocClick);
        return () => window.removeEventListener('click', onDocClick);
    }, []);

    React.useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current && searchRef.current.focus(), 40);
        }
    }, [open]);

    const toggle = () => setOpen(o => !o);

    const handleToggleGenre = (g) => {
        const active = selected.includes(g);
        const next = active ? selected.filter(x => x !== g) : [...selected, g];
        onChange(next);
    };

    const clearAll = () => onChange([]);

    const filtered = React.useMemo(() => {
        const q = (filter || '').toLowerCase().trim();
        return (available || []).filter(g => !q || g.toLowerCase().includes(q));
    }, [available, filter]);

    const genreColor = (s) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
        const hue = h;
        const c1 = `hsl(${hue} 85% 82%)`;
        const c2 = `hsl(${(hue + 30) % 360} 80% 72%)`;
        return { c1, c2 };
    };

    const renderPills = () => {
        if (!selected || selected.length === 0) return <span className="genre-placeholder">Filter genres…</span>;
        const visible = selected.slice(0, 3);
        return (
            <div className="flex items-center gap-2">
                {visible.map(g => <span key={g} className="genre-pill">{g}</span>)}
                {selected.length > 3 && <span className="text-xs text-rose-600">+{selected.length - 3}</span>}
            </div>
        );
    };

    return (
        <div className="relative inline-block" ref={ref}>
            <button onClick={toggle} aria-haspopup="listbox" aria-expanded={open} className="genre-toggle glass-card card-hover-tilt px-3 py-2 rounded-xl border-2 border-rose-100 flex items-center gap-3 min-w-[220px] max-w-[420px]">
                <div className="flex-1 text-left">{renderPills()}</div>
                <div className="flex items-center gap-2">
                    <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.355a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"/></svg>
                </div>
            </button>

            {open && (
                <div className="absolute z-50 mt-3 w-[min(520px,90vw)] genre-dropdown-light bg-white dark:bg-gray-800 border border-rose-100 dark:border-gray-700 rounded-2xl p-3 shadow-2xl transform-gpu animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                        <input ref={searchRef} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter genres..." className="genre-search px-3 py-2 rounded-2xl flex-1 border border-rose-50 focus:outline-none" />

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const all = available || [];
                                    if (!all.length) return;
                                    const allSelected = all.every(g => selected.includes(g));
                                    if (allSelected) {
                                        onChange((selected || []).filter(s => !all.includes(s)));
                                    } else {
                                        const next = Array.from(new Set([...(selected || []), ...all]));
                                        onChange(next);
                                    }
                                }}
                                className="select-all-btn"
                                aria-label={`Select all genres (${(available||[]).length})`}
                                title={`Select all genres (${(available||[]).length})`}
                            >
                                <span className="select-check">✓</span>
                                <span className="select-text">Select all</span>
                            </button>

                            <button onClick={clearAll} title="Clear all" className="genre-clear-btn text-sm" aria-label="Clear all genres">Clear</button>
                        </div>
                    </div>

                    <div className="genre-list max-h-72 overflow-auto flex flex-col gap-2" role="listbox" aria-label="Genre list">
                        {filtered.length === 0 && <div className="text-sm text-gray-500 p-4">No genres match “{filter}”</div>}
                        {filtered.map((g) => {
                            const active = selected.includes(g);
                            return (
                                <label key={g} role="option" aria-selected={active} className={`genre-chip w-full relative flex items-center gap-3 px-3 py-3 rounded-lg transition transform ${active ? 'selected' : ''}`}>
                                    <input id={`genre-${g}`} name={`genre-${g}`} type="checkbox" className="native-checkbox" checked={active} onChange={() => handleToggleGenre(g)} aria-label={`Select genre ${g}`} />

                                    <span className="checkbox-box" aria-hidden>
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10l3 3 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </span>

                                    <div className="flex-1 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="genre-swatch" aria-hidden style={{background: `linear-gradient(180deg, ${genreColor(g).c1}, ${genreColor(g).c2})`}} />
                                            <span className={`text-sm ${active ? 'font-semibold text-rose-700' : 'text-rose-700/90'}`}>{g}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center">
                                            {active ? (
                                                <svg className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor"><path d="M7.629 13.314a.75.75 0 01-1.058 0l-2.78-2.78a.75.75 0 011.06-1.06l2.25 2.25L14.09 5.86a.75.75 0 111.06 1.06l-7.521 6.394z"/></svg>
                                            ) : null}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isFiltering && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-rose-600" />}
                            <button onClick={() => setOpen(false)} className="done-btn" aria-label="Close genre dropdown">
                                <span className="done-check">✓</span>
                                <span>Done</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Explore() {
    const { loading: authLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const searchTimerRef = useRef(null);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const [searchActive, setSearchActive] = useState(false);
    const priorPageRef = useRef(null);
    const pageRef = useRef(1);

    const {
        page,
        pageSize,
        books,
        results,
        total,
        loading,
        error,
        search,
        lastFetch,
        isFiltering,
        isRateLimited,
        loadPage,
        goToPage,
        nextPage,
        prevPage,
        refresh,
        hasMore
    } = useBooksApi({ initialPage: 1, pageSize: 48, prefetchPages: 2, maxConcurrent: 3 });
    
    const { setAllBooks } = useBookAIContext();
    useEffect(() => {
      if (books && books.length > 0) {
        setAllBooks(books);
      }
    }, [books, setAllBooks]);

    useEffect(() => { pageRef.current = page; }, [page]);

    const [serverWarning, setServerWarning] = useState(false);
    const fetchHistoryRef = useRef(new Map());
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [overrideResults, setOverrideResults] = useState(null);
    const [globalGenres, setGlobalGenres] = useState([]);
    const genreTimerRef = useRef(null);

    useEffect(() => {
        if (!lastFetch || !lastFetch.ts) return;
        const { page: p, hash } = lastFetch;
        if (hash == null) return;
        fetchHistoryRef.current.set(p, hash);
        const hashes = new Map();
        for (const [pg, h] of fetchHistoryRef.current.entries()) {
            if (!hashes.has(h)) hashes.set(h, []);
            hashes.get(h).push(pg);
        }
        let dupFound = false;
        for (const [h, pages] of hashes.entries()) {
            if (pages.length > 1) { dupFound = true; break; }
        }
        setServerWarning(dupFound);
    }, [lastFetch]);

    const parseGenres = useCallback((raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map(x => String(x).trim()).filter(Boolean);
        if (typeof raw === 'string') {
            const s = raw.trim();
            if (s.startsWith('[') && s.endsWith(']')) {
                try {
                    const json = s.replace(/'/g, '"');
                    const parsed = JSON.parse(json);
                    if (Array.isArray(parsed)) return parsed.map(x => String(x).trim()).filter(Boolean);
                } catch (e) { }
            }
            return s.split(',').map(x => x.trim()).filter(Boolean);
        }
        return [];
    }, []);

    const CURATED_GENRES = [
        'Fiction','Nonfiction','Mystery','Thriller','Romance','Romantic Comedy','Historical','Fantasy','Science Fiction','Horror','Memoir','Biography','Self-Help','Poetry','Young Adult','Children','Graphic Novel','Humor','Satire','Adventure','Classic','Contemporary','Crime','Cozy Mystery','Paranormal','Urban Fantasy','Magical Realism','Literary Fiction','Short Stories','Essays','Parenting','Health','Religion','Philosophy','Travel','Cooking','Art','Music','Business','Technology','History','Politics','Science','True Crime'
    ];

    const availableGenres = React.useMemo(() => {
        const freq = new Map();
        for (const b of books || []) {
            const gens = parseGenres(b.genre || b.categories || b.subject);
            for (const g of gens) {
                const key = g.trim();
                if (!key) continue;
                freq.set(key, (freq.get(key) || 0) + 1);
            }
        }
        return Array.from(freq.entries()).sort((a,b) => b[1]-a[1]).slice(0,20).map(x => x[0]);
    }, [books, parseGenres]);

    const allGenreOptions = React.useMemo(() => {
        const combined = [
            ...CURATED_GENRES,
            ...(globalGenres || []),
            ...(availableGenres || [])
        ].map(x => String(x).trim()).filter(Boolean);
        const seen = new Set();
        const out = [];
        for (const g of combined) {
            const key = g.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(g);
        }
        return out.slice(0, 200);
    }, [globalGenres, availableGenres]);

    useEffect(() => {
        let cancelled = false;
        const loadGlobal = async () => {
            try {
                const freq = new Map();
                const currentPage = page;
                for (let p = 1; p <= 3; p += 1) {
                    try {
                        const resp = await loadPage({ page: p, q: null, filters: null });
                        const items = resp?.items || [];
                        for (const it of items) {
                            const gens = parseGenres(it.genre || it.categories || it.subject);
                            for (const g of gens) {
                                if (!g) continue;
                                freq.set(g, (freq.get(g) || 0) + 1);
                            }
                        }
                    } catch (e) { }
                    if (cancelled) return;
                }
                try { await loadPage({ page: currentPage, q: lastFetch?.q ?? null, filters: null }); } catch (e) { }
                if (cancelled) return;
                const sorted = Array.from(freq.entries()).sort((a,b) => b[1]-a[1]).slice(0,50).map(x => x[0]);
                setGlobalGenres(sorted);
            } catch (e) { }
        };
        loadGlobal();
        return () => { cancelled = true; };
    }, [parseGenres, loadPage]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const genreParam = (selectedGenres && selectedGenres.length > 0) ? selectedGenres.join(',') : undefined;
                const filters = (selectedGenres && selectedGenres.length > 0) ? { genres: selectedGenres, genre: genreParam } : null;
                const resp = await search(query, filters);
                if (mounted) setOverrideResults(resp || null);
            } catch (e) { }
        })();
        return () => { mounted = false; };
    }, [selectedGenres]);

    useEffect(() => {
        try {
            if (location && location.state && location.state.fromExplore === true) {
                const s = location.state.selectedGenres;
                const p = location.state.page;
                if (Array.isArray(s)) setSelectedGenres(s);
                if (typeof p === 'number' && p > 0) goToPage(p);
            }
        } catch (e) { }
    }, [location]);

    const handleBookLinkClick = useCallback((e) => {
        try {
            const a = e.target && e.target.closest && e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute && (a.getAttribute('href') || a.href);
            if (!href) return;
            if (href.includes('/book/')) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const url = new URL(href, window.location.origin);
                    const to = url.pathname + url.search;
                    navigate(to, { state: { fromExplore: true, selectedGenres, page } });
                } catch (err) {
                    navigate(href, { state: { fromExplore: true, selectedGenres, page } });
                }
            }
        } catch (err) { }
    }, [navigate, selectedGenres, page]);

    const onQueryChange = useCallback((val) => {
        setQuery(val);
        setShowSuggestions(true);
        if (String(val || '').trim().length > 0) {
            if (!searchActive) {
                priorPageRef.current = pageRef.current || page;
            }
            setSearchActive(true);
        }
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            Promise.resolve(search(val)).then((resp) => setOverrideResults(resp || null)).catch(() => {});
        }, 350);
    }, [search]);

    const saveRecentSearch = useCallback((term) => {
        const trimmed = String(term || '').trim();
        if (!trimmed) return;
        try {
            const stored = JSON.parse(localStorage.getItem('vibeshelf-recent-searches') || '[]');
            const next = [trimmed, ...stored.filter(s => s !== trimmed)].slice(0, 8);
            localStorage.setItem('vibeshelf-recent-searches', JSON.stringify(next));
            setRecentSearches(next);
        } catch (e) { }
    }, []);

    const removeRecentSearch = useCallback((term) => {
        try {
            const stored = JSON.parse(localStorage.getItem('vibeshelf-recent-searches') || '[]');
            const next = stored.filter(s => s !== term);
            localStorage.setItem('vibeshelf-recent-searches', JSON.stringify(next));
            setRecentSearches(next);
        } catch (e) { }
    }, []);

    const handleSearchSubmit = useCallback((e) => {
        if (e && e.key && e.key !== 'Enter') return;
        if (searchTimerRef.current) { clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }
        Promise.resolve(search(query)).then((resp) => setOverrideResults(resp || null)).catch(() => {});
        if (String(query || '').trim().length > 0) {
            if (!searchActive) priorPageRef.current = pageRef.current || page;
            setSearchActive(true);
        }
        setShowSuggestions(false);
        saveRecentSearch(query);
    }, [query, search, saveRecentSearch]);

    const handleClearSearch = useCallback(() => {
        setQuery('');
        setShowSuggestions(false);
        setSearchActive(false);
        setOverrideResults(null);
        if (searchTimerRef.current) { clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }
        search('');
    }, [search]);

    const handleUndoSearch = useCallback(() => {
        setQuery('');
        setShowSuggestions(false);
        setSearchActive(false);
        setOverrideResults(null);
        try {
            const target = priorPageRef.current || pageRef.current || page || 1;
            goToPage(target);
            loadPage({ page: target, q: null, filters: null }).catch(() => { });
        } catch (e) { }
        priorPageRef.current = null;
    }, [goToPage, loadPage, page]);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('vibeshelf-recent-searches') || '[]');
            setRecentSearches(stored.slice(0, 8));
        } catch (e) { setRecentSearches([]); }
    }, []);

    useEffect(() => {
        return () => {
            if (genreTimerRef.current) clearTimeout(genreTimerRef.current);
        };
    }, []);

    const suggestions = React.useMemo(() => {
        const q = (query || '').toLowerCase().trim();
        const fromBooks = [];
        if (q) {
            for (const b of books || []) {
                const title = (b.title || '').toLowerCase();
                const author = (b.author || '').toLowerCase();
                if (title.includes(q) || author.includes(q)) {
                    fromBooks.push(b.title || b.id);
                }
                if (fromBooks.length >= 6) break;
            }
        }
        const recentMatches = recentSearches.filter(s => s && (!q || s.toLowerCase().includes(q)));
        const combined = [...recentMatches, ...fromBooks];
        const unique = Array.from(new Set(combined)).slice(0, 8);
        return unique.map((text) => ({
            text,
            isRecent: recentMatches.includes(text)
        }));
    }, [query, recentSearches, books]);

    const suggestionItems = React.useMemo(() => {
        const q = (query || '').toLowerCase().trim();
        return suggestions.map(({ text, isRecent }) => {
            const match = (books || []).find(b => {
                const t = (b.title || b.id || '').toString();
                return t.toLowerCase() === (text || '').toLowerCase() || (text && (t || '').toLowerCase().includes((text || '').toLowerCase()));
            });
            const thumb = match ? (match.image_url || match.imageUrl || match.thumbnail || null) : null;
            return { text, thumb, isRecent };
        });
    }, [suggestions, books, query]);

    const highlightText = useCallback((text, q) => {
        if (!q) return text;
        const lower = text.toLowerCase();
        const lq = q.toLowerCase();
        const parts = [];
        let idx = 0;
        while (true) {
            const found = lower.indexOf(lq, idx);
            if (found === -1) {
                parts.push({ t: text.slice(idx), m: false });
                break;
            }
            if (found > idx) parts.push({ t: text.slice(idx, found), m: false });
            parts.push({ t: text.slice(found, found + lq.length), m: true });
            idx = found + lq.length;
        }
        return parts.map((p, i) => p.m ? React.createElement('span', { key: i, className: 'font-semibold text-rose-700' }, p.t) : React.createElement('span', { key: i }, p.t));
    }, []);

    const clampIndex = (i) => {
        const max = Math.max(0, (suggestionItems || []).length - 1);
        if (i < 0) return -1;
        if (i > max) return max;
        return i;
    };

    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, total || 0);
    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div></div>
    );

    return (
        <div className="min-h-screen premium-pink-bg transition-colors relative">
            <div className="premium-header-decor" />
            <div className="container mx-auto px-6 pt-12 pb-4 flex flex-col">
                <div className="text-center mb-4">
                        <h1 className="text-5xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-pink-200 via-pink-400 to-pink-700 bg-clip-text text-transparent drop-shadow-md">Explore Books ✨</h1>
                    <p className="text-rose-600 text-sm mb-2">{(total || 0) > 0 ? `${(total || 0).toLocaleString()} books available • Showing ${startIndex}-${endIndex}` : 'Preparing your library...'}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="h-1 w-40 rounded-full bg-gradient-to-r from-pink-300 via-pink-400 to-pink-500 shadow-sm" />
                    </div>
                    
                    
                    {serverWarning && (
                        <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">⚠️ The server appears to be returning the same page for multiple requests. Pagination may not work correctly until the backend is fixed.</div>
                    )}
                    {isRateLimited && (
                        <div className="mt-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">🚫 Server is rate limiting requests — slowing down and retrying shortly.</div>
                    )}
                    {loading && <div className="mt-3 flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div><span className="text-sm text-gray-500">Loading page {page}...</span></div>}
                    {error && <div className="mt-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">🚨 Error: {String(error)} <button onClick={refresh} className="ml-2 underline">Retry</button></div>}
                </div>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex-1 max-w-xl w-full relative">
                        <div className="relative">
                            <input
                                type="text"
                                aria-label="Search books by title, author or description"
                                placeholder="Search title, author or description"
                                    value={query}
                                    onChange={(e) => onQueryChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handleUndoSearch();
                                            return;
                                        }
                                        handleSearchSubmit(e);
                                    }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                aria-expanded={showSuggestions}
                                aria-controls="explore-suggestions"
                                className="w-full pl-12 pr-12 py-4 rounded-3xl border-2 border-pink-200 bg-gradient-to-r from-white/70 to-pink-50/60 backdrop-blur-sm text-rose-800 placeholder-rose-300 focus:outline-none focus:ring-0 focus:scale-[1.01] shadow-xl transition transform-gpu explore-search"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {query && (
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); }}
                                        onClick={handleClearSearch}
                                        aria-label="Clear search"
                                        title="Clear search"
                                        className="h-8 w-8 rounded-full bg-white/80 hover:bg-rose-50 text-rose-700 flex items-center justify-center transition transform hover:scale-105 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {showSuggestions && (suggestionItems || []).length > 0 && (
                            <div className="absolute mt-2 w-full bg-white border border-rose-100 rounded-xl shadow-2xl z-30 overflow-hidden transform-gpu animate-fade-in search-suggestions">
                                <div className="px-4 py-2 bg-gradient-to-r from-pink-50 to-white/80 border-b border-rose-50 flex items-center justify-between">
                                    <div className="text-sm text-rose-600 font-medium">{String(query || '').trim().length > 0 ? 'Matches' : 'Recent searches'}</div>
                                    <div className="text-xs text-gray-400">{(suggestionItems || []).length} suggestions</div>
                                </div>
                                <div role="listbox" id="explore-suggestions" aria-label="Search suggestions" className="max-h-72 overflow-auto">
                                    {(suggestionItems || []).map((it, idx) => {
                                        const isActive = suggestionIndex === idx;
                                        return (
                                            <div
                                                key={`sugg-${idx}`}
                                                role="option"
                                                aria-selected={isActive}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    const s = it.text;
                                                    setQuery(s);
                                                    if (!searchActive) priorPageRef.current = pageRef.current || page;
                                                    setSearchActive(true);
                                                    search(s);
                                                    saveRecentSearch(s);
                                                    setShowSuggestions(false);
                                                    setSuggestionIndex(-1);
                                                }}
                                                onMouseEnter={() => setSuggestionIndex(idx)}
                                                className={`suggestion-row w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-rose-50' : 'hover:bg-rose-50'}`}
                                            >
                                                <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-pink-50 border border-rose-100">
                                                    {it.thumb ? (
                                                        <img src={it.thumb} alt="thumb" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-rose-400">📚</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`text-sm ${isActive ? 'text-rose-800 font-semibold' : 'text-rose-700'}`}>
                                                        {highlightText(it.text || '', query)}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{it.thumb ? 'Book result' : 'Recent'}</div>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                    {it.isRecent && (
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeRecentSearch(it.text);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            aria-label={`Remove ${it.text} from recent searches`}
                                                            title="Remove from recent"
                                                            className="suggestion-remove"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                    {isActive ? <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor"><path d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/></svg> : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4 lg:mt-0 items-center">
                        <button
                            onClick={() => {
                                if (searchActive) handleUndoSearch(); else handleClearSearch();
                            }}
                            disabled={loading}
                            className="search-clear-pill"
                            aria-label="Clear search and restore defaults"
                        >
                            Clear search
                        </button>

                        <button onClick={refresh} disabled={loading} className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-full shadow-lg interactive-cta">{loading ? 'Loading...' : 'Refresh'}</button>
                    </div>
                </div>
                <div className="mb-2 relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            {isFiltering && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-rose-500" />
                                    <span>Filtering…</span>
                                </div>
                            )}
                        </div>
                        <div>
                            {selectedGenres.length > 0 && (
                                <button onClick={() => { setSelectedGenres([]); search(query, null); }} className="text-sm text-rose-600 hover:underline">Clear filters</button>
                            )}
                        </div>
                    </div>

                    <GenreDropdown
                        available={allGenreOptions}
                        selected={selectedGenres}
                        onChange={(next) => {
                            setSelectedGenres(next);
                            if (genreTimerRef.current) clearTimeout(genreTimerRef.current);
                            genreTimerRef.current = setTimeout(() => {
                                const filters = (next && next.length) ? { genres: next, genre: next.join(',') } : null;
                                if (isRateLimited) {
                                    setTimeout(() => search(query, filters), 1000);
                                } else {
                                    search(query, filters);
                                }
                            }, 350);
                        }}
                        isFiltering={isFiltering}
                    />
                </div>
                
                {(() => {
                    const searchModeActive = (selectedGenres && selectedGenres.length > 0) || searchActive;
                    const displayedBooks = searchModeActive
                        ? (overrideResults && Array.isArray(overrideResults.items) ? overrideResults.items : (typeof results !== 'undefined' ? results : books))
                        : books;
                    
                    if (displayedBooks && displayedBooks.length === 0 && !loading) {
                        return (
                            <div className="flex flex-col items-center justify-center pt-2 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <img 
                                    src="https://imgs.search.brave.com/rUbb66cOBC-Pp_WPR2HpROIfiUKGWR__Ktmseo0kzXY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzFlLzlh/LzQzLzFlOWE0MzNj/ZDI0YWZmMGJiOWM1/MzM0MTRhNWIxNjMz/LmpwZw" 
                                    alt="No results found"
                                    className="w-[180px] rounded-3xl shadow-xl floating-img"
                                />
                                <h2 className="text-xl font-bold text-rose-800 mt-4 mb-1"> No books found</h2>
                                <p className="text-rose-500 text-center max-w-sm mb-4">
                                    We searched every shelf but couldn't find a match. 
                                    <br/>Try another title, author, genre or mood.
                                </p>
                                <button 
                                    onClick={() => { setSelectedGenres([]); handleClearSearch(); }}
                                    className="px-8 py-3 bg-pink-100 hover:bg-pink-200 text-rose-700 font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-md"
                                >
                                    Clear Search
                                </button>
                            </div>
                        );
                    }

                    return (
                            <div onClickCapture={handleBookLinkClick}>
                                <BookshelfGrid
                                    books={displayedBooks}
                                    onSave={(b, s) => { const storageKey = `vibeshelf-${s}`; const existing = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!existing.some(x => x.id === b.id)) { existing.push(b); localStorage.setItem(storageKey, JSON.stringify(existing)); window.dispatchEvent(new Event('storage')); } }}
                                    loading={loading}
                                    className="mb-8"
                                />
                            </div>
                    );
                })()}

                {/* Only show pagination if there are results */}
                {(!loading && (
                    (selectedGenres && selectedGenres.length > 0) || searchActive 
                    ? (overrideResults && overrideResults.items && overrideResults.items.length > 0)
                    : (books && books.length > 0)
                )) && (
                    <div className="explore-pagination mt-auto">
                        <button
                            onClick={() => prevPage()}
                            disabled={loading || page <= 1}
                            className="nav-pill"
                            aria-label="Previous page"
                        >
                            ← Previous
                        </button>

                        <div className="page-info">
                            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                        </div>

                        <div className="page-list" aria-label="Page navigation">
                            {(() => {
                                const pages = [];
                                const windowSize = 9;
                                let start = Math.max(1, page - Math.floor(windowSize / 2));
                                let end = start + windowSize - 1;
                                if (end > totalPages) { end = totalPages; start = Math.max(1, end - windowSize + 1); }
                                if (start > 1) {
                                    pages.push(1);
                                    if (start > 2) pages.push('left-ellipsis');
                                }
                                for (let i = start; i <= end; i += 1) pages.push(i);
                                if (end < totalPages) {
                                    if (end < totalPages - 1) pages.push('right-ellipsis');
                                    pages.push(totalPages);
                                }
                                return pages.map((p, idx) => {
                                    if (p === 'left-ellipsis' || p === 'right-ellipsis') return <div key={`ell-${idx}`} className="page-ellipsis">…</div>;
                                    const isCurrent = p === page;
                                    return (
                                        <button
                                            key={`pbtn-${p}`}
                                            onClick={() => goToPage(p)}
                                            disabled={loading || serverWarning}
                                            title={serverWarning ? 'Pagination disabled: server returning identical pages' : undefined}
                                            className={`page-btn ${isCurrent ? 'page-current' : ''}`}
                                            aria-current={isCurrent ? 'page' : undefined}
                                        >
                                            {p}
                                        </button>
                                    );
                                });
                            })()}
                        </div>

                        <button
                            onClick={() => nextPage()}
                            disabled={loading || !hasMore || serverWarning}
                            className="nav-pill"
                            aria-label="Next page"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Explore;