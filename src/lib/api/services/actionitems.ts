import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

// Types for creating an action item
export interface CreateActionItemRequest {
  title: string;
  status: string;
  assignTo: string;
  assignToModel: string;
  relatedRisk?: string;
  relatedRisks?: string[]; // Multiple related risks (up to 3)
  consortium: string;
  description: string;
  implementationDate: string;
  createdBy?: string;
  assignToUser?: string;
  assignToUserModel?: string;
  organization?: string;
}

export interface CreateActionItemResponse {
  message: string;
  success: boolean;
  data?: unknown;
}

// Comment and Reply Types
export interface Comment {
  _id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  replies?: Reply[];
}

export interface Reply {
  _id: string;
  userId: string;
  userName: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  userId: string;
  userName: string;
  comment: string;
}

export interface CreateReplyRequest {
  userId: string;
  userName: string;
  reply: string;
}

export interface UpdateCommentRequest {
  comment: string;
}

export interface UpdateReplyRequest {
  reply: string;
}

export interface CommentsResponse {
  message: string;
  success: boolean;
  data?: Comment[] | { data: Comment[] };
}

export interface CommentResponse {
  message: string;
  success: boolean;
  data?: Comment;
}

export interface ReplyResponse {
  message: string;
  success: boolean;
  data?: Reply;
}

export interface ActionItem {
  _id: string;
  title: string;
  status: string;
  assignTo: string | { _id: string; name: string };
  assignToModel: string;
  relatedRisk?: string | { _id: string; name: string };
  consortium: string | { _id: string; name: string } | Array<string | { _id: string; name: string }>;
  description: string;
  implementationDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | { _id: string; name: string };
  assignToUser?: string | { _id: string; name: string };
  assignToUserModel?: string;
  organization?: Array<string | { _id: string; name: string }>;
  organizationUser?: Array<string | { _id: string; name: string }>;
}

export interface GetActionItemsResponse {
  message: string;
  success: boolean;
  data: ActionItem[];
}

export interface UpdateActionItemRequest {
  title?: string;
  status?: string;
  assignTo?: string;
  assignToModel?: string;
  assignToUser?: string;
  assignToUserModel?: string;
  relatedRisk?: string;
  consortium?: string;
  description?: string;
  implementationDate?: string;
  organization?: string;
}

export interface UpdateActionItemResponse {
  message: string;
  success: boolean;
  data?: ActionItem;
}

export const actionItemsService = {
  async createActionItem(actionItemData: CreateActionItemRequest) {
    return apiClient.post<CreateActionItemResponse>(
      API_ENDPOINTS.ACTIONITEMS.CREATE,
      actionItemData
    );
  },
  async getActionItems() {
    return apiClient.get<GetActionItemsResponse>('/actionitem');
  },
  async updateActionItem(id: string, data: UpdateActionItemRequest) {
    return apiClient.patch<UpdateActionItemResponse>(`/actionitem/${id}`, data);
  },
  async deleteActionItem(id: string) {
    return apiClient.delete<{ message: string; success: boolean }>(`/actionitem/${id}`);
  },
  
  // Comment methods
  async getComments(actionItemId: string) {
    return apiClient.get<CommentsResponse>(`/actionitem/${actionItemId}/comments`);
  },
  async createComment(actionItemId: string, commentData: CreateCommentRequest) {
    return apiClient.post<CommentResponse>(`/actionitem/${actionItemId}/comments`, commentData);
  },
  async updateComment(actionItemId: string, commentId: string, commentData: UpdateCommentRequest) {
    return apiClient.patch<CommentResponse>(`/actionitem/${actionItemId}/comments/${commentId}`, commentData);
  },
  async deleteComment(actionItemId: string, commentId: string) {
    return apiClient.delete<{ message: string; success: boolean }>(`/actionitem/${actionItemId}/comments/${commentId}`);
  },
  
  // Reply methods
  async createReply(actionItemId: string, commentIndex: number, replyData: CreateReplyRequest) {
    return apiClient.post<ReplyResponse>(`/actionitem/${actionItemId}/comments/${commentIndex}/replies`, replyData);
  },
  async updateReply(actionItemId: string, commentIndex: number, replyIndex: number, replyData: UpdateReplyRequest) {
    return apiClient.patch<ReplyResponse>(`/actionitem/${actionItemId}/comments/${commentIndex}/replies/${replyIndex}`, replyData);
  },
  async deleteReply(actionItemId: string, commentIndex: number, replyIndex: number) {
    return apiClient.delete<{ message: string; success: boolean }>(`/actionitem/${actionItemId}/comments/${commentIndex}/replies/${replyIndex}`);
  },
}; 