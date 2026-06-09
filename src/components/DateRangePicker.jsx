import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { CalendarDays, ChevronRight } from "lucide-react";
import "react-day-picker/style.css";

// ── Helpers ───────────────────────────────────────────────────────────
function strToDate(str) {
  if (!str) return undefined;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToStr(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDisplay(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

// ── Component ─────────────────────────────────────────────────────────
export default function DateRangePicker({ start, end, onApply }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from: strToDate(start), to: strToDate(end) });
  const ref = useRef(null);

  // Keep internal range in sync if parent resets dates
  useEffect(() => {
    setRange({ from: strToDate(start), to: strToDate(end) });
  }, [start, end]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onMouse(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleApply() {
    if (range?.from && range?.to) {
      onApply(dateToStr(range.from), dateToStr(range.to));
    }
    setOpen(false);
  }

  const today = new Date();
  const hasRange = range?.from && range?.to;
  const hint = hasRange
    ? `${fmtDisplay(dateToStr(range.from))} → ${fmtDisplay(dateToStr(range.to))}`
    : range?.from
    ? "Select an end date"
    : "Select a start date";

  return (
    <div className="rdp-wrap" ref={ref}>
      {/* ── Trigger button ── */}
      <button
        className={`rdp-trigger${open ? " rdp-trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <CalendarDays size={13} className="rdp-trigger__icon" />
        <span className="rdp-trigger__seg">
          <span className="rdp-trigger__lbl">From</span>
          <span className="rdp-trigger__val">{fmtDisplay(start)}</span>
        </span>
        <span className="rdp-trigger__arrow">–</span>
        <span className="rdp-trigger__seg">
          <span className="rdp-trigger__lbl">To</span>
          <span className="rdp-trigger__val">{fmtDisplay(end)}</span>
        </span>
      </button>

      {/* ── Dropdown calendar panel ── */}
      {open && (
        <div className="rdp-panel">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            disabled={{ after: today }}
            defaultMonth={strToDate(start) ?? today}
            showOutsideDays
          />
          <div className="rdp-panel__footer">
            <span className="rdp-panel__hint">{hint}</span>
            <button
              className="rdp-apply-btn"
              disabled={!hasRange}
              onClick={handleApply}
              type="button"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
