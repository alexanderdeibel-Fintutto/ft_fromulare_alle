// components/templates/TemplateFAQ.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function TemplateFAQ({ template }) {
  const generalFAQs = [
    {
      question: 'Wie funktioniert die Dokumentenerstellung?',
      answer: 'Fülle einfach das Formular aus und klicke auf "Erstellen". Das Dokument wird automatisch als PDF generiert und kann sofort heruntergeladen werden.'
    },
    {
      question: 'Sind die Dokumente rechtssicher?',
      answer: 'Alle Vorlagen wurden von Rechtsexperten geprüft und entsprechen den aktuellen gesetzlichen Anforderungen. Trotzdem empfehlen wir bei komplexen Fällen die Beratung durch einen Anwalt.'
    },
    {
      question: 'Kann ich das Dokument nachträglich ändern?',
      answer: 'Ja, du kannst jederzeit ein neues Dokument mit geänderten Daten erstellen. Das ursprüngliche Dokument bleibt erhalten.'
    },
    {
      question: 'Was passiert mit meinen Daten?',
      answer: 'Deine Daten werden sicher gespeichert und nur für die Dokumentenerstellung verwendet. Du kannst deine Dokumente jederzeit löschen.'
    }
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Häufige Fragen
      </h3>
      
      <Accordion type="single" collapsible className="space-y-2">
        {generalFAQs.map((faq, idx) => (
          <AccordionItem key={idx} value={`item-${idx}`} className="bg-white rounded-lg border">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="text-left text-sm font-medium">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <p className="text-sm text-gray-600">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}