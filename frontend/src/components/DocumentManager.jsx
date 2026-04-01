import { useState } from "react";
import {
  uploadEvidence,
  updateDocument,
  deleteDocument,
} from "../api/evidenceAPI";

const categoryOptions = [
  { value: "maintenance_evidence", label: "Maintenance Evidence" },
  { value: "dispute_evidence", label: "Dispute Evidence" },
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "house_document", label: "House Document" },
  { value: "tenant_id_document", label: "Tenant ID Document" },
  { value: "tenant_income_document", label: "Income Proof" },
  { value: "tenant_employment_document", label: "Employment Document" },
  { value: "tenant_verification", label: "Verification Document" },
  { value: "other_verification", label: "Other Verification Doc" },
  { value: "other", label: "Other" },
];

export default function DocumentManager({
  user,
  title = "Documents",
  documents = [],
  refreshDocuments,
  requestId = null,
  disputeId = null,
  tenancyId = null,
  defaultCategory = "other",
  allowUpload = true,
  allowDelete = true,
  allowEdit = true,
}) {
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState(defaultCategory);

  const handleUpload = async (file, category) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", user.id);
    formData.append("document_category", category);

    if (requestId) formData.append("request_id", requestId);
    if (disputeId) formData.append("dispute_id", disputeId);
    if (tenancyId) formData.append("tenancy_id", tenancyId);

    try {
      await uploadEvidence(formData);
      setMessage("Document uploaded successfully.");
      await refreshDocuments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Upload failed.");
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditName(doc.original_name || "");
    setEditCategory(doc.document_category || "other");
  };

  const saveEdit = async () => {
    try {
      await updateDocument(editingId, {
        original_name: editName,
        document_category: editCategory,
      });
      setEditingId(null);
      setMessage("Document updated successfully.");
      await refreshDocuments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Update failed.");
    }
  };

  const removeDoc = async (id) => {
    const yes = window.confirm("Delete this document?");
    if (!yes) return;

    try {
      await deleteDocument(id);
      setMessage("Document deleted successfully.");
      await refreshDocuments();
    } catch (err) {
      setMessage(err.response?.data?.error || "Delete failed.");
    }
  };

  return (
    <div style={S.wrapper}>
      <div style={S.headerRow}>
        <h4 style={S.heading}>{title}</h4>
      </div>

      {message && <div style={S.msg}>{message}</div>}

      {allowUpload && (
        <div style={S.uploadCard}>
          <div style={S.uploadTop}>
            <select
              id={`category-${title}`}
              defaultValue={defaultCategory}
              style={S.select}
              onChange={(e) => {
                const input = document.getElementById(`file-${title}`);
                if (input) input.dataset.category = e.target.value;
              }}
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              id={`file-${title}`}
              type="file"
              data-category={defaultCategory}
              style={S.fileInput}
              onChange={(e) => {
                const file = e.target.files?.[0];
                const category = e.target.dataset.category || defaultCategory;
                handleUpload(file, category);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div style={S.empty}>No documents available.</div>
      ) : (
        <div style={S.list}>
          {documents.map((doc) => (
            <div key={doc.id} style={S.card}>
              {editingId === doc.id ? (
                <>
                  <input
                    style={S.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Document name"
                  />
                  <select
                    style={S.select}
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div style={S.actions}>
                    <button style={S.saveBtn} onClick={saveEdit}>Save</button>
                    <button style={S.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={S.docName}>{doc.original_name}</div>
                    <div style={S.docMeta}>
                      {doc.document_category || "other"} • uploaded by {doc.uploaded_by_name}
                    </div>
                    <div style={S.docMeta}>
                      {new Date(doc.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={S.actions}>
                    <a
                      href={`http://127.0.0.1:5000${doc.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={S.openBtn}
                    >
                      Open
                    </a>

                    {allowEdit && (
                      <button style={S.editBtn} onClick={() => startEdit(doc)}>
                        Edit
                      </button>
                    )}

                    {allowDelete && (
                      <button style={S.deleteBtn} onClick={() => removeDoc(doc.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  wrapper: {
    marginTop: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 14,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heading: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
  },
  uploadCard: {
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    marginBottom: 12,
  },
  uploadTop: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    minWidth: 220,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
  },
  fileInput: {
    padding: "8px 10px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 14,
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  docName: {
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 13,
    color: "#64748b",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  openBtn: {
    textDecoration: "none",
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 10,
    fontWeight: 700,
  },
  editBtn: {
    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteBtn: {
    background: "linear-gradient(135deg, #ef4444, #f87171)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  saveBtn: {
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  cancelBtn: {
    background: "#64748b",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    maxWidth: 360,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
  },
  msg: {
    marginBottom: 12,
    padding: "12px 14px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
  },
  empty: {
    padding: 18,
    textAlign: "center",
    background: "#fff",
    borderRadius: 14,
    border: "1px dashed #cbd5e1",
    color: "#64748b",
  },
};