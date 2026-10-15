import api from "./api";

export const loginUser = async (email, password) => {
  const response = await api.post("/api/auth/login", {
    email: email,
    password: password,
  });

  const data = response.data;

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("user_name", data.name);

  return data;
};