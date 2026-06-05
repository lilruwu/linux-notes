// db.rs — SQLite schema, queries, and first-run seeding.

use rusqlite::{params, Connection, OptionalExtension, Result};

use crate::{Folder, Note};

/// Create tables if they don't exist and apply lightweight migrations.
pub fn init(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id         TEXT PRIMARY KEY,
            title      TEXT NOT NULL DEFAULT '',
            content    TEXT NOT NULL DEFAULT '',
            folder     TEXT NOT NULL DEFAULT 'Personal',
            favorite   INTEGER NOT NULL DEFAULT 0,
            created    TEXT NOT NULL,
            updated    TEXT NOT NULL,
            deleted_at TEXT
        )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS folders (
            name     TEXT PRIMARY KEY,
            color    TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Migration: add deleted_at to databases created before the trash existed.
    let has_deleted_at: bool = conn
        .prepare("SELECT 1 FROM pragma_table_info('notes') WHERE name = 'deleted_at'")?
        .exists([])?;
    if !has_deleted_at {
        conn.execute("ALTER TABLE notes ADD COLUMN deleted_at TEXT", [])?;
    }
    Ok(())
}

// ── Notes ───────────────────────────────────────────────────────────────────

fn row_to_note(row: &rusqlite::Row) -> Result<Note> {
    Ok(Note {
        id: row.get(0)?,
        title: row.get(1)?,
        content: row.get(2)?,
        folder: row.get(3)?,
        favorite: row.get::<_, i64>(4)? != 0,
        created: row.get(5)?,
        updated: row.get(6)?,
        deleted_at: row.get(7)?,
    })
}

const SELECT_COLS: &str = "id, title, content, folder, favorite, created, updated, deleted_at";

/// Active (non-trashed) notes.
pub fn list_notes(conn: &Connection) -> Result<Vec<Note>> {
    let sql = format!(
        "SELECT {SELECT_COLS} FROM notes WHERE deleted_at IS NULL ORDER BY updated DESC, created DESC"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], row_to_note)?;
    rows.collect()
}

/// Notes currently in the trash, most recently deleted first.
pub fn list_trash(conn: &Connection) -> Result<Vec<Note>> {
    let sql = format!(
        "SELECT {SELECT_COLS} FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC, updated DESC"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map([], row_to_note)?;
    rows.collect()
}

pub fn get_note(conn: &Connection, id: &str) -> Result<Option<Note>> {
    let sql = format!("SELECT {SELECT_COLS} FROM notes WHERE id = ?1");
    conn.query_row(&sql, params![id], row_to_note).optional()
}

pub fn insert_note(conn: &Connection, note: &Note) -> Result<()> {
    conn.execute(
        "INSERT INTO notes (id, title, content, folder, favorite, created, updated)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            note.id,
            note.title,
            note.content,
            note.folder,
            note.favorite as i64,
            note.created,
            note.updated
        ],
    )?;
    Ok(())
}

pub fn update_note(
    conn: &Connection,
    id: &str,
    title: &str,
    content: &str,
    updated: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE notes SET title = ?2, content = ?3, updated = ?4 WHERE id = ?1",
        params![id, title, content, updated],
    )?;
    Ok(())
}

/// Reassign a note to a different tag/folder.
pub fn update_note_folder(conn: &Connection, id: &str, folder: &str, updated: &str) -> Result<()> {
    conn.execute(
        "UPDATE notes SET folder = ?2, updated = ?3 WHERE id = ?1",
        params![id, folder, updated],
    )?;
    Ok(())
}

/// Move a note to the trash (soft delete).
pub fn trash_note(conn: &Connection, id: &str, when: &str) -> Result<()> {
    conn.execute(
        "UPDATE notes SET deleted_at = ?2 WHERE id = ?1",
        params![id, when],
    )?;
    Ok(())
}

/// Restore a note from the trash.
pub fn restore_note(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("UPDATE notes SET deleted_at = NULL WHERE id = ?1", params![id])?;
    Ok(())
}

