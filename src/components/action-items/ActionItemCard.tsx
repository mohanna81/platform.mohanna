import React from 'react';
import { actionItemsService, Comment, Reply, CreateCommentRequest, CreateReplyRequest, UpdateCommentRequest, UpdateReplyRequest } from '@/lib/api/services/actionitems';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';

interface ActionItemCardProps {
  title: string;
  status: 'In Progress' | 'At Risk' | 'Complete';
  id: string;
  assignedTo: string;
  relatedRisk: string;
  consortium: string;
  description: string;
  implementationDate: string;
  actionItemId: string; // Add this prop for API calls
  daysRemaining?: number; // Add this prop to show urgency
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusStyles: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'At Risk': 'bg-orange-100 text-orange-700',
  'Complete': 'bg-green-100 text-green-700',
};

const ActionItemCard: React.FC<ActionItemCardProps> = ({
  title,
  status,
  id,
  assignedTo,
  relatedRisk,
  consortium,
  description,
  implementationDate,
  actionItemId,
  daysRemaining,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [editingComment, setEditingComment] = React.useState<string | null>(null);
  const [editingReply, setEditingReply] = React.useState<{ commentIndex: number; replyIndex: number } | null>(null);
  const [editCommentText, setEditCommentText] = React.useState('');
  const [editReplyText, setEditReplyText] = React.useState('');
  const [apiAvailable, setApiAvailable] = React.useState(true);
  const [showComments, setShowComments] = React.useState(false);
  const [commentsLoaded, setCommentsLoaded] = React.useState(false);

  const fetchComments = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await actionItemsService.getComments(actionItemId);
      console.log('Comments API response:', response);
      
      if (response.success && response.data) {
        let commentsData: Comment[] = [];
        
        if (Array.isArray(response.data)) {
          commentsData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null && 'data' in response.data) {
          const nestedData = (response.data as { data: Comment[] }).data;
          commentsData = Array.isArray(nestedData) ? nestedData : [];
        }
        
        console.log('Processed comments data:', commentsData);
        setComments(commentsData);
        setCommentsLoaded(true);
      } else {
        setComments([]);
        setCommentsLoaded(true);
      }
    } catch (error: unknown) {
      console.error('Error fetching comments:', error);
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        console.log('Comments API endpoint not found - using empty comments array');
        setComments([]);
        setApiAvailable(false);
        setCommentsLoaded(true);
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('404')) {
        console.log('Comments API endpoint not found - using empty comments array');
        setComments([]);
        setApiAvailable(false);
        setCommentsLoaded(true);
      } else {
        showToast.error('Failed to load comments');
        setComments([]);
        setCommentsLoaded(true);
      }
    }
    setLoading(false);
  }, [actionItemId]);

  // Only fetch comments when the comments section is expanded
  React.useEffect(() => {
    if (showComments && !commentsLoaded) {
      fetchComments();
    }
  }, [showComments, commentsLoaded, fetchComments]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user) return;

    try {
      const commentData: CreateCommentRequest = {
        userId: user.id || '',
        userName: user.name || 'Unknown User',
        comment: commentText.trim(),
      };

      const response = await actionItemsService.createComment(actionItemId, commentData);
      if (response.success) {
        setCommentText('');
        showToast.success('Comment added successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to add comment');
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
      
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        showToast.error('Comment feature not available yet');
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('404')) {
        showToast.error('Comment feature not available yet');
      } else {
        showToast.error('Failed to add comment');
      }
    }
  };

  const handleAddReply = async (commentIndex: number) => {
    if (!replyText.trim() || !user) return;

    try {
      const replyData: CreateReplyRequest = {
        userId: user.id || '',
        userName: user.name || 'Unknown User',
        reply: replyText.trim(),
      };

      const response = await actionItemsService.createReply(actionItemId, commentIndex, replyData);
      if (response.success) {
        setReplyText('');
        setReplyingTo(null);
        showToast.success('Reply added successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      showToast.error('Failed to add reply');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    try {
      const updateData: UpdateCommentRequest = {
        comment: editCommentText.trim(),
      };

      const response = await actionItemsService.updateComment(actionItemId, commentId, updateData);
      if (response.success) {
        setEditCommentText('');
        setEditingComment(null);
        showToast.success('Comment updated successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast.error('Failed to update comment');
    }
  };

  const handleEditReply = async (commentIndex: number, replyIndex: number) => {
    if (!editReplyText.trim()) return;

    try {
      const updateData: UpdateReplyRequest = {
        reply: editReplyText.trim(),
      };

      const response = await actionItemsService.updateReply(actionItemId, commentIndex, replyIndex, updateData);
      if (response.success) {
        setEditReplyText('');
        setEditingReply(null);
        showToast.success('Reply updated successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to update reply');
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      showToast.error('Failed to update reply');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await actionItemsService.deleteComment(actionItemId, commentId);
      if (response.success) {
        showToast.success('Comment deleted successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast.error('Failed to delete comment');
    }
  };

  const handleDeleteReply = async (commentIndex: number, replyIndex: number) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      const response = await actionItemsService.deleteReply(actionItemId, commentIndex, replyIndex);
      if (response.success) {
        showToast.success('Reply deleted successfully');
        // Refresh comments from server
        await fetchComments();
      } else {
        showToast.error(response.message || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      showToast.error('Failed to delete reply');
    }
  };

  const canEditComment = (comment: Comment) => {
    return user && (comment.userId === user.id);
  };

  const canEditReply = (reply: Reply) => {
    return user && (reply.userId === user.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white border border-[#e5eaf1] rounded-xl p-4 sm:p-6 md:p-8 mt-4 relative shadow-sm overflow-x-auto ${status === 'At Risk' ? 'border-orange-400' : status === 'Complete' ? 'border-green-400' : status === 'In Progress' ? 'border-blue-400' : ''}`}>
      <div className="flex items-center gap-3 flex-wrap mb-2 justify-between">
        <div className="text-xl sm:text-2xl font-bold text-[#0b1320] flex items-center gap-2">
          {title}
          {status === 'At Risk' && <span className="text-orange-500 text-lg">&#9888;</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-4 py-1 rounded-full font-medium text-sm sm:text-base flex items-center ${statusStyles[status]}`}>{status}</span>
          {status === 'At Risk' && daysRemaining !== undefined && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
            </span>
          )}
        </div>
      </div>
      <div className="text-[#7b849b] mb-2 text-sm sm:text-base">
        ID: <span className="font-medium">{id}</span> &bull; Assigned to: <span className="font-medium">{assignedTo}</span>
        {relatedRisk && (<>&bull; Related to risk: <span className="font-medium">{relatedRisk}</span></>)}
        &bull; Consortium: <span className="font-medium">{consortium}</span>
      </div>
      <div className="mb-2 text-sm sm:text-base text-[#222b3a]">{description}</div>

             {/* Comments Section */}
       <div className="mt-6 border-t border-gray-200 pt-4">
         <div className="flex items-center justify-between mb-4">
           <div className="font-semibold text-gray-800 text-lg flex items-center gap-2">
             Comments
             {comments.length > 0 && (
               <span className="text-sm font-normal text-gray-500">({comments.length})</span>
             )}
           </div>
           <button
             onClick={() => setShowComments(!showComments)}
             className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
           >
             {showComments ? (
               <>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                 </svg>
                 Hide Comments
               </>
             ) : (
               <>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
                 Show Comments
               </>
             )}
           </button>
         </div>

         {showComments && (
           <>
             {loading ? (
               <div className="text-gray-500 text-sm mb-4 flex items-center">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                 Loading comments...
               </div>
             ) : !Array.isArray(comments) || comments.length === 0 ? (
               <div className="text-gray-500 text-sm mb-4 italic">No comments yet. Be the first to add a comment!</div>
             ) : (
           comments.map((comment, commentIndex) => (
            <div key={`${comment._id}-${commentIndex}`} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-semibold text-sm">{(comment.userName || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{comment.userName || 'Unknown User'}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              
                             {editingComment === comment._id ? (
                 <div className="mb-3">
                   <textarea
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                     rows={3}
                     value={editCommentText}
                     onChange={(e) => setEditCommentText(e.target.value)}
                     placeholder="Edit your comment..."
                   />
                   <div className="flex gap-2 mt-2">
                     <button 
                       className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                       onClick={() => handleEditComment(comment._id)}
                     >
                       Save
                     </button>
                     <button 
                       className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                       onClick={() => {
                         setEditingComment(null);
                         setEditCommentText('');
                       }}
                     >
                       Cancel
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="mb-3 text-gray-700 text-sm leading-relaxed">{comment.comment}</div>
               )}

                             {/* Comment Actions */}
               <div className="flex gap-3 mb-3">
                 <button 
                   className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors"
                   onClick={() => setReplyingTo(commentIndex)}
                 >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                   </svg>
                   Reply
                 </button>
                {canEditComment(comment) && (
                  <React.Fragment key={`actions-${comment._id}`}>
                    <button 
                      className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center transition-colors"
                      onClick={() => {
                        setEditingComment(comment._id);
                        setEditCommentText(comment.comment);
                      }}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center transition-colors"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </React.Fragment>
                )}
               </div>

                             {/* Reply Input */}
               {replyingTo === commentIndex && (
                 <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                   <div className="flex gap-2">
                     <input
                       type="text"
                       className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                       placeholder="Write a reply..."
                       value={replyText}
                       onChange={(e) => setReplyText(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleAddReply(commentIndex);
                         }
                       }}
                     />
                     <button 
                       className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                       onClick={() => handleAddReply(commentIndex)}
                     >
                       Send
                     </button>
                     <button 
                       className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                       onClick={() => {
                         setReplyingTo(null);
                         setReplyText('');
                       }}
                     >
                       Cancel
                     </button>
                   </div>
                 </div>
               )}

              {/* Replies */}
              {comment.replies && Array.isArray(comment.replies) && comment.replies.map((reply, replyIndex) => (
                <div key={`${comment._id}-reply-${reply._id}-${replyIndex}`} className="ml-6 mt-3 border-l-2 border-blue-200 pl-4 py-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-700 font-semibold text-xs">{(reply.userName || 'U').charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{reply.userName || 'Unknown User'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                  </div>
                  
                  {editingReply?.commentIndex === commentIndex && editingReply?.replyIndex === replyIndex ? (
                    <div className="mb-2">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-900"
                        rows={2}
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        placeholder="Edit your reply..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          onClick={() => handleEditReply(commentIndex, replyIndex)}
                        >
                          Save
                        </button>
                        <button 
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          onClick={() => {
                            setEditingReply(null);
                            setEditReplyText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 text-sm leading-relaxed">{reply.reply}</div>
                  )}

                  {/* Reply Actions */}
                  {canEditReply(reply) && (
                    <div className="flex gap-3 mt-2">
                      <button 
                        className="text-gray-600 hover:text-gray-700 text-xs font-medium flex items-center transition-colors"
                        onClick={() => {
                          setEditingReply({ commentIndex, replyIndex });
                          setEditReplyText(reply.reply);
                        }}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-700 text-xs font-medium flex items-center transition-colors"
                        onClick={() => handleDeleteReply(commentIndex, replyIndex)}
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}

                 {/* Add new comment */}
         {!apiAvailable ? (
           <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
             <div className="flex items-center">
               <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
               <p className="text-sm text-yellow-800 font-medium">
                 Comment feature is not available yet. The backend API endpoints need to be implemented.
               </p>
             </div>
           </div>
         ) : (
           <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                 <span className="text-blue-600 font-semibold text-sm">
                   {user?.name?.charAt(0).toUpperCase() || 'U'}
                 </span>
               </div>
               <div className="flex-1">
                 <input
                   type="text"
                   className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                   placeholder="Add a comment..."
                   value={commentText}
                   onChange={(e) => setCommentText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleAddComment();
                     }
                   }}
                 />
               </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddComment}
                disabled={!commentText.trim() || !user?.name}
              >
                Comment
              </button>
             </div>
           </div>
         )}
           </>
         )}
      </div>

      <div className="flex items-center gap-2 text-[#7b849b] mb-4 text-sm sm:text-base flex-wrap">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        Implementation date: {implementationDate}
      </div>
      <div className="flex justify-end mt-4 gap-2">
        {onEdit && (
          <button className="bg-white border border-[#e5eaf1] text-[#0b1320] font-medium px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-none hover:bg-[#f5f7fa] focus:ring-0 text-sm sm:text-base w-full max-w-xs sm:max-w-none sm:w-auto cursor-pointer" onClick={onEdit}>
            Edit Action
          </button>
        )}
        {onDelete && (
          <button className="bg-red-50 border border-red-200 text-red-700 font-medium px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-none hover:bg-red-100 focus:ring-0 text-sm sm:text-base w-full max-w-xs sm:max-w-none sm:w-auto cursor-pointer" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

// OPTIMIZATION: Memoize the component to prevent unnecessary re-renders
export default React.memo(ActionItemCard); 