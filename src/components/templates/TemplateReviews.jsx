// components/templates/TemplateReviews.jsx
import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TemplateReviews({ template }) {
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['template-reviews', template.id],
    queryFn: async () => {
      const data = await base44.entities.TemplateReview.filter(
        { template_id: template.id },
        '-created_date',
        50
      );
      return data;
    }
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const user = await base44.auth.me();
      return base44.entities.TemplateReview.create({
        ...reviewData,
        user_email: user.email,
        template_id: template.id,
        template_slug: template.slug
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['template-reviews', template.id]);
      setShowReviewForm(false);
      setRating(0);
      setComment('');
      toast.success('Bewertung gespeichert!');
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Bewertung');
    }
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error('Bitte wähle eine Bewertung');
      return;
    }

    submitReviewMutation.mutate({
      rating,
      comment: comment.trim() || null
    });
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="bg-white rounded-xl p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Bewertungen ({reviews.length})
        </h3>
        <Button
          onClick={() => setShowReviewForm(!showReviewForm)}
          variant="outline"
          size="sm"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Bewertung schreiben
        </Button>
      </div>

      {/* Rating Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-8 pb-6 border-b">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {avgRating}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Basierend auf {reviews.length} Bewertungen
          </div>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-8">{stars}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">Deine Bewertung</h4>
          
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Teile deine Erfahrung mit dieser Vorlage (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mb-4"
          />

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
            >
              {submitReviewMutation.isPending ? 'Wird gespeichert...' : 'Bewertung abgeben'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setComment('');
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Noch keine Bewertungen. Sei der Erste!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {review.user_email.split('@')[0]} • {format(new Date(review.created_date), 'dd. MMM yyyy', { locale: de })}
                  </div>
                </div>
              </div>
              
              {review.comment && (
                <p className="text-gray-700 text-sm">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}