// components.jsx — Sidebar, NoteListPanel, Editor, NewTagModal
import React from "react";
import { formatDate, colorOf, TAG_PALETTE, trashDaysLeft } from "./data.js";
import { Modal } from "./ui.jsx";
import { readClipboardImageDataUrl } from "./clipboard.js";

// ── ICONS ──────────────────────────────────────────────

function IcLines() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="2" y="7.1" width="12" height="1.8" rx="0.9" fill="currentColor" />
      <rect x="2" y="11.2" width="7.5" height="1.8" rx="0.9" fill="currentColor" />
    </svg>
  );
}

function IcStar({ filled }) {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.8 9.7 5.3l3.8.55-2.75 2.68.65 3.8L8 10.4l-3.4 1.93.65-3.8L2.5 5.85l3.8-.55z"
        fill={filled ? "#F5A623" : "none"}
        stroke={filled ? "#F5A623" : "currentColor"}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IcClock() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Small filled tag dot used for folders/tags.
function TagDot({ color, size = 11 }) {
  return (
    <svg className="nav-icon" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 3.2A.7.7 0 013.2 2.5h4.4c.2 0 .37.08.5.22l5.18 5.17a.7.7 0 010 1L9.4 13.06a.7.7 0 01-1 0L3.22 7.9a.7.7 0 01-.22-.5z"
        fill={color}
      />
      <circle cx="5.6" cy="5.6" r="1" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function IcTrashNav() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 4.5V3.4a.7.7 0 01.7-.7h2.6a.7.7 0 01.7.7v1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.2 4.5l.6 8a1 1 0 001 .95h4.4a1 1 0 001-.95l.6-8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.6 7v3.5M9.4 7v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcRestore() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8a4.5 4.5 0 104.5-4.5c-1.7 0-3.2.95-4 2.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 3v2.9h2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPlus({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5 5.5 10.5 11.5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcTrash({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <path d="M3 4.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 4.5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="3.5" y="4.5" width="8" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 7v3M9 7v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IcImage() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.4" cy="6.2" r="1.1" fill="currentColor" />
      <path d="M3 11.5l3-3 2.2 2.2L10.5 8l2.5 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcCheckSquare() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 8l2.1 2.1L11 5.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcSettings() {
  return (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── SIDEBAR ────────────────────────────────────────────

function NavItem({ icon, label, count, selected, onClick }) {
  return (
    <div className={`nav-item${selected ? " active" : ""}`} onClick={onClick}>
      {icon}
      <span className="nav-label">{label}</span>
      {count != null && <span className="nav-count">{count}</span>}
    </div>
  );
}

export function Sidebar({ notes, folders, trashCount, selectedFolder, onSelectFolder, onNewTag, onDeleteTag, onOpenSettings }) {
  const favCount = notes.filter((n) => n.favorite).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Notas</div>
      <nav className="sidebar-nav">
        <NavItem icon={<IcLines />} label="Todas las notas" count={notes.length} selected={selectedFolder === "all"} onClick={() => onSelectFolder("all")} />
        <NavItem icon={<IcStar />} label="Favoritas" count={favCount} selected={selectedFolder === "favorites"} onClick={() => onSelectFolder("favorites")} />
        <NavItem icon={<IcClock />} label="Recientes" count={null} selected={selectedFolder === "recent"} onClick={() => onSelectFolder("recent")} />
        <NavItem icon={<IcTrashNav />} label="Papelera" count={trashCount || null} selected={selectedFolder === "trash"} onClick={() => onSelectFolder("trash")} />

        <div className="sidebar-divider" />
        <div className="sidebar-section-row">
          <span className="sidebar-section-label">Etiquetas</span>
          <button className="tag-add-btn" title="Nueva etiqueta" onClick={() => onNewTag(null)}>
            <IcPlus size={11} />
          </button>
        </div>

        {folders.map((f) => (
          <div
            key={f.name}
            className={`nav-item tag-item${selectedFolder === f.name ? " active" : ""}`}
            onClick={() => onSelectFolder(f.name)}
          >
            <TagDot color={f.color} />
            <span className="nav-label">{f.name}</span>
            <span className="nav-count">{notes.filter((n) => n.folder === f.name).length}</span>
            {folders.length > 1 && (
              <button
                className="tag-del-btn"
                title="Eliminar etiqueta"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTag(f);
                }}
              >
                <IcTrash size={13} />
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavItem icon={<IcSettings />} label="Configuración" count={null} selected={false} onClick={onOpenSettings} />
      </div>
    </aside>
  );
}

// ── NOTE LIST ──────────────────────────────────────────

function NoteCard({ note, selected, trashMode, onClick }) {
  const days = trashMode ? trashDaysLeft(note.deletedAt) : null;
  return (
    <div className={`note-card${selected ? " selected" : ""}`} onClick={onClick}>
      <div className="note-card-title">
        {note.favorite && !trashMode && <span className="note-fav-dot" />}
        {note.title || <span style={{ opacity: 0.38 }}>Sin título</span>}
      </div>
      <div className="note-card-date">
        {trashMode ? (days === 0 ? "Se elimina hoy" : `Quedan ${days} día${days === 1 ? "" : "s"}`) : formatDate(note.updated)}
      </div>
    </div>
  );
}

export function NoteListPanel({ notes, selectedId, trashMode, onSelectNote, onCreateNote, onEmptyTrash, searchQuery, onSearchChange, searchRef }) {
  return (
    <div className="note-list-panel">
      <div className="list-header">
        {trashMode ? (
          <button className="empty-trash-btn" onClick={onEmptyTrash} disabled={notes.length === 0}>
            Vaciar papelera
          </button>
        ) : (
          <button className="new-note-btn" onClick={onCreateNote}>
            <IcPlus />
            <span>Nueva nota</span>
          </button>
        )}
        <input
          ref={searchRef}
          className="search-box"
          type="text"
          placeholder={trashMode ? "Buscar en la papelera…" : "Buscar notas…"}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {trashMode && notes.length > 0 && (
        <div className="trash-hint">Las notas se eliminan tras 30 días en la papelera.</div>
      )}
      <div className="notes-scroll">
        {notes.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? "Sin resultados" : trashMode ? "La papelera está vacía" : "Sin notas en esta carpeta"}
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} selected={note.id === selectedId} trashMode={trashMode} onClick={() => onSelectNote(note.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── TAG DROPDOWN (editor) ──────────────────────────────

function TagDropdown({ note, folders, onChangeFolder, onNewTag }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const color = colorOf(folders, note.folder);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Collapse the menu whenever the selected note changes.
  React.useEffect(() => setOpen(false), [note.id]);

  return (
    <div className="tag-dropdown" ref={ref}>
      <button
        className="folder-chip folder-chip-btn"
        style={{ background: color + "20", color }}
        onClick={() => setOpen((o) => !o)}
        title="Cambiar etiqueta"
      >
        <span className="folder-chip-dot" style={{ background: color }} />
        {note.folder}
        <IcChevron />
      </button>

      {open && (
        <div className="tag-menu" role="menu">
          {folders.map((f) => (
            <button
              key={f.name}
              className="tag-menu-item"
              role="menuitemradio"
              aria-checked={f.name === note.folder}
              onClick={() => {
                if (f.name !== note.folder) onChangeFolder(note.id, f.name);
                setOpen(false);
              }}
            >
              <span className="tag-menu-dot" style={{ background: f.color }} />
              <span className="tag-menu-name">{f.name}</span>
              {f.name === note.folder && (
                <span className="tag-menu-check">
                  <IcCheck />
                </span>
              )}
            </button>
          ))}
          <div className="tag-menu-sep" />
          <button
            className="tag-menu-item tag-menu-new"
            onClick={() => {
              setOpen(false);
              onNewTag(note.id);
            }}
          >
            <span className="tag-menu-plus">
              <IcPlus size={11} />
            </span>
            Nueva etiqueta…
          </button>
        </div>
      )}
    </div>
  );
}

// ── EDITOR ─────────────────────────────────────────────

// Read-only view shown when a trashed note is selected.
function TrashedNoteView({ note, onRestore, onPurge }) {
  const days = trashDaysLeft(note.deletedAt);
  return (
    <div className="editor-panel">
      <div className="trash-bar">
        <span className="trash-bar-text">
          En la papelera · {days === 0 ? "se elimina hoy" : `se elimina en ${days} día${days === 1 ? "" : "s"}`}
        </span>
        <div className="trash-bar-actions">
          <button className="trash-action restore" onClick={() => onRestore(note.id)}>
            <IcRestore />
            <span>Restaurar</span>
          </button>
          <button className="trash-action purge" onClick={() => onPurge(note.id)}>
            <IcTrash size={13} />
            <span>Eliminar definitivamente</span>
          </button>
        </div>
      </div>
      <div className="editor-body">
        <div className="editor-title editor-title-static">{note.title || "Sin título"}</div>
        <div className="editor-content editor-content-static" dangerouslySetInnerHTML={{ __html: note.content }} />
      </div>
    </div>
  );
}

export function Editor({ note, folders, trashMode, onUpdate, onDelete, onToggleFavorite, onChangeFolder, onNewTag, onRestore, onPurge }) {
  const titleRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const saveTimer = React.useRef(null);
  const activeId = React.useRef(null);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    if (!note || note.id === activeId.current) return;
    activeId.current = note.id;
    if (titleRef.current) titleRef.current.textContent = note.title;
    if (contentRef.current) contentRef.current.innerHTML = note.content;
    if (!note.title && titleRef.current) {
      setTimeout(() => titleRef.current && titleRef.current.focus(), 60);
    }
  }, [note && note.id]);

  const scheduleSave = React.useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!note) return;
      const title = (titleRef.current && titleRef.current.textContent.trim()) || "";
      const content = (contentRef.current && contentRef.current.innerHTML) || "";
      onUpdate(note.id, { title, content });
    }, 400);
  }, [note, onUpdate]);

  const fmt = (cmd, value) => {
    document.execCommand(cmd, false, value || undefined);
    contentRef.current && contentRef.current.focus();
    scheduleSave();
  };

  // ── To-do lists ──
  // Find the enclosing element matching `selector` for the current caret.
  const closestInContent = (selector) => {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !contentRef.current) return null;
    let node = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentElement;
    const found = node && node.closest ? node.closest(selector) : null;
    return found && contentRef.current.contains(found) ? found : null;
  };

  const placeCaretInBody = (todo) => {
    const body = todo.querySelector(".todo-body");
    if (!body) return;
    contentRef.current.focus();
    const range = document.createRange();
    range.setStart(body, 0);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const createTodoEl = (text = "") => {
    const todo = document.createElement("div");
    todo.className = "todo";
    todo.setAttribute("data-done", "false");
    const check = document.createElement("span");
    check.className = "todo-check";
    check.setAttribute("contenteditable", "false");
    const body = document.createElement("div");
    body.className = "todo-body";
    body.textContent = text;
    todo.appendChild(check);
    todo.appendChild(body);
    return todo;
  };

  const insertTodo = () => {
    contentRef.current.focus();
    const existing = closestInContent(".todo");
    const todo = createTodoEl("");
    if (existing) {
      existing.parentNode.insertBefore(todo, existing.nextSibling);
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.collapse(false);
        range.insertNode(todo);
      } else {
        contentRef.current.appendChild(todo);
      }
    }
    placeCaretInBody(todo);
    scheduleSave();
  };

  // Toggle a checkbox when its circle is clicked (event delegation).
  const handleContentClick = (e) => {
    const check = e.target.closest && e.target.closest(".todo-check");
    if (check && contentRef.current.contains(check)) {
      const todo = check.closest(".todo");
      const done = todo.getAttribute("data-done") === "true";
      todo.setAttribute("data-done", done ? "false" : "true");
      scheduleSave();
    }
  };

  // ── Images ──
  // Insert an image (given as a data URL), downscaling if it's large.
  const insertDataUrl = (dataUrl, preferJpeg = false) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        let url = dataUrl;
        if (scale < 1) {
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          url = canvas.toDataURL(preferJpeg ? "image/jpeg" : "image/png", 0.85);
        }
        contentRef.current.focus();
        document.execCommand("insertImage", false, url);
        scheduleSave();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });

  const embedImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => insertDataUrl(reader.result, file.type !== "image/png");
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) embedImageFile(file);
    e.target.value = "";
  };

  const handlePaste = async (e) => {
    const dt = e.clipboardData;
    if (dt) {
      // Image exposed directly by the webview (some sources / Wayland builds).
      const file = dt.files && [...dt.files].find((f) => f.type.startsWith("image/"));
      if (file) { e.preventDefault(); embedImageFile(file); return; }
      for (let i = 0; i < (dt.items ? dt.items.length : 0); i++) {
        const it = dt.items[i];
        if (it.type && it.type.startsWith("image/")) {
          e.preventDefault();
          const f = it.getAsFile();
          if (f) embedImageFile(f);
          return;
        }
      }
      // Real text on the clipboard → let the webview paste it (keeps formatting).
      const types = dt.types ? [...dt.types] : [];
      if (types.includes("text/plain") || types.includes("text/html")) return;
    }
    // WebKitGTK screenshot case: the image lives only on the system clipboard.
    e.preventDefault();
    const dataUrl = await readClipboardImageDataUrl();
    if (dataUrl) insertDataUrl(dataUrl, false);
  };

  const handleDrop = (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const img = [...files].find((f) => f.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      embedImageFile(img);
    }
  };

  // ── Markdown shortcuts ──
  const BLOCK_RULES = {
    "#": ["formatBlock", "h1"],
    "##": ["formatBlock", "h2"],
    "###": ["formatBlock", "h3"],
    "-": ["insertUnorderedList"],
    "*": ["insertUnorderedList"],
    "1.": ["insertOrderedList"],
    ">": ["formatBlock", "blockquote"],
    "[]": ["todo"],
    "[ ]": ["todo"],
  };

  const convertBlockToTodo = (block) => {
    const todo = createTodoEl("");
    if (block && block !== contentRef.current && block.parentNode) {
      block.parentNode.insertBefore(todo, block);
      block.remove();
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) sel.getRangeAt(0).insertNode(todo);
      else contentRef.current.appendChild(todo);
    }
    placeCaretInBody(todo);
  };

  // Markdown prefix at the start of a line (triggered by Space). Returns true if applied.
  const applyMarkdownBlock = (e) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;
    if (closestInContent(".todo") || closestInContent("pre")) return false;
    const range = sel.getRangeAt(0);
    let block = range.startContainer;
    if (block.nodeType === 3) block = block.parentElement;
    block = (block && block.closest && block.closest("p,div,h1,h2,h3,blockquote,li")) || contentRef.current;
    if (block.tagName === "LI") return false; // already in a list
    const pre = range.cloneRange();
    try { pre.setStart(block, 0); } catch { return false; }
    // `prefix === token` guarantees nothing precedes it, so deleting it is safe.
    const action = BLOCK_RULES[pre.toString()];
    if (!action) return false;
    e.preventDefault();
    pre.deleteContents();
    if (action[0] === "todo") {
      convertBlockToTodo(block);
    } else {
      // The live selection pointed at the now-deleted token; put the caret back
      // at the start of the block before running the formatting command.
      const caret = document.createRange();
      caret.setStart(block, 0);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
      if (action[0] === "formatBlock") document.execCommand("formatBlock", false, action[1]);
      else document.execCommand(action[0]);
    }
    scheduleSave();
    return true;
  };

  // Inline markdown (**bold**, *italic*, _italic_, `code`) resolved on Space.
  const applyInlineMarkdown = () => {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed) return;
    const node = sel.anchorNode;
    if (!node || node.nodeType !== 3) return;
    const before = node.textContent.slice(0, sel.anchorOffset);
    const rules = [
      { re: /\*\*([^*]+)\*\*$/, tag: "strong" },
      { re: /`([^`]+)`$/, tag: "code" },
      { re: /\*([^*]+)\*$/, tag: "em" },
      { re: /_([^_]+)_$/, tag: "em" },
    ];
    for (const { re, tag } of rules) {
      const m = before.match(re);
      if (!m) continue;
      const start = sel.anchorOffset - m[0].length;
      const r = document.createRange();
      r.setStart(node, start);
      r.setEnd(node, sel.anchorOffset);
      r.deleteContents();
      const el = document.createElement(tag);
      el.textContent = m[1];
      r.insertNode(el);
      const after = document.createRange();
      after.setStartAfter(el);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);
      scheduleSave();
      return;
    }
  };

  const handleContentKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); fmt("bold"); }
      if (e.key === "i") { e.preventDefault(); fmt("italic"); }
      if (e.key === "u") { e.preventDefault(); fmt("underline"); }
      return;
    }
    if (e.key === " ") {
      try {
        if (applyMarkdownBlock(e)) return; // block rule consumed the space
        applyInlineMarkdown(); // inline conversion; space still inserts normally
      } catch (err) {
        console.debug("markdown shortcut skipped:", err);
      }
      return;
    }
    // Enter inside a to-do continues the checklist; Enter on an empty item exits it.
    if (e.key === "Enter") {
      const todo = closestInContent(".todo");
      if (todo) {
        e.preventDefault();
        const body = todo.querySelector(".todo-body");
        const text = body ? body.textContent.replace(/\u200B/g, "").trim() : "";
        if (text === "") {
          const p = document.createElement("p");
          p.innerHTML = "<br>";
          todo.parentNode.insertBefore(p, todo.nextSibling);
          todo.remove();
          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          const next = createTodoEl("");
          todo.parentNode.insertBefore(next, todo.nextSibling);
          placeCaretInBody(next);
        }
        scheduleSave();
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      contentRef.current && contentRef.current.focus();
    }
  };

  if (!note) {
    return (
      <div className="editor-panel no-selection" style={{ display: "flex" }}>
        <p>{trashMode ? "Selecciona una nota de la papelera" : "Selecciona una nota o crea una nueva"}</p>
        {!trashMode && <span className="shortcut-hint">Ctrl + N</span>}
      </div>
    );
  }

  if (trashMode) {
    return <TrashedNoteView note={note} onRestore={onRestore} onPurge={onPurge} />;
  }

  return (
    <div className="editor-panel">
      {/* ── Toolbar ── */}
      <div className="editor-toolbar">
        <button className="toolbar-btn bold" onClick={() => fmt("bold")} title="Negrita (Ctrl+B)">B</button>
        <button className="toolbar-btn italic" onClick={() => fmt("italic")} title="Cursiva (Ctrl+I)">I</button>
        <button className="toolbar-btn underline" onClick={() => fmt("underline")} title="Subrayado (Ctrl+U)">U</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" onClick={() => fmt("formatBlock", "h1")} title="Título 1">H1</button>
        <button className="toolbar-btn" onClick={() => fmt("formatBlock", "h2")} title="Título 2">H2</button>
        <button className="toolbar-btn" onClick={() => fmt("formatBlock", "h3")} title="Título 3">H3</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" onClick={() => fmt("insertUnorderedList")} title="Lista">· Lista</button>
        <button className="toolbar-btn" onClick={() => fmt("insertOrderedList")} title="Lista numerada">1. Lista</button>
        <button className="toolbar-btn icon" onClick={insertTodo} title="Lista de tareas">
          <IcCheckSquare />
        </button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn icon" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Insertar imagen">
          <IcImage />
        </button>
        <button className="toolbar-btn" onClick={() => fmt("formatBlock", "pre")} title="Bloque de código" style={{ fontFamily: "monospace", letterSpacing: "0.03em" }}>
          {"</>"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: "2px", alignItems: "center" }}>
          <button
            className={`toolbar-btn fav${note.favorite ? " on" : ""}`}
            onClick={() => onToggleFavorite(note.id)}
            title={note.favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            {note.favorite ? "★" : "☆"}
          </button>
          <button className="toolbar-btn del" onClick={() => onDelete(note.id)} title="Eliminar nota">
            <IcTrash />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="editor-body">
        <div className="editor-meta-row">
          <TagDropdown note={note} folders={folders} onChangeFolder={onChangeFolder} onNewTag={onNewTag} />
          <span className="editor-date-text">{formatDate(note.updated)}</span>
          <span className="autosave-hint">Guardado automáticamente</span>
        </div>

        <div
          ref={titleRef}
          className="editor-title"
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleSave}
          onKeyDown={handleTitleKeyDown}
          data-placeholder="Sin título"
        />

        <div
          ref={contentRef}
          className="editor-content"
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleSave}
          onKeyDown={handleContentKeyDown}
          onClick={handleContentClick}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          data-placeholder="Empieza a escribir…"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── NEW TAG MODAL ──────────────────────────────────────

export function NewTagModal({ open, onClose, onCreate, error }) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(TAG_PALETTE[0]);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setColor(TAG_PALETTE[0]);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    }
  }, [open]);

  const submit = () => {
    if (name.trim()) onCreate(name.trim(), color);
  };

  return (
    <Modal
      open={open}
      title="Nueva etiqueta"
      onClose={onClose}
      width={360}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={!name.trim()}>Crear</button>
        </>
      }
    >
      <label className="field-label" htmlFor="tag-name">Nombre</label>
      <input
        id="tag-name"
        ref={inputRef}
        className="text-input"
        type="text"
        maxLength={24}
        placeholder="p. ej. Recetas"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      <label className="field-label" style={{ marginTop: 14 }}>Color</label>
      <div className="color-grid">
        {TAG_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch${c === color ? " selected" : ""}`}
            style={{ background: c }}
            aria-label={c}
            onClick={() => setColor(c)}
          >
            {c === color && <IcCheck />}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
    </Modal>
  );
}
