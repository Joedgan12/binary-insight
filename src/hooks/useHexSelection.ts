import { useCallback, useRef } from 'react';
import { useFileStore } from '@/store/fileStore';

/**
 * Hook for managing hex byte selection state.
 * Supports click, shift+click (range), and drag selection.
 */
export function useHexSelection() {
  const selection = useFileStore((s) => s.selection);
  const setSelection = useFileStore((s) => s.setSelection);
  const hoveredOffset = useFileStore((s) => s.hoveredOffset);
  const setHoveredOffset = useFileStore((s) => s.setHoveredOffset);

  const dragStartRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const handleByteClick = useCallback(
    (offset: number, shiftKey: boolean) => {
      if (shiftKey && selection) {
        // Extend selection
        setSelection({
          start: Math.min(selection.start, offset),
          end: Math.max(selection.end, offset),
        });
      } else {
        // Single byte selection
        setSelection({ start: offset, end: offset });
      }
    },
    [selection, setSelection]
  );

  const handleByteMouseDown = useCallback(
    (offset: number, shiftKey: boolean) => {
      if (shiftKey && selection) {
        setSelection({
          start: Math.min(selection.start, offset),
          end: Math.max(selection.end, offset),
        });
      } else {
        dragStartRef.current = offset;
        isDraggingRef.current = true;
        setSelection({ start: offset, end: offset });
      }
    },
    [selection, setSelection]
  );

  const handleByteMouseEnter = useCallback(
    (offset: number) => {
      setHoveredOffset(offset);
      if (isDraggingRef.current && dragStartRef.current !== null) {
        setSelection({
          start: Math.min(dragStartRef.current, offset),
          end: Math.max(dragStartRef.current, offset),
        });
      }
    },
    [setHoveredOffset, setSelection]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredOffset(null);
  }, [setHoveredOffset]);

  const clearSelection = useCallback(() => {
    setSelection(null);
  }, [setSelection]);

  const isSelected = useCallback(
    (offset: number) => {
      if (!selection) return false;
      return offset >= selection.start && offset <= selection.end;
    },
    [selection]
  );

  const selectionLength = selection ? selection.end - selection.start + 1 : 0;

  return {
    selection,
    hoveredOffset,
    selectionLength,
    handleByteClick,
    handleByteMouseDown,
    handleByteMouseEnter,
    handleMouseUp,
    handleMouseLeave,
    clearSelection,
    isSelected,
  };
}
