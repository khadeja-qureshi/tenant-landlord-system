import API from "./axios";

export const getNotifications = (userId) =>
  API.get(`/notifications/${userId}`);

export const markNotificationRead = (notificationId) =>
  API.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = (userId) =>
  API.put(`/notifications/user/${userId}/read-all`);