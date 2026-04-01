import API from "./axios";

export const getProviders = () => API.get("/providers/");
export const addProvider = (data) => API.post("/providers/", data);
export const getProvider = (providerId) => API.get(`/providers/${providerId}`);

// compatibility exports for older files
export const getAllProviders = getProviders;

export const updateProvider = async () => {
  throw new Error("updateProvider backend route is not implemented yet.");
};

export const deleteProvider = async () => {
  throw new Error("deleteProvider backend route is not implemented yet.");
};