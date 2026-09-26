"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuSearch, LuGlobe, LuCornerDownLeft, LuArrowUp, LuArrowDown, LuGamepad2 } from "react-icons/lu";
import { FaSteam } from "react-icons/fa";
import { GameSearchResult, GameSource } from "@/types";

interface Props {
  onSelect: (id: number, source: GameSource) => void;
  initialSource?: GameSource;
  /** True while the selected game's requirements are loading */
  busy?: boolean;
}

const sources: { id: GameSource; label: string; icon: typeof LuGlobe }[] = [
  { id: "steam", label: "Steam", icon: FaSteam },
  { id: "igdb", label: "All games", icon: LuGlobe },
];

export default function GameSearch({ onSelect, initialSource = "steam", busy = false }: Props) {
  const isMac = useMemo(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [source, setSource] = useState<GameSource>(initialSource);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  // Picking a result fills the input with its name; don't treat that as a new search
  const skipNextSearch = useRef(false);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setSearchedTerm("");
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&source=${source}`);
      const data = await res.json();
      const items = data.items || [];
      setResults(items);
      setSearchedTerm(term);
      setSelectedIndex(items.length > 0 ? 0 : -1);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, source]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  function choose(game: GameSearchResult) {
    skipNextSearch.current = true;
    setQuery(game.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(game.id, game.source || source);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }
    if (!isOpen || results.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          choose(results[selectedIndex]);
        }
        break;
    }
  }

  const showEmpty = isOpen && !loading && searchedTerm.length >= 2 && results.length === 0 && query === searchedTerm;
  const showResults = isOpen && results.length > 0;

  return (
    <div className="w-full">
      <div ref={wrapperRef} className="relative">
        <div
          className={`relative flex items-center rounded-md border bg-base-100 shadow-soft transition-[border-color,box-shadow] duration-150 ${
            isFocused
              ? "border-base-content/40 shadow-[0_0_0_3px_oklch(var(--bc)/0.08)]"
              : "border-base-content/10 hover:border-base-content/20"
          }`}
        >
          <LuSearch className={`ml-4 sm:ml-5 h-5 w-5 shrink-0 transition-colors ${isFocused ? "text-base-content" : "text-base-content/40"}`} />
          <input
            id="game-search-input"
            type="text"
            className="h-14 sm:h-16 w-full min-w-0 bg-transparent px-3 sm:px-4 text-base sm:text-lg outline-none placeholder:text-base-content/40"
            placeholder="Search a game, e.g. Cyberpunk 2077"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); if (results.length > 0 || searchedTerm) setIsOpen(true); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-label="Search for a game"
            aria-controls="game-search-listbox"
            aria-expanded={showResults}
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 ? `game-option-${selectedIndex}` : undefined}
          />
          <div className="mr-4 sm:mr-5 flex shrink-0 items-center">
            {busy ? (
              <span className="flex items-center gap-2 whitespace-nowrap text-sm text-base-content/60" role="status">
                <span className="loading loading-spinner loading-sm" />
                <span className="hidden sm:inline">Loading requirements…</span>
              </span>
            ) : loading ? (
              <span className="loading loading-spinner loading-sm text-base-content/60" />
            ) : !query && !isFocused ? (
              <span className="hidden sm:flex items-center gap-1 text-base-content/40 pointer-events-none">
                <kbd className="kbd kbd-sm">{isMac ? "⌘" : "Ctrl"}</kbd>
                <kbd className="kbd kbd-sm">K</kbd>
              </span>
            ) : null}
          </div>
        </div>

        {(showResults || showEmpty) && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-base-content/10 bg-base-100 shadow-lift animate-dropdownIn">
            {showEmpty ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <LuGamepad2 className="h-6 w-6 text-base-content/30" />
                <p className="text-sm text-base-content/70">
                  No games found for <span className="font-semibold text-base-content">&ldquo;{searchedTerm}&rdquo;</span>
                </p>
                {source === "steam" && (
                  <button
                    className="btn btn-outline btn-xs"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setSource("igdb")}
                  >
                    Try searching all games
                  </button>
                )}
              </div>
            ) : (
              <>
                <ul
                  id="game-search-listbox"
                  ref={listRef}
                  className="flex max-h-[22rem] flex-col gap-0.5 overflow-y-auto p-1.5 scrollbar-subtle"
                  role="listbox"
                >
                  {results.map((game, index) => {
                    const selected = index === selectedIndex;
                    return (
                      <li key={game.id} id={`game-option-${index}`} role="option" aria-selected={selected}>
                        <button
                          className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left transition-colors ${selected ? "bg-base-content/[0.07]" : ""}`}
                          onClick={() => choose(game)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          {game.tiny_image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={game.tiny_image}
                              alt=""
                              className="h-9 w-[92px] shrink-0 rounded object-cover bg-base-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-9 w-[92px] shrink-0 place-items-center rounded bg-base-content/[0.06] text-base-content/30">
                              <LuGamepad2 className="h-4 w-4" />
                            </div>
                          )}
                          <span className={`min-w-0 flex-1 truncate ${selected ? "font-medium" : ""}`}>{game.name}</span>
                          <LuCornerDownLeft className={`h-4 w-4 shrink-0 text-base-content/60 transition-opacity ${selected ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden sm:flex items-center gap-4 border-t border-base-content/[0.06] bg-base-content/[0.02] px-4 py-2 text-xs text-base-content/50">
                  <span className="flex items-center gap-1.5">
                    <kbd className="kbd kbd-xs"><LuArrowUp className="h-3 w-3" /></kbd>
                    <kbd className="kbd kbd-xs"><LuArrowDown className="h-3 w-3" /></kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="kbd kbd-xs">Enter</kbd> select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="kbd kbd-xs">Esc</kbd> close
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center text-xs">
        <div className="inline-flex rounded bg-base-content/[0.06] p-0.5" role="radiogroup" aria-label="Game source">
          {sources.map(({ id, label, icon: Icon }) => {
            const active = source === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                className={`flex items-center gap-1.5 rounded px-3 py-1 font-medium transition-all ${
                  active ? "bg-base-100 text-base-content shadow-sm" : "text-base-content/60 hover:text-base-content"
                }`}
                onClick={() => { setSource(id); setResults([]); }}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
