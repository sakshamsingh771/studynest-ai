import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

// A ready-made "are you sure?" dialog built on Modal — covers the common case
// (delete note, cancel subscription, remove bookmark) without re-wiring Modal
// + two buttons every time.
export default function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", description, confirmLabel = "Confirm", danger = false, loading = false }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-ink/60">{description}</p>}
    </Modal>
  );
}
