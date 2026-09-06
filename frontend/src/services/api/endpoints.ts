import { apiClient } from './client';
import {
  User,
  Category,
  Service,
  JobRequest,
  Proposal,
  WorkOrder,
  Conversation,
  ChatMessage,
  Credential,
  Experience,
  Review,
} from '@/types/common.types';

export interface AuthStep { step: 'email' | 'two-factor'; challengeToken: string; maskedEmail: string; expiresIn: number; resendAfter: number; delivery?: 'preview' | 'email'; }
export type AuthResult = { user: User; token: string } | AuthStep;
// AUTH ENDPOINTS
export const authApi = {
  requestPhone: async (phone: string, password: string, secondFactor: string): Promise<{ challengeToken: string }> => apiClient.post('/auth/phone/request', { phone, password, secondFactor }),
  verifyPhone: async (challengeToken: string, code: string): Promise<{ message: string }> => apiClient.post('/auth/phone/verify', { challengeToken, code }),
  passwordOptions: async (): Promise<{ smsAvailable: boolean }> => apiClient.get('/auth/password/options'),
  requestPassword: async (email: string, channel: 'email' | 'sms'): Promise<{ challengeToken: string; resendAfter: number; message: string }> => apiClient.post('/auth/password/request', { email, channel }),
  verifyPassword: async (challengeToken: string, code: string): Promise<{ resetToken: string; requiresTwoFactor: boolean }> => apiClient.post('/auth/password/verify', { challengeToken, code }),
  resetPassword: async (resetToken: string, newPassword: string, secondFactor: string): Promise<{ message: string }> => apiClient.post('/auth/password/reset', { resetToken, newPassword, secondFactor }),
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => apiClient.post('/auth/password/change', { currentPassword, newPassword }),

  verify: async (challengeToken: string, code: string): Promise<AuthResult> => apiClient.post('/auth/verify', { challengeToken, code }),
  resend: async (challengeToken: string): Promise<AuthStep> => apiClient.post('/auth/resend', { challengeToken }),
  security: async (): Promise<{ emailVerified: boolean; verifiedPhone: string | null; twoFactorEnabled: boolean; recoveryCodesRemaining: number }> => apiClient.get('/auth/security'),
  verifyEmail: async (): Promise<AuthStep> => apiClient.post('/auth/email-verification'),
  setup2fa: async (password: string): Promise<{ secret: string; qrCode: string; expiresIn: number }> => apiClient.post('/auth/2fa/setup', { password }),
  confirm2fa: async (password: string, code: string): Promise<{ recoveryCodes: string[] }> => apiClient.post('/auth/2fa/confirm', { password, code }),
  disable2fa: async (password: string, code: string): Promise<{ message: string }> => apiClient.post('/auth/2fa/disable', { password, code }),
  login: async (credentials: { email: string; password: string }): Promise<AuthResult> => {
    return apiClient.post('/auth/login', credentials);
  },
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    location?: string;
  }): Promise<AuthResult> => {
    return apiClient.post('/auth/register', data);
  },
  logout: async (): Promise<{ message: string }> => {
    return apiClient.post('/auth/logout');
  },
  getMe: async (): Promise<User> => {
    return apiClient.get('/auth/me');
  },
};

// CATEGORIES ENDPOINTS
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    return apiClient.get('/categories');
  },
  getBySlug: async (slug: string): Promise<Category> => {
    return apiClient.get(`/categories/${slug}`);
  },
};

// SERVICES ENDPOINTS
export const servicesApi = {
  getAll: async (params?: {
    query?: string;
    categorySlug?: string;
    location?: string;
    sortBy?: string;
    userLat?: number;
    userLng?: number;
    maxRadiusKm?: number;
  }): Promise<Service[]> => {
    return apiClient.get('/services', { params });
  },
  getById: async (id: string): Promise<Service> => {
    return apiClient.get(`/services/${id}`);
  },
  create: async (data: {
    title: string;
    description: string;
    categoryId: string;
    pricingType: string;
    price?: number;
    location: string;
    serviceArea?: string;
    latitude?: number;
    longitude?: number;
    serviceRadiusKm?: number;
    imageUrls?: string[];
    images?: Array<{ imageUrl: string; isIllustrative?: boolean }>;
  }): Promise<Service> => {
    return apiClient.post('/services', data);
  },
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    pricingType: string;
    price: number;
    location: string;
    serviceArea: string;
    imageUrls: string[];
    images: Array<{ imageUrl: string; isIllustrative?: boolean }>;
  }>): Promise<Service> => apiClient.patch(`/services/${id}`, data),
  delete: async (id: string): Promise<{ message: string }> => apiClient.delete(`/services/${id}`),
};

