import { CircleCheck, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import styles from "./Toast.module.css";

/** How long a toast stays without hover or focus (spec shared/app-shell). */
export const TOAST_MS = 10000;

export type ToastInput = { title?: string; body?: string; link?: { to: string; label: string } };
type ToastItem = ToastInput & { id: number };
type ToastApi = { show: (toast: ToastInput) => void };

const ToastContext = createContext<ToastApi | null>(null);
const ItemsContext = createContext<{ items: ToastItem[]; dismiss: (id: number) => void }>({
  items: [],
  dismiss: () => {},
});

/** Holds the toasts of the app shell; `ToastRegion` shows them and `useToast()` adds one (design D5). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setItems((current) => [...current, { ...toast, id }]);
  }, []);
  const dismiss = useCallback(
    (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const api = useMemo(() => ({ show }), [show]);
  const list = useMemo(() => ({ items, dismiss }), [items, dismiss]);
  return (
    <ToastContext.Provider value={api}>
      <ItemsContext.Provider value={list}>{children}</ItemsContext.Provider>
    </ToastContext.Provider>
  );
}

/** Adds a toast to the app shell's region. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast() needs a ToastProvider");
  return api;
}

/**
 * design/system/components/Toast: the single `role="status"` region, so each new toast is
 * announced politely. Toasts stack, the newest last.
 */
export function ToastRegion() {
  const { items, dismiss } = useContext(ItemsContext);
  return (
    <div className={styles.region} role="status">
      {items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  });
  // The timer runs only while the toast is neither hovered nor focused, and starts over each time.
  useEffect(() => {
    if (hovered || focused) return;
    const timer = setTimeout(() => dismissRef.current(), TOAST_MS);
    return () => clearTimeout(timer);
  }, [hovered, focused]);
  return (
    <div
      className={`body-sm ${styles.toast}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <CircleCheck className={styles.icon} size={20} aria-hidden="true" />
      <div className={styles.body}>
        {item.title && <strong className={styles.title}>{item.title}</strong>}
        {item.body && <span>{item.body}</span>}
        {item.link && <Link to={item.link.to}>{item.link.label}</Link>}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label={t("common.toast.close")}
        onClick={onDismiss}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
