import { useState, useEffect } from "react";
import { account, databases, ID, Query, DB_ID, COLLECTION_ID } from "../lib/appwrite";

const STATUSES = [
  { id: "watching",   label: "Смотрю",      emoji: "▶️" },
  { id: "will_watch", label: "Буду смотреть", emoji: "🔖" },
  { id: "stopped",    label: "Перестал",     emoji: "⏹️" },
  { id: "watched",    label: "Посмотрел",    emoji: "✅" },
];

const STATUS_BADGE = {
  watching:   "bg-green-50 text-green-700 border-green-100",
  will_watch: "bg-blue-50 text-blue-700 border-blue-100",
  stopped:    "bg-red-50 text-red-600 border-red-100",
  watched:    "bg-slate-100 text-slate-500 border-slate-200",
};

const EMPTY_FORM = { title: "", status: "watching", notes: "" };

export default function Dashboard({ user, onLogout }) {
  const [serials, setSerials] = useState([]);
  const [activeTab, setActiveTab] = useState("watching");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", serial }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSerials(); }, []);

  async function fetchSerials() {
    setLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]);
      setSerials(res.documents);
    } catch (err) {
      console.error("fetchSerials:", err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM, status: activeTab });
    setModal({ mode: "add" });
  }

  function openEdit(serial) {
    setForm({ title: serial.title, status: serial.status, notes: serial.notes || "" });
    setModal({ mode: "edit", serial });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        status: form.status,
        notes: form.notes.trim(),
        userId: user.$id,
      };
      if (modal.mode === "add") {
        const doc = await databases.createDocument(DB_ID, COLLECTION_ID, ID.unique(), data);
        setSerials((prev) => [doc, ...prev]);
      } else {
        const { userId, ...updateData } = data;
        const doc = await databases.updateDocument(DB_ID, COLLECTION_ID, modal.serial.$id, updateData);
        setSerials((prev) => prev.map((s) => (s.$id === doc.$id ? doc : s)));
      }
      setModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(serial) {
    if (!confirm(`Удалить "${serial.title}"?`)) return;
    await databases.deleteDocument(DB_ID, COLLECTION_ID, serial.$id);
    setSerials((prev) => prev.filter((s) => s.$id !== serial.$id));
  }

  async function moveStatus(serial, newStatus) {
    try {
      const doc = await databases.updateDocument(DB_ID, COLLECTION_ID, serial.$id, { status: newStatus });
      setSerials((prev) => prev.map((s) => (s.$id === doc.$id ? doc : s)));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogout() {
    await account.deleteSession("current");
    onLogout();
  }

  const filtered = serials.filter((s) => s.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="text-lg font-semibold text-slate-800">📺 Трекер сериалов</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-red-500 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-6 flex gap-1 overflow-x-auto">
        {STATUSES.map((s) => {
          const count = serials.filter((ser) => ser.status === s.id).length;
          const active = activeTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                active
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-6 max-w-6xl w-full mx-auto">
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-20">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-slate-400 font-medium">Список пуст</p>
            <p className="text-slate-300 text-sm mt-1">Нажмите + чтобы добавить сериал</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((serial) => (
              <SerialCard
                key={serial.$id}
                serial={serial}
                onEdit={openEdit}
                onDelete={handleDelete}
                onMove={moveStatus}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-8 right-8 w-14 h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center transition-colors z-20"
        title="Добавить сериал"
      >
        +
      </button>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => !saving && setModal(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              {modal.mode === "add" ? "Добавить сериал" : "Редактировать"}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-medium">Название *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Например: Breaking Bad"
                  required
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-medium">Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-pink-400 bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-medium">Заметки</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Опционально — сезон, впечатления..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-pink-400 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={saving}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : modal.mode === "add" ? "Добавить" : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SerialCard({ serial, onEdit, onDelete, onMove }) {
  const otherStatuses = STATUSES.filter((s) => s.id !== serial.status);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col gap-3 shadow-xs hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-800 text-sm leading-snug flex-1">{serial.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(serial)}
            className="text-slate-300 hover:text-slate-600 p-1 rounded transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(serial)}
            className="text-slate-300 hover:text-red-400 p-1 rounded transition-colors"
            title="Удалить"
          >
            🗑
          </button>
        </div>
      </div>

      {serial.notes && (
        <p className="text-slate-400 text-xs leading-relaxed">{serial.notes}</p>
      )}

      <div className="flex flex-wrap gap-1 mt-auto">
        {otherStatuses.map((s) => (
          <button
            key={s.id}
            onClick={() => onMove(serial, s.id)}
            className="text-xs px-2 py-1 rounded-md border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
