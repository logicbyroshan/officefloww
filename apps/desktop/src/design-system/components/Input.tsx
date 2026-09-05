import React from "react";
import { Icon, IconName } from "./Icon";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  style,
  id,
  onFocus,
  onBlur,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: error ? "var(--status-error)" : "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        {icon && (
          <div
            style={{
              position: "absolute",
              left: "11px",
              color: "var(--text-muted)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon name={icon} size={14} />
          </div>
        )}
        <input
          id={inputId}
          style={{
            width: "100%",
            height: "var(--input-height, 36px)",
            boxSizing: "border-box",
            padding: icon ? "0 12px 0 34px" : "0 12px",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
            border: `1px solid ${error ? "var(--status-error)" : "var(--border-medium)"}`,
            borderRadius: "var(--radius-sm)",
            fontSize: "13px",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--accent)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 2px var(--status-error-soft)"
              : "0 0 0 2px var(--accent-soft)";
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--border-medium)";
            e.currentTarget.style.boxShadow = "none";
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
      </div>
      {error ? (
        <span style={{ fontSize: "11px", color: "var(--status-error)" }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onClear,
  style,
  placeholder = "Search...",
  onFocus,
  onBlur,
  ...props
}) => {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: "11px",
          color: "var(--text-muted)",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Icon name="search" size={14} />
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "var(--input-height, 36px)",
          boxSizing: "border-box",
          padding: "0 30px 0 34px",
          backgroundColor: "var(--bg-input)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-sm)",
          fontSize: "13px",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-soft)";
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-medium)";
          e.currentTarget.style.boxShadow = "none";
          if (onBlur) onBlur(e);
        }}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          style={{
            position: "absolute",
            right: "8px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            padding: "3px",
            cursor: "pointer",
            borderRadius: "var(--radius-xs)",
          }}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  );
};

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  style,
  id,
  onFocus,
  onBlur,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: error ? "var(--status-error)" : "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        <select
          id={selectId}
          style={{
            width: "100%",
            height: "var(--input-height, 36px)",
            boxSizing: "border-box",
            padding: "0 34px 0 12px",
            backgroundColor: "var(--bg-input)",
            backgroundImage: "none",
            color: "var(--text-primary)",
            border: `1px solid ${error ? "var(--status-error)" : "var(--border-medium)"}`,
            borderRadius: "var(--radius-sm)",
            fontSize: "13px",
            cursor: "pointer",
            outline: "none",
            appearance: "none",
            WebkitAppearance: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--accent)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 2px var(--status-error-soft)"
              : "0 0 0 2px var(--accent-soft)";
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--border-medium)";
            e.currentTarget.style.boxShadow = "none";
            if (onBlur) onBlur(e);
          }}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ backgroundColor: "#0e121a", color: "#f8fafc" }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div
          style={{
            position: "absolute",
            right: "13px",
            pointerEvents: "none",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Icon name="chevron-down" size={13} />
        </div>
      </div>
      {error ? (
        <span style={{ fontSize: "11px", color: "var(--status-error)" }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  style,
  id,
  rows = 3,
  onFocus,
  onBlur,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {label && (
        <label
          htmlFor={textareaId}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: error ? "var(--status-error)" : "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 12px",
          backgroundColor: "var(--bg-input)",
          color: "var(--text-primary)",
          border: `1px solid ${error ? "var(--status-error)" : "var(--border-medium)"}`,
          borderRadius: "var(--radius-sm)",
          fontSize: "13px",
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--accent)";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 2px var(--status-error-soft)"
            : "0 0 0 2px var(--accent-soft)";
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "var(--status-error)" : "var(--border-medium)";
          e.currentTarget.style.boxShadow = "none";
          if (onBlur) onBlur(e);
        }}
        {...props}
      />
      {error ? (
        <span style={{ fontSize: "11px", color: "var(--status-error)" }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{helperText}</span>
      ) : null}
    </div>
  );
};
