import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export interface OrgRole {
  organization: { _id: string; name: string; type?: string; ref?: string };
  role: string;
}

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  contact_email?: string;
  status?: string;
  consortia?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Consortium {
  _id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  status?: string;
  organizations?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  profilePhoto?: string;
  status?: string;
  organizations?: string[];
  consortia?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface CreateRiskRequest {
  title: string;
  category: string;
  consortium: string[];
  organization: string[];
  statement: string;
  likelihood: string;
  severity: string;
  triggerIndicator: string;
  mitigationMeasures: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  status: string;
  triggerStatus: string;
  orgRoles: OrgRole[];
  code?: string;
  createdBy: string;
}

export interface CreateRiskResponse {
  message: string;
  success: boolean;
  data?: unknown;
}

export interface Risk {
  _id: string;
  title: string;
  code: string;
  status: string;
  consortium: Consortium[];
  organization?: Organization[];
  createdAt: string;
  category: string;
  statement: string;
  triggerIndicator: string;
  mitigationMeasures: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  orgRoles?: OrgRole[];
  triggerStatus?: string;
  likelihood?: string;
  severity?: string;
  createdBy?: User;
  updatedAt?: string;
  rejectionReason?: string;
  __v?: number;
  // ...add other fields as needed
}

export interface GetRisksResponse {
  message: string;
  success: boolean;
  data: Risk[];
}

export interface GetRiskResponse {
  message: string;
  success: boolean;
  data: Risk;
}

export const risksService = {
  async createRisk(riskData: CreateRiskRequest) {
    return apiClient.post<CreateRiskResponse>(
      API_ENDPOINTS.RISKS.CREATE,
      riskData
    );
  },
  async getRisks() {
    return apiClient.get<GetRisksResponse>('/risk');
  },
  async getRiskById(id: string) {
    return apiClient.get<GetRiskResponse>(`/risk/${id}`);
  },
  async updateRisk(id: string, data: Partial<Risk>) {
    return apiClient.patch<CreateRiskResponse>(`/risk/${id}`, data);
  },
  async getRisksByStatus(status: string) {
    return apiClient.get<GetRisksResponse>(`/risk/status/${status}`);
  },
  async deleteRisk(id: string) {
    return apiClient.delete<{ message: string; success: boolean }>(`/risk/${id}`);
  },
}; 