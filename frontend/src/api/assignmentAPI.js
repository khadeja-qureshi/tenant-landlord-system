import API from "./axios";

export const getRequestAssignments = (requestId) =>
  API.get(`/assignments/request/${requestId}`);

export const assignProviderToRequest = (data) =>
  API.post("/assignments/", data);

export const updateAssignmentStatus = (assignmentId, data) =>
  API.put(`/assignments/${assignmentId}/status`, data);