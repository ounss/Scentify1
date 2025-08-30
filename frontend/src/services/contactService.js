// services/contactService.js
import api from "./api";

export const sendContactMessage = async (formData) => {
  const response = await api.post("/contact", formData);
  return response.data;
};
