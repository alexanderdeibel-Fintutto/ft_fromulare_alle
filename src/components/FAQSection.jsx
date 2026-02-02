import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqItems = [
    {
      question: "Was ist die Bruttomietrendite?",
      answer: "Die Bruttomietrendite berechnet sich aus der Jahresmiete geteilt durch den Kaufpreis mal 100. Sie gibt einen ersten Überblick, berücksichtigt aber keine Nebenkosten oder Finanzierung."
    },
    {
      question: "Was ist eine gute Mietrendite?",
      answer: "Eine Bruttomietrendite ab 5% gilt als gut, ab 6% als sehr gut. Bei der Nettomietrendite sind Werte ab 3,5% akzeptabel und ab 4,5% gut."
    },
    {
      question: "Was ist der Unterschied zwischen Brutto- und Nettomietrendite?",
      answer: "Die Bruttomietrendite berücksichtigt nur Kaufpreis und Mieteinnahmen. Die Nettomietrendite zieht zusätzlich alle Kosten ab: Kaufnebenkosten, Hausgeld, Instandhaltung und Mietausfallrisiko."
    },
    {
      question: "Was ist die Eigenkapitalrendite?",
      answer: "Die Eigenkapitalrendite zeigt, wie viel Rendite du auf dein eingesetztes Eigenkapital erzielst. Durch den Hebeleffekt bei Finanzierung kann die EK-Rendite höher sein als die Objektrendite."
    },
    {
      question: "Wie hoch sind die Kaufnebenkosten?",
      answer: "Kaufnebenkosten betragen je nach Bundesland 7-15% des Kaufpreises: Grunderwerbsteuer (3,5-6,5%), Notarkosten (~1,5%), Grundbuchkosten (~0,5%) und ggf. Maklergebühren."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Häufige Fragen</h2>
        
        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-semibold text-gray-900">{item.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === idx && (
                <div className="px-4 pb-4 pt-0 text-gray-700 text-sm leading-relaxed border-t border-gray-100">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}