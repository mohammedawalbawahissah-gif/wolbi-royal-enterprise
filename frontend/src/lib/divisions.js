// One place for each division's public mailbox. Keep in sync with
// backend settings.DIVISION_EMAILS (override there with EMAIL_<DIVISION> env vars).
export const GENERAL_EMAIL = "hello@wolbiroyal.com";

export const DIVISION_CONTACTS = [
  { key: "TECHNOLOGY", name: "Wolbi Technologies", email: "tech@wolbiroyal.com" },
  { key: "MEDICAL", name: "Wolbi Medical Services", email: "medical@wolbiroyal.com" },
  { key: "VIRTUAL", name: "Wolbi Virtual Solutions", email: "virtual@wolbiroyal.com" },
  { key: "FOUNDATION", name: "Wolbi Foundation", email: "foundation@wolbiroyal.com" },
];
