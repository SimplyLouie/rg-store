import { api } from './client';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: { id: string; username: string } }>('/api/auth/login', {
      username,
      password,
    }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/api/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
};
