import { FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DesktopTextDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  initialValue: string;
  message: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
  title: string;
};

function DesktopTextDialog({
  cancelLabel,
  confirmLabel,
  initialValue,
  message,
  onCancel,
  onConfirm,
  title,
}: DesktopTextDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="desktop-dialog-backdrop" role="presentation">
      <div aria-labelledby="desktop-text-dialog-title" aria-modal="true" className="desktop-dialog" role="dialog">
        <div className="desktop-dialog-titlebar">
          <div className="desktop-dialog-title">
            <span className="desktop-dialog-icon" aria-hidden="true">
              <FileText strokeWidth={1.8} />
            </span>
            <span>{title}</span>
          </div>
        </div>

        <div className="desktop-dialog-body">
          <div className="desktop-dialog-copy">
            <h4 id="desktop-text-dialog-title">{title}</h4>
            <p>{message}</p>
          </div>

          <input
            ref={inputRef}
            className="desktop-dialog-input"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onCancel();
              }

              if (event.key === "Enter") {
                onConfirm(value);
              }
            }}
          />

          <div className="desktop-dialog-actions">
            <button className="desktop-dialog-button" type="button" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="desktop-dialog-button desktop-dialog-button--primary" type="button" onClick={() => onConfirm(value)}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesktopTextDialog;
