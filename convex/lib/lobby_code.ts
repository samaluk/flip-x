const LOBBY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLobbyCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += LOBBY_CODE_CHARS[Math.floor(Math.random() * LOBBY_CODE_CHARS.length)];
  }
  return code;
}

export function isValidLobbyCodeFormat(code: string): boolean {
  if (code.length !== 4) return false;
  for (const char of code) {
    if (!LOBBY_CODE_CHARS.includes(char)) return false;
  }
  return true;
}
