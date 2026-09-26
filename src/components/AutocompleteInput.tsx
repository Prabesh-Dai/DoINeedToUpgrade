"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSubmit,
  options,
  placeholder,
  disabled,
  className,
  id,
  name,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = `${id ?? name ?? "autocomplete"}-listbox`;

  const filtered = (() => {
    if (!value.trim()) return [];
    const tokens = value.toLowerCase().split(/\s+/).filter(Boolean);
    return options
      .filter((opt) => {
        const lower = opt.toLowerCase();
        return tokens.every((t) => lower.includes(t));
      })
      .slice(0, 10);
  })();

  // Reset highlight when filtered results change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered.length, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  function selectItem(item: string) {
    onChange(item);
    setIsOpen(false);
    setHighlightIndex(-1);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        spellCheck={false}
        className={`input input-bordered w-full ${className ?? ""}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!isOpen && filtered.length > 0) {
              setIsOpen(true);
              setHighlightIndex(0);
            } else if (isOpen && filtered.length > 0) {
              setHighlightIndex((i) =>
                i < filtered.length - 1 ? i + 1 : 0
              );
            }
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (isOpen && filtered.length > 0) {
              setHighlightIndex((i) =>
                i > 0 ? i - 1 : filtered.length - 1
              );
            }
          } else if (e.key === "Tab" && isOpen) {
            if (highlightIndex >= 0) {
              selectItem(filtered[highlightIndex]);
            } else {
              setIsOpen(false);
              setHighlightIndex(-1);
            }
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && highlightIndex >= 0) {
              selectItem(filtered[highlightIndex]);
            } else if (!isOpen || filtered.length === 0) {
              onSubmit?.();
            } else {
              setIsOpen(false);
            }
          } else if (e.key === "Escape") {
            setIsOpen(false);
            setHighlightIndex(-1);
          }
        }}
        onFocus={() => filtered.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-controls={listId}
        aria-expanded={isOpen && filtered.length > 0}
        aria-autocomplete="list"
        aria-activedescendant={
          highlightIndex >= 0 ? `${listId}-${highlightIndex}` : undefined
        }
      />
      {isOpen && filtered.length > 0 && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1.5 flex max-h-64 w-full flex-col gap-0.5 overflow-y-auto rounded-md border border-base-content/10 bg-base-100 p-1 shadow-lift scrollbar-subtle animate-dropdownIn"
        >
          {filtered.map((item, index) => (
            <li key={item} id={`${listId}-${index}`} role="option" aria-selected={index === highlightIndex}>
              <button
                type="button"
                className={`w-full rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors ${index === highlightIndex ? "bg-base-content/[0.07] text-base-content" : "text-base-content/80"}`}
                onClick={() => selectItem(item)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
