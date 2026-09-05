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

// AUTH ENDPOINTS
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    return apiClient.post('/auth/login', credentials);
  },
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    location?: string;
  }): Promise<{ user: User; token: string }> => {
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
  report: async (data: { messageId?: string; reportedUserId?: string; reason: string }) => apiClient.post('/messages/reports', data),
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
