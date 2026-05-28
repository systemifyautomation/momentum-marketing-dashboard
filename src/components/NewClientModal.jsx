import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const WEBHOOK_URL = import.meta.env.VITE_NEW_CLIENT_WEBHOOK_URL ?? "";

export default function NewClientModal({ onClose }) {
  const [clientName, setClientName] = useState("");
  const [apiKey, setApiKey]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState(null);
  const nameRef = useRef(null);

  // Focus first field and trap Escape key
  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: clientName, api_key: apiKey }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal__header">
          <h2 id="modal-title">New Client</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {success ? (
          <div className="modal__success">
            <div className="modal__success-icon">✓</div>
            <p>Client added successfully!</p>
            <button className="modal__btn modal__btn--primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handleSubmit}>
            <div className="modal__field">
              <label htmlFor="nc-name">Client Name <span aria-hidden="true">*</span></label>
              <input
                ref={nameRef}
                id="nc-name"
                type="text"
                placeholder="e.g. Acme Store"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="modal__field">
              <label htmlFor="nc-apikey">API Key <span aria-hidden="true">*</span></label>
              <input
                id="nc-apikey"
                type="password"
                placeholder="Klaviyo private API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                disabled={submitting}
                autoComplete="off"
              />
            </div>

            {error && <p className="modal__error">{error}</p>}

            <div className="modal__footer">
              <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="modal__btn modal__btn--primary" disabled={submitting}>
                {submitting ? <span className="modal__spinner" /> : "Add Client"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
