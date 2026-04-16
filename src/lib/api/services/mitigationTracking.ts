import { apiClient } from '../client';

export type MeasureType = 'Mitigation' | 'Preventive' | 'Reactive';
export type TrackingStatus = 'Not Started' | 'In Progress' | 'Applied';

export interface MitigationTracking {
  _id: string;
  risk: { _id: string; title: string; code?: string; mitigationMeasures?: string; preventiveMeasures?: string; reactiveMeasures?: string };
  organization: { _id: string; name: string };
  consortium: { _id: string; name: string };
  measureType: MeasureType;
  status: TrackingStatus;
  notes?: string;
  updatedBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface TrackingStats {
  summary: {
    total: number;
    applied: number;
    inProgress: number;
    notStarted: number;
    progressPercent: number;
  };
  byMeasureType: Array<{ _id: { measureType: string; status: string }; count: number }>;
  byOrganization: Array<{
    organizationId: string;
    organizationName: string;
    status: string;
    count: number;
  }>;
}

export interface UpsertTrackingRequest {
  riskId: string;
  organizationId: string;
  consortiumId: string;
  measureType: MeasureType;
  status: TrackingStatus;
  notes?: string;
}

export const mitigationTrackingService = {
  async upsertTracking(data: UpsertTrackingRequest) {
    return apiClient.post<{ success: boolean; message: string; data: MitigationTracking }>(
      '/mitigation-tracking/upsert',
      data
    );
  },

  async getTrackingByRisk(riskId: string) {
    return apiClient.get<{ success: boolean; message: string; data: MitigationTracking[] }>(
      `/mitigation-tracking/risk/${riskId}`
    );
  },

  async getTrackingByOrganization(organizationId: string) {
    return apiClient.get<{ success: boolean; message: string; data: MitigationTracking[] }>(
      `/mitigation-tracking/organization/${organizationId}`
    );
  },

  async getStatsByConsortium(consortiumId: string) {
    return apiClient.get<{ success: boolean; message: string; data: TrackingStats }>(
      `/mitigation-tracking/stats/consortium/${consortiumId}`
    );
  },

  async getStatsByConsortia(consortiumIds: string[]) {
    return apiClient.post<{ success: boolean; message: string; data: TrackingStats }>(
      '/mitigation-tracking/stats/consortia',
      { consortiumIds }
    );
  },
};
