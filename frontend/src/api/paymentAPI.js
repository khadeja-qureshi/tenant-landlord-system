import API from "./axios";

export const getTenantPayments = (tenantId) =>
  API.get(`/payments/tenant/${tenantId}`);

export const getLandlordPayments = (landlordId) =>
  API.get(`/payments/landlord/${landlordId}`);

export const getTenancyPayments = (tenancyId) =>
  API.get(`/payments/tenancy/${tenancyId}`);

export const setupTenancyRent = (data) =>
  API.put("/payments/setup-tenancy-rent", data);

export const generatePaymentRecord = (data) =>
  API.post("/payments/generate", data);

export const recordPayment = (data) =>
  API.post("/payments/record", data);

export const updatePaymentStatus = (paymentId, data) =>
  API.put(`/payments/${paymentId}/status`, data);

export const markLatePayments = () =>
  API.put("/payments/mark-late");