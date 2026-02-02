import React from 'react';
import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      text: "Endlich ein Rechner der auch die Finanzierung berücksichtigt! Habe damit 3 Objekte verglichen und das Beste gefunden.",
      author: "Thomas M.",
      role: "Immobilieninvestor",
      rating: 5,
      initials: "TM"
    },
    {
      text: "Super einfach zu bedienen. Die PDF-Analyse hat meine Bank überzeugt. Kredit wurde genehmigt!",
      author: "Sandra K.",
      role: "Erstkäuferin",
      rating: 5,
      initials: "SK"
    },
    {
      text: "Als Steuerberater empfehle ich den Rechner meinen Mandanten. Die AfA-Berechnung ist korrekt und hilfreich.",
      author: "Dr. Michael H.",
      role: "Steuerberater",
      rating: 5,
      initials: "MH"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Das sagen unsere Nutzer</h2>
          <p className="text-gray-600">Über 10.000 Berechnungen pro Monat</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex gap-1 mb-4">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold">
                  {t.initials}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{t.author}</div>
                  <div className="text-gray-600 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}