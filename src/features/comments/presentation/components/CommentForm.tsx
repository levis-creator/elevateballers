import { useState } from 'react';

interface CommentFormProps {
  articleId: string;
  parentId?: string | null;
  parentAuthorName?: string | null;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

/**
 * CommentForm component - Modern form design for submitting comments
 */
export default function CommentForm({ articleId, parentId, parentAuthorName, onSubmitted, onCancel }: CommentFormProps) {
  const [formData, setFormData] = useState({
    content: '',
    authorName: '',
    authorEmail: '',
    authorUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content.trim(),
          authorName: formData.authorName.trim() || undefined,
          authorEmail: formData.authorEmail.trim() || undefined,
          authorUrl: formData.authorUrl.trim() || undefined,
          articleId,
          parentId: parentId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit comment');
      }

      // Reset form
      setFormData({
        content: '',
        authorName: '',
        authorEmail: '',
        authorUrl: '',
      });
      setSuccess(true);

      // Call callback
      if (onSubmitted) {
        setTimeout(() => {
          onSubmitted();
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div style={{ 
        padding: '1rem 1.25rem', 
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        color: '#065f46',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #6ee7b7',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p style={{ margin: 0, fontWeight: '500' }}>
            Thank you! Your comment has been posted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: parentId ? '#f9fafb' : 'transparent',
      borderRadius: '12px',
      padding: parentId ? '1.25rem' : '0',
      border: parentId ? '1px solid #e5e7eb' : 'none',
      marginTop: parentId ? '1rem' : '0',
    }}>
      {parentId && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '16px', 
            fontWeight: '600',
            color: '#111827'
          }}>
            Reply to <span style={{ color: '#4f46e5' }}>{parentAuthorName || 'comment'}</span>
          </h3>
          {onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onCancel();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ 
            padding: '0.875rem 1rem', 
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <textarea
            placeholder="Write your comment..."
            name="content"
            id="comment-content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={4}
            aria-required="true"
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              resize: 'vertical',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}>
          <div>
            <input
              placeholder="Name (optional)"
              name="authorName"
              type="text"
              id="comment-name"
              value={formData.authorName}
              onChange={handleChange}
              aria-required="false"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4f46e5';
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div>
            <input
              placeholder="Email (optional)"
              name="authorEmail"
              type="email"
              id="comment-email"
              value={formData.authorEmail}
              onChange={handleChange}
              aria-required="false"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4f46e5';
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {parentId && onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onCancel();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.75rem 1.5rem',
              background: submitting ? '#9ca3af' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = '#4338ca';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
