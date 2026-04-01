import API from "./axios";

export const fileDispute = (data) => API.post("/disputes/", data);

export const getUserDisputes = (userId) =>
  API.get(`/disputes/user/${userId}`);

export const getAllDisputes = () =>
  API.get("/disputes/");

export const getLandlordDisputes = (landlordId) =>
  API.get(`/disputes/landlord/${landlordId}`);

export const getMediatorDisputes = (mediatorId) =>
  API.get(`/disputes/mediator/${mediatorId}`);

export const assignMediator = (disputeId, data) =>
  API.put(`/disputes/${disputeId}/assign-mediator`, data);

export const assignMediatorToDispute = assignMediator;

export const resolveDispute = (disputeId, data) =>
  API.put(`/disputes/${disputeId}/resolve`, data);

export const closeDispute = resolveDispute;

export const getDispute = async () => {
  throw new Error("getDispute route is not implemented yet.");
};