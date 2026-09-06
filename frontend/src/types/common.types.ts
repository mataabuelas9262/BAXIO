export type Role = 'USER' | 'MODERATOR' | 'ADMIN';

export type ServicePricingType = 'FIXED' | 'HOURLY' | 'STARTING_AT' | 'CUSTOM_QUOTE';

export type ServiceStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED';

export type JobRequestStatus = 'OPEN' | 'IN_SELECTION' | 'ASSIGNED' | 'CANCELLED';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type WorkOrderStatus = 'IN_PROGRESS' | 'COMPLETION_PENDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export type CredentialType = 'CERTIFICATION' | 'DIPLOMA' | 'DEGREE' | 'LICENSE' | 'COURSE';

export type CredentialStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface Credential {
  id: string;
  userId: string;
  type: CredentialType;
  title: string;
  issuer: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  evidenceUrl?: string | null;
  status: CredentialStatus;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
}

export interface Experience {
  id: string;
  userId: string;
  roleTitle: string;
  companyName?: string | null;
  isFreelance: boolean;
  startYear: number;
  endYear?: number | null;
  isCurrent: boolean;
  description?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  professionalHeadline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  serviceArea?: string | null;
  experienceYears?: number | null;
  role: Role;
  workerRatingAvg: number | string;
  workerRatingCnt: number;
  clientRatingAvg: number | string;
  clientRatingCnt: number;
  credentials?: Credential[];
  experiences?: Experience[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconName?: string | null;
  imageUrl?: string | null;
  _count?: {
    services?: number;
    jobRequests?: number;
  };
}

export interface ServiceImage {
  isIllustrative?: boolean;
  id: string;
  imageUrl: string;
  order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  pricingType: ServicePricingType;
  price?: number | string | null;
  location: string;
  serviceArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
  distanceKm?: number;
  status: ServiceStatus;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    serviceArea?: string | null;
    workerRatingAvg: number | string;
    workerRatingCnt: number;
    experienceYears?: number | null;
  };
  category: Category;
  images: ServiceImage[];
  portfolioItems?: Array<{
    id: string;
    title: string;
    description?: string | null;
    imageUrl: string;
  }>;
}

export interface JobRequest {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  location: string;
  exactAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  requiredDate?: string | null;
  status: JobRequestStatus;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    location?: string | null;
    clientRatingAvg: number | string;
    clientRatingCnt: number;
  };
  category: Category;
  images: Array<{ id: string; imageUrl: string; isIllustrative?: boolean }>;
  proposals?: Proposal[];
  workOrder?: WorkOrder | null;
  _count?: {
    proposals: number;
  };
}

export interface Proposal {
  id: string;
  jobRequestId: string;
  workerId: string;
  price: number | string;
  message: string;
  estimatedDays?: number | null;
  status: ProposalStatus;
  createdAt: string;
  worker: {
    id: string;
    fullName: string;
    professionalHeadline?: string | null;
    avatarUrl?: string | null;
    workerRatingAvg: number | string;
    workerRatingCnt: number;
    experienceYears?: number | null;
    credentials?: Credential[];
  };
  jobRequest?: JobRequest;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  workOrderId: string;
  authorId: string;
  author?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  targetUserId?: string;
  workOrder?: {
    id: string;
    jobRequest?: {
      id: string;
      title: string;
    };
  };
}

export interface WorkOrder {
  id: string;
  jobRequestId: string;
  proposalId: string;
  clientId: string;
  workerId: string;
  agreedPrice: number | string;
  status: WorkOrderStatus;
  startDate: string;
  completedDate?: string | null;
  completionRequestedAt?: string | null;
  createdAt: string;
  client?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    phone?: string | null;
    location?: string | null;
    clientRatingAvg?: number | string;
  };
  worker?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    phone?: string | null;
    location?: string | null;
    workerRatingAvg?: number | string;
  };
  jobRequest?: JobRequest;
  reviews?: Review[];
}

export interface ChatMessage {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  id: string;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
    };
  }>;
  messages: ChatMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  error?: string;
}
