import { useState } from "react";
import { account, ID } from "../lib/appwrite";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await account.create(ID.unique(), email, password, name);
      }
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      onLogin(user);
    } catch (err) {
      setError(err.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800 mb-1">📺 Трекер сериалов</h1>
          <p className="text-slate-400 text-sm">
            {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-pink-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-pink-400"
          />
          <input
            type="password"
            placeholder="Пароль (мин. 8 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-pink-400"
          />

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <button
          onClick={switchMode}
          className="mt-4 text-sm text-slate-400 hover:text-slate-600 w-full text-center transition-colors"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}
