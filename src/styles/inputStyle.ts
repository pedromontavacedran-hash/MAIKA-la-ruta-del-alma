import { THEME } from "../config";

export const inputStyle = {
  width: "100%" as const,
  padding: 12,
  marginBottom: 10,
  borderRadius: 10,
  border: `2px solid ${THEME.goldMain}`,
  background: THEME.bg,
  color: THEME.text,
  fontSize: 18,
  outline: "none"
};
