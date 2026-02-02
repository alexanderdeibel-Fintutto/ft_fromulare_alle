import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let waitingForSecondKey = false;

    const handleKeyPress = (e) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (isTyping) return;

      // Cmd/Ctrl + K: Command palette (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toast.info('Command Palette (Coming Soon)');
        return;
      }

      // Keyboard shortcuts with 'g' prefix (like GitHub)
      if (e.key === 'g' && !waitingForSecondKey) {
        waitingForSecondKey = true;
        setTimeout(() => {
          waitingForSecondKey = false;
        }, 1000);
        return;
      }

      if (waitingForSecondKey) {
        waitingForSecondKey = false;
        switch (e.key) {
          case 'd':
            navigate(createPageUrl('Dashboard'));
            toast.success('→ Dashboard');
            break;
          case 'p':
            navigate(createPageUrl('Profile'));
            toast.success('→ Profil');
            break;
          case 'b':
            navigate(createPageUrl('Billing'));
            toast.success('→ Abrechnung');
            break;
          case 's':
            navigate(createPageUrl('Settings'));
            toast.success('→ Einstellungen');
            break;
        }
        return;
      }

      // ? for help
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        showShortcutsHelp();
      }
    };

    const showShortcutsHelp = () => {
      toast.info(
        <div className="space-y-2 text-sm">
          <div className="font-semibold">Tastaturkürzel:</div>
          <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">g</kbd> → <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">d</kbd> Dashboard</div>
          <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">g</kbd> → <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">p</kbd> Profil</div>
          <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">g</kbd> → <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">b</kbd> Abrechnung</div>
          <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">g</kbd> → <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">s</kbd> Einstellungen</div>
          <div><kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">?</kbd> Hilfe</div>
        </div>,
        { duration: 5000 }
      );
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return null;
}