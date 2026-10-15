import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Minimal accessible modal: traps Escape-to-close, locks background scroll,
// focuses the dialog on open, and restores focus to the trigger on close.
// Used for confirmation dialogs (delete note, cancel subscription, etc.)
// instead of native window.confirm, which can't be styled or made accessible.
export default function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className="relative bg-white dark:bg-[#151E30] rounded-card shadow-popover border border-ink/10 w-full max-w-md p-6 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="font-semibold text-ink text-lg">{title}</h2>}
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink/70 -mt-1 -mr-1">
            <X size={20} />
          </button>
        </div>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
