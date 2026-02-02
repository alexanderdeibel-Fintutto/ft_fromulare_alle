import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ShareCommentSection({ shareId, canApprove = false }) {
  const [newComment, setNewComment] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: comments = [], refetch } = useQuery({
    queryKey: ['shareComments', shareId],
    queryFn: async () => {
      const allComments = await base44.entities.ShareComment.filter({
        share_id: shareId
      }, '-created_date');
      return allComments || [];
    }
  });

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Kommentar erforderlich');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('addShareComment', {
        share_id: shareId,
        content: newComment,
        approval_required: requireApproval
      });
      setNewComment('');
      setRequireApproval(false);
      await refetch();
      toast.success('Kommentar hinzugefügt');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId, approved) => {
    try {
      await base44.functions.invoke('approveShareComment', {
        comment_id: commentId,
        approved
      });
      await refetch();
      toast.success(approved ? 'Genehmigt' : 'Abgelehnt');
    } catch (error) {
      toast.error('Fehler beim Genehmigen');
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-medium text-gray-900">Kommentare</h3>

      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{comment.author_email}</p>
                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(comment.created_date), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>

              {canApprove && comment.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(comment.id, true)}
                    className="text-green-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(comment.id, false)}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {comment.status === 'approved' && (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Kommentar hinzufügen..."
          rows={3}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              disabled={loading}
            />
            Genehmigung erforderlich
          </label>
          <Button onClick={handleAddComment} disabled={loading} size="sm" gap="2">
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Kommentar
          </Button>
        </div>
      </div>
    </div>
  );
}