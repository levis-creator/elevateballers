import { useState } from 'react';
import type { CommentWithAuthor } from '../../cms/types';
import { CheckCircle, XCircle, Trash2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply?: (parentId: string | null, authorName: string) => void;
  replyToId?: string | null;
  depth?: number;
  admin?: boolean;
  onUpdated?: () => void;
  articleId?: string;
  maxDepth?: number; // Maximum nesting depth (default: 4)
}

/**
 * CommentItem component - Displays a single comment with optional replies
 * Modern UI/UX design following best practices
 */
export default function CommentItem({ comment, onReply, replyToId, depth = 0, admin = false, onUpdated, articleId, maxDepth = 4 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReply = depth > 0;
  const isReplying = replyToId === comment.id;
  const canReply = depth < maxDepth;
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const authorName = comment.user?.name || comment.authorName || 'Anonymous';
  const authorEmail = comment.user?.email || comment.authorEmail;

  const handleApprove = async () => {
    if (!admin || isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve' }),
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error('Failed to approve comment');
      }
    } catch (err) {
      console.error('Error approving comment:', err);
      alert('Failed to approve comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!admin || isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject' }),
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error('Failed to reject comment');
      }
    } catch (err) {
      console.error('Error rejecting comment:', err);
      alert('Failed to reject comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!admin || isUpdating) return;
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok && onUpdated) {
        onUpdated();
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get avatar URL (using Gravatar or default)
  const getAvatarUrl = () => {
    if (authorEmail) {
      return `https://secure.gravatar.com/avatar/${authorEmail.toLowerCase().trim()}?s=48&d=mp&r=g`;
    }
    return `https://secure.gravatar.com/avatar/?s=48&d=mp&r=g`;
  };

  return (
    <article 
      id={`div-comment-${comment.id}`} 
      className="comment-item"
      style={{ 
        marginBottom: depth > 0 ? '1rem' : '1.5rem',
        marginLeft: depth > 0 ? '2rem' : '0',
        paddingLeft: depth > 0 ? '1rem' : '0',
        borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          <img
            alt={authorName}
            src={getAvatarUrl()}
            className="comment-avatar"
            height="48"
            width="48"
            decoding="async"
            style={{ 
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              objectFit: 'cover',
              border: '2px solid #f3f4f6',
            }}
          />
        </div>

        {/* Comment Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong style={{ 
              fontSize: '15px',
              fontWeight: '600',
              color: '#111827',
              lineHeight: '1.4',
            }}>
              {authorName}
            </strong>
            {comment.user && (
              <span style={{
                fontSize: '12px',
                color: '#10b981',
                fontWeight: '500',
                padding: '0.125rem 0.375rem',
                background: '#d1fae5',
                borderRadius: '4px',
              }}>
                Verified
              </span>
            )}
            <time style={{ 
              fontSize: '13px',
              color: '#6b7280',
              fontWeight: '400',
            }}>
              {formatDate(comment.createdAt)}
            </time>
          </div>

          {/* Comment Text */}
          <div style={{ 
            marginBottom: '0.75rem',
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {comment.content}
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {onReply && canReply && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (isReplying) {
                    onReply(null, '');
                  } else {
                    onReply(comment.id, authorName);
                  }
                }}
                className="comment-reply-button"
                style={{
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: isReplying ? '#ef4444' : '#4f46e5',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '0.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = isReplying ? '#dc2626' : '#4338ca';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isReplying ? '#ef4444' : '#4f46e5';
                }}
              >
                <MessageCircle size={16} />
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}

            {admin && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!comment.approved && (
                  <button
                    onClick={handleApprove}
                    disabled={isUpdating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      opacity: isUpdating ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUpdating) e.currentTarget.style.background = '#059669';
                    }}
                    onMouseLeave={(e) => {
                      if (!isUpdating) e.currentTarget.style.background = '#10b981';
                    }}
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                )}
                {comment.approved && (
                  <button
                    onClick={handleReject}
                    disabled={isUpdating}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      opacity: isUpdating ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUpdating) e.currentTarget.style.background = '#d97706';
                    }}
                    onMouseLeave={(e) => {
                      if (!isUpdating) e.currentTarget.style.background = '#f59e0b';
                    }}
                  >
                    <XCircle size={14} />
                    Unapprove
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    opacity: isUpdating ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdating) e.currentTarget.style.background = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    if (!isUpdating) e.currentTarget.style.background = '#ef4444';
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies Section */}
      {hasReplies && (
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowReplies(!showReplies)}
            className="view-replies-button"
            style={{
              background: 'transparent',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#4f46e5',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#4338ca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4f46e5';
            }}
          >
            {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>
              {showReplies ? 'Hide' : 'View'} {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
            </span>
          </button>
          {showReplies && (
            <ul className="comment-replies" style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '1rem 0 0 0',
            }}>
              {comment.replies?.map((reply) => (
                <li key={reply.id} id={`comment-${reply.id}`}>
                  <CommentItem
                    comment={reply}
                    onReply={onReply}
                    replyToId={replyToId}
                    depth={depth + 1}
                    admin={admin}
                    onUpdated={onUpdated}
                    articleId={articleId}
                    maxDepth={maxDepth}
                  />
                  {replyToId === reply.id && onReply && articleId && (
                    <div style={{ marginTop: '1rem', marginLeft: '2rem' }}>
                      <CommentForm
                        articleId={articleId}
                        parentId={replyToId}
                        parentAuthorName={reply.user?.name || reply.authorName || 'comment'}
                        onSubmitted={() => {
                          if (onUpdated) onUpdated();
                        }}
                        onCancel={() => {
                          onReply(null, '');
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