// JOB REQUESTS ENDPOINTS
export const jobRequestsApi = {
  getAll: async (params?: {
    query?: string;
    categorySlug?: string;
    location?: string;
    userLat?: number;
    userLng?: number;
    maxRadiusKm?: number;
  }): Promise<JobRequest[]> => {
    return apiClient.get('/job-requests', { params });
  },
  getById: async (id: string): Promise<JobRequest> => {
    return apiClient.get(`/job-requests/${id}`);
  },
  getForEditing: async (id: string): Promise<JobRequest> => {
    return apiClient.get(`/job-requests/mine/${id}`);
  },
  create: async (data: {
    title: string;
    description: string;
    categoryId: string;
    location: string;
    exactAddress?: string;
    latitude?: number;
    longitude?: number;
    budgetMin?: number;
    budgetMax?: number;
    requiredDate?: string;
    imageUrls?: string[];
    images?: Array<{ imageUrl: string; isIllustrative?: boolean }>;
  }): Promise<JobRequest> => {
    return apiClient.post('/job-requests', data);
  },
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    location: string;
    exactAddress: string;
    latitude: number;
    longitude: number;
    budgetMin: number;
    budgetMax: number;
    requiredDate: string;
    imageUrls: string[];
    images: Array<{ imageUrl: string; isIllustrative?: boolean }>;
  }>): Promise<JobRequest> => apiClient.patch(`/job-requests/${id}`, data),
  delete: async (id: string): Promise<{ message: string }> => apiClient.delete(`/job-requests/${id}`),
};

// PROPOSALS ENDPOINTS
export const proposalsApi = {
  create: async (data: {
    jobRequestId: string;
    price: number;
    message: string;
    estimatedDays?: number;
  }): Promise<Proposal> => {
    return apiClient.post('/proposals', data);
  },
  getMyProposals: async (): Promise<Proposal[]> => {
    return apiClient.get('/proposals/my-proposals');
  },
  acceptProposal: async (proposalId: string): Promise<{ proposal: Proposal; workOrder: WorkOrder }> => {
    return apiClient.patch(`/proposals/${proposalId}/accept`);
  },
};

// WORK ORDERS ENDPOINTS
export const workOrdersApi = {
  getMyOrders: async (): Promise<WorkOrder[]> => {
    return apiClient.get('/work-orders/my-orders');
  },
  getById: async (id: string): Promise<WorkOrder> => {
    return apiClient.get(`/work-orders/${id}`);
  },
  updateStatus: async (id: string, status: string): Promise<WorkOrder> => {
    return apiClient.patch(`/work-orders/${id}/status`, { status });
  },
};

// MENSAJERÍA PROTEGIDA: disponible únicamente desde una orden de trabajo compartida.
export const messagesApi = {
  getByWorkOrder: async (workOrderId: string): Promise<Conversation> => {
    return apiClient.get(`/messages/work-orders/${workOrderId}`);
  },
  send: async (workOrderId: string, content: string): Promise<ChatMessage> => {
    return apiClient.post(`/messages/work-orders/${workOrderId}`, { content });
  },
  update: async (messageId: string, content: string): Promise<ChatMessage> => apiClient.patch(`/messages/${messageId}`, { content }),
  delete: async (messageId: string): Promise<{ message: string }> => apiClient.delete(`/messages/${messageId}`),
  report: async (data: { messageId?: string; reportedUserId?: string; reason: string; details?: string }) => apiClient.post('/messages/reports', data),
  block: async (userId: string): Promise<{ message: string }> => apiClient.post(`/messages/blocks/${userId}`),
  unblock: async (userId: string): Promise<{ message: string }> => apiClient.delete(`/messages/blocks/${userId}`),
};

// USERS / WORKERS ENDPOINTS
export const usersApi = {
  getWorkers: async (params?: { query?: string; location?: string }): Promise<User[]> => {
    return apiClient.get('/users/workers', { params });
  },
  getProfile: async (id: string): Promise<User> => {
    return apiClient.get(`/users/${id}`);
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiClient.patch('/users/profile', data);
  },
};

// CREDENTIALS / CERTIFICATIONS ENDPOINTS
export const credentialsApi = {
  create: async (data: {
    type: string;
    title: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    evidenceUrl?: string;
  }): Promise<Credential> => {
    return apiClient.post('/credentials', data);
  },
  getMyCredentials: async (): Promise<Credential[]> => {
    return apiClient.get('/credentials/my');
  },
  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/credentials/${id}`);
  },
};

// UPLOADS ENDPOINTS
export const uploadsApi = {
  uploadImage: async (file: File): Promise<{ url: string; width: number; height: number }> => {
    const data = new FormData(); data.append('file', file);
    return apiClient.post('/uploads/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadEvidence: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/uploads/evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAvatar: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// EXPERIENCES ENDPOINTS
export const experiencesApi = {
  create: async (data: {
    roleTitle: string;
    companyName?: string;
    isFreelance?: boolean;
    startYear: number;
    endYear?: number;
    isCurrent?: boolean;
    description?: string;
  }): Promise<Experience> => {
    return apiClient.post('/experiences', data);
  },
  getMyExperiences: async (): Promise<Experience[]> => {
    return apiClient.get('/experiences/my');
  },
  update: async (
    id: string,
    data: {
      roleTitle?: string;
      companyName?: string;
      isFreelance?: boolean;
      startYear?: number;
      endYear?: number;
      isCurrent?: boolean;
      description?: string;
    },
  ): Promise<Experience> => {
    return apiClient.patch(`/experiences/${id}`, data);
  },
  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/experiences/${id}`);
  },
};

// REVIEWS & RATINGS ENDPOINTS
export const reviewsApi = {
  create: async (data: {
    workOrderId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> => {
    return apiClient.post('/reviews', data);
  },
  getByUser: async (userId: string): Promise<Review[]> => {
    return apiClient.get(`/reviews/user/${userId}`);
  },
  getByWorkOrder: async (workOrderId: string): Promise<Review[]> => {
    return apiClient.get(`/reviews/work-order/${workOrderId}`);
  },
};
