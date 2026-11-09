import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from './admin-service';
import axios from '@/shared/lib/axios';

vi.mock('@/shared/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should list users with pagination and filters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      (axios.get as any).mockResolvedValueOnce({ data: mockResponse });

      const result = await adminService.getUsers({
        page: 1,
        limit: 10,
        role: 'USER',
      });

      expect(axios.get).toHaveBeenCalledWith('/admin/users', {
        params: { page: 1, limit: 10, role: 'USER' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUser', () => {
    it('should fetch a single user', async () => {
      const mockUser = { id: 'u1', username: 'alice' };
      (axios.get as any).mockResolvedValueOnce({ data: mockUser });

      const result = await adminService.getUser('u1');
      expect(result).toEqual(mockUser);
      expect(axios.get).toHaveBeenCalledWith('/admin/users/u1');
    });
  });

  describe('updateUser', () => {
    it('should patch user fields', async () => {
      const mockUpdated = { id: 'u1', status: 'DISABLED' };
      (axios.patch as any).mockResolvedValueOnce({ data: mockUpdated });

      const result = await adminService.updateUser('u1', {
        status: 'DISABLED',
      });
      expect(result).toEqual(mockUpdated);
      expect(axios.patch).toHaveBeenCalledWith('/admin/users/u1', {
        status: 'DISABLED',
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      (axios.delete as any).mockResolvedValueOnce({});
      await adminService.deleteUser('u1');
      expect(axios.delete).toHaveBeenCalledWith('/admin/users/u1');
    });
  });

  describe('enableUser / disableUser', () => {
    it('should set user status', async () => {
      (axios.patch as any).mockResolvedValueOnce({});
      await adminService.enableUser('u1');
      expect(axios.patch).toHaveBeenCalledWith('/admin/users/u1', {
        status: 'ACTIVE',
      });

      (axios.patch as any).mockResolvedValueOnce({});
      await adminService.disableUser('u1');
      expect(axios.patch).toHaveBeenCalledWith('/admin/users/u1', {
        status: 'DISABLED',
      });
    });
  });
});
