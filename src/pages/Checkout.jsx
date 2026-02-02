import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePricing } from '@/components/hooks/usePricing';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ priceId, amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, [priceId]);

  const createPaymentIntent = async () => {
    try {
      const { data } = await base44.functions.invoke('createStripeCheckout', {
        price_id: priceId,
        amount: amount,
        product_id: productId
      });
      setClientSecret(data.clientSecret);
    } catch (err) {
      toast.error('Fehler beim Erstellen der Zahlung');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {}
        }
      });

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Zahlung erfolgreich!');
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      toast.error('Zahlung fehlgeschlagen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="p-4">
        <CardElement />
      </Card>
      <Button type="submit" disabled={loading || !stripe} className="w-full">
        {loading ? 'Verarbeite...' : `€${(amount / 100).toFixed(2)} bezahlen`}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const { prices, loading } = usePricing(productId);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    if (!prices[0] || !currentUser) return;

    try {
      // Speichere Kauf in Supabase
      await base44.functions.invoke('recordPurchase', {
        user_email: currentUser.email,
        product_id: productId,
        price_id: prices[0].id,
        payment_intent_id: paymentIntentId,
        amount: prices[0].amount_cents
      });
      
      setTimeout(() => {
        window.location.href = `/checkout-success?payment_intent=${paymentIntentId}`;
      }, 1000);
    } catch (err) {
      toast.error('Fehler beim Speichern des Kaufs');
      console.error(err);
    }
  };

  if (!currentUser) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const price = prices[0];
  if (!price) {
    return <div className="text-center p-8">Produkt nicht gefunden</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto mt-12">
        <Card className="p-8">
          <h1 className="text-2xl font-bold mb-6">Sicher bezahlen</h1>
          
          <div className="mb-6 pb-6 border-b">
            <p className="text-gray-600 text-sm">Preis</p>
            <p className="text-3xl font-bold">€{(price.amount_cents / 100).toFixed(2)}</p>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm 
              priceId={price.id} 
              amount={price.amount_cents}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </Card>
      </div>
    </div>
  );
}