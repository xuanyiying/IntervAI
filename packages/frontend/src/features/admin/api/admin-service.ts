import axios from '@/shared/lib/axios';

// User Management Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'DISABLED';
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'DISABLED';
}

export const adminService = {
  /**
   * Get all users with pagination
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UserListResponse> => {
    const response = await axios.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getUser: async (id: string): Promise<User> => {
    const response = await axios.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Update a user
   */
  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await axios.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<void> => {
    await axios.delete(`/admin/users/${id}`);
  },

  /**
   * Enable a user
   */
  enableUser: async (id: string): Promise<User> => {
    const response = await axios.patch(`/admin/users/${id}`, {
      status: 'ACTIVE',
    });
    return response.data;
  },

  /**
   * Disable a user
   */
  disableUser: async (id: string): Promise<User> => {
    const response = await axios.patch(`/admin/users/${id}`, {
      status: 'DISABLED',
    });
    return response.data;
  },
};
