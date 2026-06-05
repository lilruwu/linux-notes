// settings.jsx — theme preferences, persisted to localStorage and presented
// in a proper Configuración modal (no more floating panel).
import React from "react";
import { Modal, Segmented, Slider, Field } from "./ui.jsx";

const LS_KEY = "linux-notes-settings";

// useSettings — single source of truth for appearance prefs.
export function useSettings(defaults) {
  const [values, setValues] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch {
      return defaults;
    }
  });
  const set = React.useCallback((key, val) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);
  return [values, set];
}

export function SettingsModal({ open, onClose, settings, onChange }) {
  return (
    <Modal open={open} title="Configuración" onClose={onClose} width={400}>
      <div className="settings-section">Apariencia</div>

      <Field label="Estilo">
        <Segmented
          value={settings.variant}
          options={[
            { value: "paper", label: "Papel" },
            { value: "slate", label: "Pizarra" },
            { value: "forest", label: "Bosque" },
          ]}
          onChange={(v) => onChange("variant", v)}
        />
      </Field>

      <Field label="Modo">
        <Segmented
          value={settings.theme}
          options={[
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
          ]}
          onChange={(v) => onChange("theme", v)}
        />
      </Field>

      <div className="settings-section">Tipografía</div>

      <Field label="Tamaño del texto" value={`${settings.fontSize}px`}>
        <Slider
          value={settings.fontSize}
          min={13}
          max={19}
          step={1}
          onChange={(v) => onChange("fontSize", v)}
        />
      </Field>
    </Modal>
  );
}