/// Permanently remove a single note.
pub fn purge_note(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
    Ok(())
}

/// Permanently remove every trashed note.
pub fn empty_trash(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM notes WHERE deleted_at IS NOT NULL", [])?;
    Ok(())
}

/// Drop trashed notes whose deletion date is strictly before `cutoff` (YYYY-MM-DD).
pub fn purge_expired(conn: &Connection, cutoff: &str) -> Result<usize> {
    let n = conn.execute(
        "DELETE FROM notes WHERE deleted_at IS NOT NULL AND deleted_at < ?1",
        params![cutoff],
    )?;
    Ok(n)
}

/// Flip a note's favorite flag and return the new value.
pub fn toggle_favorite(conn: &Connection, id: &str) -> Result<bool> {
    conn.execute(
        "UPDATE notes SET favorite = 1 - favorite WHERE id = ?1",
        params![id],
    )?;
    let fav: i64 = conn.query_row(
        "SELECT favorite FROM notes WHERE id = ?1",
        params![id],
        |r| r.get(0),
    )?;
    Ok(fav != 0)
}

// ── Folders / tags ──────────────────────────────────────────────────────────

pub fn list_folders(conn: &Connection) -> Result<Vec<Folder>> {
    let mut stmt =
        conn.prepare("SELECT name, color FROM folders ORDER BY position ASC, name ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(Folder {
            name: row.get(0)?,
            color: row.get(1)?,
        })
    })?;
    rows.collect()
}

/// Case-insensitive existence check, used to reject duplicate tags.
pub fn folder_exists(conn: &Connection, name: &str) -> Result<bool> {
    let n: i64 = conn.query_row(
        "SELECT COUNT(*) FROM folders WHERE name = ?1 COLLATE NOCASE",
        params![name],
        |r| r.get(0),
    )?;
    Ok(n > 0)
}

pub fn insert_folder(conn: &Connection, name: &str, color: &str) -> Result<()> {
    let next_pos: i64 =
        conn.query_row("SELECT COALESCE(MAX(position), 0) + 1 FROM folders", [], |r| {
            r.get(0)
        })?;
    conn.execute(
        "INSERT INTO folders (name, color, position) VALUES (?1, ?2, ?3)",
        params![name, color, next_pos],
    )?;
    Ok(())
}

/// Populate the default tag set the first time the app runs.
pub fn seed_folders_if_empty(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM folders", [], |r| r.get(0))?;
    if count > 0 {
        return Ok(());
    }
    let defaults = [
        ("Trabajo", "#4B85E8"),
        ("Personal", "#52B46B"),
        ("Proyectos", "#E8A23A"),
        ("Ideas", "#E85252"),
    ];
    for (i, (name, color)) in defaults.iter().enumerate() {
        conn.execute(
            "INSERT INTO folders (name, color, position) VALUES (?1, ?2, ?3)",
            params![name, color, (i + 1) as i64],
        )?;
    }
    Ok(())
}

/// The number of tags currently defined.
pub fn folder_count(conn: &Connection) -> Result<i64> {
    conn.query_row("SELECT COUNT(*) FROM folders", [], |r| r.get(0))
}

/// Delete a tag. Any notes carrying it are reassigned to `fallback`.
/// (Refusing to delete the last remaining tag is enforced in the command layer.)
pub fn delete_folder(conn: &Connection, name: &str, fallback: &str) -> Result<()> {
    conn.execute(
        "UPDATE notes SET folder = ?2 WHERE folder = ?1",
        params![name, fallback],
    )?;
    conn.execute("DELETE FROM folders WHERE name = ?1", params![name])?;
    Ok(())
}

/// First tag other than `exclude` (by display order) — used as a reassignment target.
pub fn first_folder_except(conn: &Connection, exclude: &str) -> Result<Option<String>> {
    conn.query_row(
        "SELECT name FROM folders WHERE name <> ?1 ORDER BY position ASC, name ASC LIMIT 1",
        params![exclude],
        |r| r.get(0),
    )
    .optional()
}
