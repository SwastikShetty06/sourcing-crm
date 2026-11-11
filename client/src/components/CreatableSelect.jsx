import React, { useState, useEffect, useRef, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLookups } from '../api/lookups';
import { findSimilarOption } from '../lib/similar';

export function CreatableSelect({
  label,
  type,
  value,
  onChange,
  parentId = null,
  disabled = false,
  required = false,
  placeholder = '',
  error = null,
  hint = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  // If type is 'cp' and parentId is not given or is a newly created firm (has name but no id),
  // we cannot fetch child CPs from server by id.
  const isFirmNewOrMissing = type === 'cp' && (!parentId || typeof parentId !== 'string' || parentId.length < 10);

  const { data: options = [] } = useQuery({
    queryKey: ['lookups', type, parentId],
    queryFn: () => getLookups({ type, parentId }),
    enabled: !disabled && !isFirmNewOrMissing
  });

  // Keep input value in sync when value prop changes externally
  useEffect(() => {
    if (value && value.name) {
      setInputValue(value.name);
    } else if (!value) {
      setInputValue('');
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If user typed something without picking, revert to current value name
        if (value && value.name) {
          setInputValue(value.name);
        } else if (!value) {
          setInputValue('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Filter options based on typed input
  const query = inputValue.trim().toLowerCase();

  let visibleOptions = [];
  if (!query) {
    // Show top 8 options with highest useCount, ties broken by lastUsedAt
    visibleOptions = [...options]
      .sort((a, b) => {
        if (b.useCount !== a.useCount) return b.useCount - a.useCount;
        return new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0);
      })
      .slice(0, 8);
  } else {
    // Matches starting with query ranked first, then matches anywhere in name
    const startsWith = [];
    const contains = [];

    for (const opt of options) {
      const optLower = opt.name.toLowerCase();
      if (optLower.startsWith(query)) {
        startsWith.push(opt);
      } else if (optLower.includes(query)) {
        contains.push(opt);
      }
    }

    visibleOptions = [...startsWith, ...contains];
  }

  // Exact match check
  const exactMatch = options.find(
    opt => opt.name.toLowerCase() === query
  );

  // Levenshtein "Did you mean" hint
  const similarOption = query.length >= 2 && !exactMatch
    ? findSimilarOption(query, options)
    : null;

  // Whether to show "Add '<text>' as new <label>"
  const canAddNew = query.length >= 2 && !exactMatch;

  // Build navigation items list for keyboard selection
  const selectableItems = [...visibleOptions];
  if (similarOption) {
    selectableItems.push({ isSimilar: true, ...similarOption });
  }
  if (canAddNew) {
    selectableItems.push({ isAdd: true, name: inputValue.trim() });
  }

  function handleSelectOption(opt) {
    onChange({ id: opt.id, name: opt.name });
    setInputValue(opt.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleSelectAdd(name) {
    onChange({ name });
    setInputValue(name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e) {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => (prev < selectableItems.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(selectableItems.length - 1);
      } else {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : selectableItems.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
        e.preventDefault();
        const selected = selectableItems[highlightedIndex];
        if (selected.isAdd) {
          handleSelectAdd(selected.name);
        } else {
          handleSelectOption(selected);
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === 'Tab') {
      if (isOpen) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
  }

  const isNew = Boolean(value && value.name && !value.id);

  return (
    <div className="form-group creatable-select-container" ref={containerRef}>
      {label && (
        <label className="form-label" htmlFor={listboxId}>
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}

      <div className="creatable-select-input-wrapper">
        <input
          id={listboxId}
          ref={inputRef}
          type="text"
          className="form-input"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`menu-${listboxId}`}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `opt-${listboxId}-${highlightedIndex}` : undefined
          }
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onChange={e => {
            const nextVal = e.target.value;
            setInputValue(nextVal);
            setIsOpen(true);
            setHighlightedIndex(-1);
            if (!nextVal) {
              onChange(null);
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {isNew && <span className="creatable-select-badge">new</span>}
      </div>

      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}

      {isOpen && !disabled && (
        <div
          id={`menu-${listboxId}`}
          className="creatable-select-menu"
          role="listbox"
        >
          {visibleOptions.length === 0 && !similarOption && !canAddNew && (
            <div className="creatable-select-option" style={{ color: 'var(--muted)', cursor: 'default' }}>
              No matching options
            </div>
          )}

          {visibleOptions.map((opt, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={opt.id}
                id={`opt-${listboxId}-${idx}`}
                role="option"
                aria-selected={value?.id === opt.id}
                className={`creatable-select-option ${isHighlighted ? 'focused' : ''}`}
                onClick={() => handleSelectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                <span>{opt.name}</span>
                <span className="text-meta tabular-nums" style={{ fontSize: '11px' }}>
                  {opt.useCount} {opt.useCount === 1 ? 'use' : 'uses'}
                </span>
              </div>
            );
          })}

          {similarOption && (
            <div
              id={`opt-${listboxId}-${visibleOptions.length}`}
              role="option"
              aria-selected={false}
              className={`creatable-select-hint-row ${
                highlightedIndex === visibleOptions.length ? 'focused' : ''
              }`}
              onClick={() => handleSelectOption(similarOption)}
              onMouseEnter={() => setHighlightedIndex(visibleOptions.length)}
            >
              Did you mean <strong>{similarOption.name}</strong>?
            </div>
          )}

          {canAddNew && (
            <div
              id={`opt-${listboxId}-${selectableItems.length - 1}`}
              role="option"
              aria-selected={false}
              className={`creatable-select-add-row ${
                highlightedIndex === selectableItems.length - 1 ? 'focused' : ''
              }`}
              onClick={() => handleSelectAdd(inputValue.trim())}
              onMouseEnter={() => setHighlightedIndex(selectableItems.length - 1)}
            >
              Add "{inputValue.trim()}" as new {label ? label.toLowerCase() : 'item'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
