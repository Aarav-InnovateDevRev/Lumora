import { useState } from 'react';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f1e9', fontFamily: 'system-ui, sans-serif', padding: '20px', overflowX: 'hidden' }}>
      <h1 style={{ textAlign: 'center', color: '#9a3412', fontSize: '42px' }}>🌱 Lumora</h1>
      <p style={{ textAlign: 'center', fontSize: '20px' }}>Test Page - Mobile Check</p>
      
      {currentPage === 'login' && (
        <div style={{ maxWidth: '400px', margin: '80px auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center' }}>Welcome to Lumora</h2>
          <button onClick={() => setCurrentPage('dashboard')} style={{ width: '100%', padding: '18px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '16px', fontSize: '19px', marginTop: '20px' }}>
            Go to Dashboard
          </button>
        </div>
      )}

      {currentPage === 'dashboard' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Welcome to Dashboard</h2>
          <p>This is working on mobile!</p>
        </div>
      )}
    </div>
  );
}

export default App;