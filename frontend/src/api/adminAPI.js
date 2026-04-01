import API from "./axios";

export const registerUser = (data) => API.post("/auth/register", data);
export const getUsersByRole = (role) => API.get(`/auth/users/role/${role}`);

export const getAllProperties = () => API.get("/properties/");
export const createProperty = (data) => API.post("/properties/", data);

export const getUnassignedTenants = () => API.get("/tenancy/unassigned-tenants");
export const assignTenant = (data) => API.post("/tenancy/assign", data);

export const getAllProviders = () => API.get("/providers/");
export const addProvider = (data) => API.post("/providers/", data);