import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, LogOut } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function AppHeader() {
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.error('Load user failed:', err);
      }
    }
    loadUser();
  }, []);
  
  const handleLogout = async () => {
    await base44.auth.logout();
  };
  
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={createPageUrl('FormulareIndex')} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">FinTuttO Formulare</span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              to={createPageUrl('MeineDokumente')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Meine Dokumente</span>
            </Link>
            
            {user && (
              <>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user.full_name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}