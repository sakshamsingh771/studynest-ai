import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

export default function PasswordInput({ value, onChange, name, id, placeholder = "••••••••", autoComplete, className = "", error, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id || name}
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        required
        className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 ${
          error ? "border-danger/50 focus:ring-danger/20" : "border-ink/15 focus:ring-teal/30 focus:border-teal/50"
        } ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
      </button>
    </div>
  );
}
