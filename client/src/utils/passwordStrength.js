// Shared between the strength meter and the requirements checklist on Signup —
// one source of truth for what "strong enough" means.
export const REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", passedCount: 0 };

  const passedCount = REQUIREMENTS.filter((r) => r.test(password)).length;

  let label = "Weak";
  if (passedCount === REQUIREMENTS.length) label = "Strong";
  else if (passedCount >= 2) label = "Medium";

  return { score: passedCount, label, passedCount };
}
