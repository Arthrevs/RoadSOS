// Shared constants used by multiple components.
// Moved out of App.jsx to break a circular import between App.jsx and
// ContactList.jsx (which broke production with a TDZ error after a
// chunk-ordering shift: "Cannot access 'ae' before initialization").

export const CATS = [
  "Hospital",
  "All",
  "Police",
  "Fire",
  "Repair",
  "Towing",
  "Showroom",
  "Puncture",
];
