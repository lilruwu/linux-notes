// App.jsx — application shell, state, and wiring to the Rust/SQLite backend.
import React from "react";
import { Sidebar, NoteListPanel, Editor, NewTagModal } from "./components.jsx";
import { useSettings, SettingsModal } from "./settings.jsx";
import { ConfirmModal } from "./ui.jsx";
import { applyThemedIcon, applyWindowTheme } from "./appicon.js";
import { save, open } from "@tauri-apps/plugin-dialog";
import * as api from "./api.js";

export default function App() {
  // ── Appearance settings ──
  // Default mode is "auto" so a fresh install follows the system light/dark.
  const [settings, setSetting] = useSettings({ variant: "paper", theme: "auto", fontSize: 15 });
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // Resolve "auto" to the live system preference; "light"/"dark" pass through.
    const resolved = () =>
      settings.theme === "auto" ? (mq.matches ? "dark" : "light") : settings.theme;
    const apply = () => {
      const t = resolved();
      document.documentElement.className = `v-${settings.variant} t-${t}`;
      document.documentElement.style.setProperty("--font-size", settings.fontSize + "px");
      // Retint the window icon to match the active theme accent (best-effort).
      applyThemedIcon();
      // Keep the native window/titlebar in step: follow the system in "auto",
      // otherwise force the chosen mode.
      applyWindowTheme(settings.theme === "auto" ? null : t);
    };
    apply();
    // Repaint live when the system theme flips while in "auto" mode.
    if (settings.theme === "auto") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [settings.variant, settings.theme, settings.fontSize]);

  // ── Data (source of truth lives in SQLite via the backend) ──
  const [notes, setNotes] = React.useState([]);
  const [trash, setTrash] = React.useState([]);
  const [folders, setFolders] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedFolder, setSelectedFolder] = React.useState(() => {
    try { return localStorage.getItem("linux-notes-folder") || "all"; } catch { return "all"; }
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchRef = React.useRef(null);

  const [newTag, setNewTag] = React.useState({ open: false, noteId: null, error: "" });
  // Generic confirmation dialog: { title, message, danger, confirmLabel, onConfirm } | null
  const [confirm, setConfirm] = React.useState(null);
  const [importMsg, setImportMsg] = React.useState("");

  const trashMode = selectedFolder === "trash";

  // Initial load.
  const reloadNotes = React.useCallback(() => api.listNotes().then(setNotes), []);
  const reloadTrash = React.useCallback(() => api.listTrash().then(setTrash), []);

  React.useEffect(() => {
    api.listFolders().then(setFolders).catch((e) => console.error("Load folders failed:", e));
    api
      .listNotes()
      .then((rows) => {
        setNotes(rows);
        // Restore the last opened note if it still exists.
        let saved = null;
        try { saved = localStorage.getItem("linux-notes-note"); } catch {}
        const pick = rows.find((n) => n.id === saved) || rows[0];
        if (pick) setSelectedId(pick.id);
      })
      .catch((e) => console.error("Load notes failed:", e));
    reloadTrash().catch((e) => console.error("Load trash failed:", e));
  }, [reloadNotes, reloadTrash]);

  // Persist the current note / folder so they're restored next launch.
  React.useEffect(() => {
    try { localStorage.setItem("linux-notes-folder", selectedFolder); } catch {}
  }, [selectedFolder]);
  React.useEffect(() => {
    try { if (selectedId) localStorage.setItem("linux-notes-note", selectedId); } catch {}
  }, [selectedId]);

  // ── Derived: filtered + sorted ──
  const filteredNotes = React.useMemo(() => {
    const matchesQuery = (n) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.replace(/<[^>]+>/g, "").toLowerCase().includes(q)
      );
    };

    if (trashMode) return trash.filter(matchesQuery); // already ordered by deletion date

    let list = notes;
    if (selectedFolder === "favorites") list = list.filter((n) => n.favorite);
    else if (selectedFolder === "recent")
      list = [...list].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8);
    else if (selectedFolder !== "all") list = list.filter((n) => n.folder === selectedFolder);

    return [...list.filter(matchesQuery)].sort((a, b) => b.updated.localeCompare(a.updated));
  }, [notes, trash, trashMode, selectedFolder, searchQuery]);

  const selectedNote = (trashMode ? trash : notes).find((n) => n.id === selectedId) || null;

  // Keep a valid selection whenever the visible list changes.
  React.useEffect(() => {
    if (filteredNotes.length === 0) {
      if (selectedId !== null) setSelectedId(null);
    } else if (!filteredNotes.some((n) => n.id === selectedId)) {
      setSelectedId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedId]);

  // ── Notes CRUD ──
  const handleCreate = React.useCallback(async () => {
    const fallback = folders[0]?.name || "Personal";
    const folder = ["all", "favorites", "recent", "trash"].includes(selectedFolder) ? fallback : selectedFolder;
    try {
      const note = await api.createNote(folder);
      if (trashMode) setSelectedFolder("all");
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    } catch (e) {
      console.error("Create failed:", e);
    }
  }, [selectedFolder, folders, trashMode]);

  const handleUpdate = React.useCallback(async (id, changes) => {
    try {
      const updated = await api.updateNote(id, changes.title, changes.content);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      console.error("Update failed:", e);
    }
  }, []);

  const handleToggleFavorite = React.useCallback(async (id) => {
    try {
      const favorite = await api.toggleFavorite(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite } : n)));
    } catch (e) {
      console.error("Toggle favorite failed:", e);
    }
  }, []);

  const handleChangeFolder = React.useCallback(async (id, folder) => {
    try {
      const updated = await api.setNoteFolder(id, folder);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      console.error("Change tag failed:", e);
    }
  }, []);

  // ── Trash ──
  const askTrashNote = React.useCallback(
    (id) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      const title = note.title || "Sin título";
      setConfirm({
        title: "Mover a la papelera",
        message: `«${title}» se moverá a la papelera. Podrás restaurarla durante 30 días.`,
        confirmLabel: "Mover a la papelera",
        onConfirm: async () => {
          await api.deleteNote(id);
          await Promise.all([reloadNotes(), reloadTrash()]);
        },
      });
    },
    [notes, reloadNotes, reloadTrash]
  );

  const handleRestore = React.useCallback(
    async (id) => {
      try {
        await api.restoreNote(id);
        await Promise.all([reloadNotes(), reloadTrash()]);
      } catch (e) {
        console.error("Restore failed:", e);
      }
    },
    [reloadNotes, reloadTrash]
  );

  const askPurgeNote = React.useCallback(
    (id) => {
      const note = trash.find((n) => n.id === id);
      const title = note?.title || "Sin título";
      setConfirm({
        title: "Eliminar definitivamente",
        danger: true,
        confirmLabel: "Eliminar",
        message: `«${title}» se eliminará para siempre. Esta acción no se puede deshacer.`,
        onConfirm: async () => {
          await api.purgeNote(id);
          await reloadTrash();
        },
      });
    },
    [trash, reloadTrash]
  );

  const askEmptyTrash = React.useCallback(() => {
    const count = trash.length;
    setConfirm({
      title: "Vaciar papelera",
      danger: true,
      confirmLabel: "Vaciar papelera",
      message: `Se eliminarán ${count} nota${count === 1 ? "" : "s"} para siempre. Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        await api.emptyTrash();
        await reloadTrash();
      },
    });
  }, [trash, reloadTrash]);

  // ── Tags ──
  const openNewTag = React.useCallback((noteId) => {
    setNewTag({ open: true, noteId: noteId || null, error: "" });
  }, []);

  const handleCreateTag = React.useCallback(
    async (name, color) => {
      try {
        const folder = await api.createFolder(name, color);
        setFolders((prev) => [...prev, folder]);
        if (newTag.noteId) await handleChangeFolder(newTag.noteId, folder.name);
        setNewTag({ open: false, noteId: null, error: "" });
      } catch (e) {
        setNewTag((prev) => ({ ...prev, error: String(e) }));
      }
    },
    [newTag.noteId, handleChangeFolder]
  );

  const askDeleteTag = React.useCallback(
    (folder) => {
      const used = notes.filter((n) => n.folder === folder.name).length;
      const fallback = folders.find((f) => f.name !== folder.name)?.name;
      setConfirm({
        title: "Eliminar etiqueta",
        danger: true,
        confirmLabel: "Eliminar",
        message:
          used > 0
            ? `Se eliminará «${folder.name}». Sus ${used} nota${used === 1 ? "" : "s"} pasarán a «${fallback}».`
            : `Se eliminará la etiqueta «${folder.name}». Esta acción no se puede deshacer.`,
        onConfirm: async () => {
          const { fallback: moved } = await api.deleteFolder(folder.name);
          setFolders((prev) => prev.filter((f) => f.name !== folder.name));
          setNotes((prev) => prev.map((n) => (n.folder === folder.name ? { ...n, folder: moved } : n)));
          if (selectedFolder === folder.name) setSelectedFolder("all");
        },
      });
    },
    [notes, folders, selectedFolder]
  );

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setSearchQuery("");
  };

  // ── Backup: export / import ──
  const handleExport = React.useCallback(async () => {
    try {
      const path = await save({
        defaultPath: "linux-notes-backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      await api.exportToPath(path);
      setImportMsg("Copia exportada correctamente.");
    } catch (e) {
      console.error("Export failed:", e);
      setImportMsg("No se pudo exportar la copia.");
    }
  }, []);

  const handleImport = React.useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!selected) return;
      const path = Array.isArray(selected) ? selected[0] : selected;
      const count = await api.importFromPath(path);
      const [n, t, f] = await Promise.all([api.listNotes(), api.listTrash(), api.listFolders()]);
      setNotes(n);
      setTrash(t);
      setFolders(f);
      setImportMsg(`Importadas ${count} nota${count === 1 ? "" : "s"}.`);
    } catch (e) {
      console.error("Import failed:", e);
      setImportMsg("No se pudo importar el archivo.");
    }
  }, []);

  // ── Global keyboard shortcuts ──
  React.useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "n") { e.preventDefault(); handleCreate(); }
        if (e.key === "f") { e.preventDefault(); searchRef.current?.focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCreate]);

  return (
    <div className="app-root">
      <Sidebar
        notes={notes}
        folders={folders}
        trashCount={trash.length}
        selectedFolder={selectedFolder}
        onSelectFolder={handleFolderSelect}
        onNewTag={openNewTag}
        onDeleteTag={askDeleteTag}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <NoteListPanel
        notes={filteredNotes}
        selectedId={selectedId}
        trashMode={trashMode}
        onSelectNote={setSelectedId}
        onCreateNote={handleCreate}
        onEmptyTrash={askEmptyTrash}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchRef={searchRef}
      />
      <Editor
        note={selectedNote}
        folders={folders}
        trashMode={trashMode}
        onUpdate={handleUpdate}
        onDelete={askTrashNote}
        onToggleFavorite={handleToggleFavorite}
        onChangeFolder={handleChangeFolder}
        onNewTag={openNewTag}
        onRestore={handleRestore}
        onPurge={askPurgeNote}
      />

      <NewTagModal
        open={newTag.open}
        error={newTag.error}
        onClose={() => setNewTag({ open: false, noteId: null, error: "" })}
        onCreate={handleCreateTag}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={() => {
          const c = confirm;
          setConfirm(null);
          c?.onConfirm?.();
        }}
        onClose={() => setConfirm(null)}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => { setSettingsOpen(false); setImportMsg(""); }}
        settings={settings}
        onChange={setSetting}
        onExport={handleExport}
        onImport={handleImport}
        importMsg={importMsg}
      />
    </div>
  );
}
