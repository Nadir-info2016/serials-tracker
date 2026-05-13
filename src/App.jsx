import { useState, useEffect } from "react";
import { account } from "./lib/appwrite";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="text-slate-400 text-sm">Загрузка...</span>
      </div>
    );
  }

  return user
    ? <Dashboard user={user} onLogout={() => setUser(null)} />
    : <AuthPage onLogin={setUser} />;
}

export default App;
