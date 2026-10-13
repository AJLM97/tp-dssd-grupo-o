import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rentar-panel rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Input({
  label,
  labelClassName = "text-zinc-700",
  inputClassName = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${labelClassName}`}>
      <span>{label}</span>
      <input
        {...props}
        className={`rentar-input rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-100 placeholder:text-zinc-500 focus:border-emerald-600 focus:ring ${inputClassName}`}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  labelClassName = "text-zinc-700",
  selectClassName = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
  labelClassName?: string;
  selectClassName?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${labelClassName}`}>
      <span>{label}</span>
      <select
        {...props}
        className={`rentar-input rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-100 focus:border-emerald-600 focus:ring ${selectClassName}`}
      >
        {children}
      </select>
    </label>
  );
}