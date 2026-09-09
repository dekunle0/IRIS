import { useState } from 'react';
import { PatientRegistration } from './components/PatientRegistration';
import { CaptureScreen } from './components/CaptureScreen';

function App() {
  const [currentTab, setCurrentTab] = useState<'register' | 'capture'>('register');

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-border p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex gap-4">
          <button 
            onClick={() => setCurrentTab('register')}
            className={`px-4 py-2 font-semibold rounded ${
              currentTab === 'register' ? 'bg-primary-pale text-primary-deep' : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            Patient Registration
          </button>
          <button 
            onClick={() => setCurrentTab('capture')}
            className={`px-4 py-2 font-semibold rounded ${
              currentTab === 'capture' ? 'bg-primary-pale text-primary-deep' : 'text-muted-foreground hover:bg-gray-100'
            }`}
          >
            Capture Feed
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="py-8">
        {currentTab === 'register' ? <PatientRegistration /> : <CaptureScreen />}
      </main>
    </div>
  );
}

export default App;