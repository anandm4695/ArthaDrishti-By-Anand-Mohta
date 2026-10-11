import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from "lucide-react";

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
  compact?: boolean;
  recordLabel?: string;
  showGoToPage?: boolean;
  showRecordCount?: boolean;
  style?: React.CSSProperties;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  scrollTargetRef,
  compact = false,
  recordLabel = "records",
  showGoToPage = true,
  showRecordCount = true,
  style,
}) => {
  const [goToValue, setGoToValue] = useState("");

  // Sync input value with current page changes
  useEffect(() => {
    setGoToValue("");
  }, [currentPage]);

  if (totalPages <= 1 && (!totalRecords || totalRecords <= (pageSize || 0))) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    if (clamped === currentPage) return;

    onPageChange(clamped);

    // Smoothly scroll the target container into view with header offset to eliminate jumping / blank screen
    if (scrollTargetRef?.current) {
      const rect = scrollTargetRef.current.getBoundingClientRect();
      if (rect.top < 80 || rect.top > window.innerHeight) {
        const headerOffset = 90;
        const targetTop = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0) - headerOffset;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });
      }
    }
  };

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goToValue.trim(), 10);
    if (!isNaN(val)) {
      handlePageChange(val);
      setGoToValue("");
    }
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = compact ? 3 : 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startRecord = pageSize ? (currentPage - 1) * pageSize + 1 : undefined;
  const endRecord =
    pageSize && totalRecords
      ? Math.min(currentPage * pageSize, totalRecords)
      : pageSize
      ? currentPage * pageSize
      : undefined;

  return (
    <div
      role="navigation"
      aria-label="Pagination Navigation"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        padding: compact ? "6px 0" : "10px 0",
        ...style,
      }}
    >
      {/* Left: Record summary */}
      {showRecordCount && totalRecords !== undefined && (
        <span
          style={{
            fontSize: "12px",
            color: "var(--t-muted, #94a3b8)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {startRecord !== undefined && endRecord !== undefined ? (
            <>
              Showing <strong style={{ color: "var(--t-ink, #0f172a)" }}>{startRecord}–{endRecord}</strong> of{" "}
              <strong style={{ color: "var(--t-ink, #0f172a)" }}>{totalRecords}</strong> {recordLabel}
            </>
          ) : (
            <>
              Total <strong style={{ color: "var(--t-ink, #0f172a)" }}>{totalRecords}</strong> {recordLabel}
            </>
          )}
        </span>
      )}

      {/* Center & Right: Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          marginLeft: "auto",
        }}
      >
        {/* First Page */}
        {totalPages > 4 && (
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage <= 1}
            title="First page"
            aria-label="Go to first page"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1.5px solid var(--t-line, rgba(255,255,255,0.08))",
              background: "var(--surface-1, rgba(255,255,255,0.04))",
              color: "var(--t-ink, #0f172a)",
              opacity: currentPage <= 1 ? 0.35 : 1,
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronsLeft size={14} />
          </button>
        )}

        {/* Previous */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous page"
          aria-label="Previous page"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 11px",
            borderRadius: "8px",
            border: "1.5px solid var(--t-line, rgba(255,255,255,0.08))",
            background: "var(--surface-1, rgba(255,255,255,0.04))",
            color: "var(--t-ink, #0f172a)",
            fontSize: "12px",
            fontWeight: 700,
            opacity: currentPage <= 1 ? 0.35 : 1,
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {/* Page Pills */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    padding: "0 4px",
                    color: "var(--t-muted, #94a3b8)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageChange(Number(p))}
                aria-current={isCurrent ? "page" : undefined}
                style={{
                  minWidth: "30px",
                  height: "30px",
                  padding: "0 6px",
                  borderRadius: "8px",
                  border: isCurrent
                    ? "1.5px solid var(--t-accent, #6366f1)"
                    : "1px solid var(--t-line, rgba(255,255,255,0.08))",
                  background: isCurrent
                    ? "var(--t-accent, #6366f1)"
                    : "var(--surface-1, rgba(255,255,255,0.04))",
                  color: isCurrent ? "#ffffff" : "var(--t-ink, #0f172a)",
                  fontSize: "12px",
                  fontWeight: isCurrent ? 800 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isCurrent ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next page"
          aria-label="Next page"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 11px",
            borderRadius: "8px",
            border: "1.5px solid var(--t-line, rgba(255,255,255,0.08))",
            background: "var(--surface-1, rgba(255,255,255,0.04))",
            color: "var(--t-ink, #0f172a)",
            fontSize: "12px",
            fontWeight: 700,
            opacity: currentPage >= totalPages ? 0.35 : 1,
            cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>

        {/* Last Page */}
        {totalPages > 4 && (
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages}
            title="Last page"
            aria-label="Go to last page"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 8px",
              borderRadius: "8px",
              border: "1.5px solid var(--t-line, rgba(255,255,255,0.08))",
              background: "var(--surface-1, rgba(255,255,255,0.04))",
              color: "var(--t-ink, #0f172a)",
              opacity: currentPage >= totalPages ? 0.35 : 1,
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <ChevronsRight size={14} />
          </button>
        )}

        {/* Go to page form */}
        {showGoToPage && totalPages > 2 && (
          <form
            onSubmit={handleGoToSubmit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginLeft: 8,
              paddingLeft: 8,
              borderLeft: "1px solid var(--t-line, rgba(255,255,255,0.12))",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--t-muted, #94a3b8)",
                fontWeight: 600,
              }}
            >
              Go to:
            </span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={goToValue}
              onChange={(e) => setGoToValue(e.target.value)}
              placeholder={String(currentPage)}
              aria-label="Go to page number"
              style={{
                width: "44px",
                height: "28px",
                padding: "2px 4px",
                borderRadius: "6px",
                border: "1px solid var(--t-line, rgba(255,255,255,0.15))",
                background: "var(--surface-2, rgba(255,255,255,0.06))",
                color: "var(--t-ink, #0f172a)",
                fontSize: "11.5px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
            />
            <button
              type="submit"
              title="Jump to page"
              disabled={!goToValue}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "28px",
                padding: "0 8px",
                borderRadius: "6px",
                border: "none",
                background: goToValue
                  ? "var(--t-accent, #6366f1)"
                  : "var(--surface-1, rgba(255,255,255,0.05))",
                color: goToValue ? "#ffffff" : "var(--t-muted, #94a3b8)",
                fontSize: "11px",
                fontWeight: 800,
                cursor: goToValue ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowRight size={12} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
