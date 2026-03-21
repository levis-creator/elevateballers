import { useEffect, useState } from 'react';
import type { CommentWithAuthor } from '../../cms/types';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentsListProps {
  articleId: string;
  showForm?: boolean;
  admin?: boolean;
}

/**
 * CommentsList component - Modern comments section with improved UI/UX
 */
export default function CommentsList({ articleId, showForm = true, admin = false }: CommentsListProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyToAuthor, setReplyToAuthor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        setError(null);
        const url = admin 
          ? `/api/comments?articleId=${articleId}&admin=true`
          : `/api/comments?articleId=${articleId}`;
        const response = await fetch(url, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch comments:', response.status, errorText);
          throw new Error(`Failed to fetch comments: ${response.status}`);
        }

        const data: CommentWithAuthor[] = await response.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comments');
        setComments([]);
      } finally {
        setLoading(false);
      }
    }

    if (articleId) {
      fetchComments();
    } else {
      console.warn('No articleId provided to CommentsList');
      setLoading(false);
    }
  }, [articleId, refreshKey, admin]);

  const handleReply = (parentId: string | null, authorName: string) => {
    if (parentId === null) {
      setReplyToId(null);
      setReplyToAuthor(null);
    } else {
      if (replyToId === parentId) {
        setReplyToId(null);
        setReplyToAuthor(null);
      } else {
        setReplyToId(parentId);
        setReplyToAuthor(authorName);
      }
    }
  };

  const handleCommentSubmitted = () => {
    setReplyToId(null);
    setReplyToAuthor(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCommentUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block' }}>
          <svg className="animate-spin" style={{ width: '32px', height: '32px', color: '#4f46e5' }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '15px' }}>Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        background: '#fef2f2',
        borderRadius: '12px',
        border: '1px solid #fecaca',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#ef4444">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
            Error loading comments
          </h3>
        </div>
        <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  const totalComments = comments.reduce((count, comment) => {
    const countReplies = (replies?: CommentWithAuthor[]): number => {
      if (!replies || replies.length === 0) return 0;
      return replies.length + replies.reduce((sum, reply) => sum + countReplies(reply.replies), 0);
    };
    return count + 1 + countReplies(comment.replies);
  }, 0);

  return (
    <section className="comments-section" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '24px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span>Comments</span>
          {comments.length > 0 && (
            <span style={{
              fontSize: '16px',
              fontWeight: '500',
              color: '#6b7280',
              background: '#f3f4f6',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
            }}>
              {totalComments}
            </span>
          )}
          {admin && (
            <span style={{ 
              fontSize: '14px',
              fontWeight: '400',
              color: '#6b7280',
            }}>
              (including unapproved)
            </span>
          )}
        </h2>
      </div>

      {showForm && !replyToId && (
        <div style={{ marginBottom: '2.5rem' }}>
          <CommentForm
            articleId={articleId}
            parentId={null}
            onSubmitted={handleCommentSubmitted}
            onCancel={undefined}
          />
        </div>
      )}

      {comments.length === 0 ? (
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', color: '#9ca3af' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ 
            color: '#374151', 
            fontSize: '16px',
            fontWeight: '500',
            margin: '0 0 0.5rem 0',
          }}>
            {admin ? 'No comments yet' : 'No comments yet. Be the first to comment!'}
          </p>
          {!admin && (
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: 0,
            }}>
              Start the conversation by sharing your thoughts below.
            </p>
          )}
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} style={{ marginBottom: '2rem' }}>
              <CommentItem
                comment={comment}
                onReply={handleReply}
                replyToId={replyToId}
                admin={admin}
                onUpdated={handleCommentUpdated}
                articleId={articleId}
              />
              {replyToId === comment.id && (
                <div style={{ marginTop: '1rem', marginLeft: '3rem' }}>
                  <CommentForm
                    articleId={articleId}
                    parentId={replyToId}
                    parentAuthorName={replyToAuthor}
                    onSubmitted={handleCommentSubmitted}
                    onCancel={() => {
                      setReplyToId(null);
                      setReplyToAuthor(null);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
