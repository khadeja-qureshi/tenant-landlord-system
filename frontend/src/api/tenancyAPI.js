import API from "./axios";

export const getUnassignedTenants  = ()           => API.get("/tenancy/unassigned-tenants");
export const getLandlordTenancies  = (landlordId) => API.get(`/tenancy/landlord/${landlordId}`);
export const getLandlordProperties = (landlordId) => API.get(`/tenancy/properties/${landlordId}`);
export const assignTenant          = (data)       => API.post("/tenancy/assign", data);
export const endTenancy            = (tenancyId)  => API.put(`/tenancy/${tenancyId}/end`);