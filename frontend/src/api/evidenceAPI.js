import API from "./axios";

export const uploadEvidence = (formData) =>
  API.post("/evidence/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getRequestEvidence = (requestId) =>
  API.get(`/evidence/request/${requestId}`);

export const getDisputeEvidence = (disputeId) =>
  API.get(`/evidence/dispute/${disputeId}`);

export const getTenancyEvidence = (tenancyId) =>
  API.get(`/evidence/tenancy/${tenancyId}`);

export const getTenantVerificationDocs = (tenantId) =>
  API.get(`/evidence/tenant-verification/${tenantId}`);

export const updateDocument = (documentId, data) =>
  API.put(`/evidence/${documentId}`, data);

export const deleteDocument = (documentId) =>
  API.delete(`/evidence/${documentId}`);