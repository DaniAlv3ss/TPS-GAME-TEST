## 2024-05-23 - Accessibility in Pointer Lock Games
**Learning:** Games using Pointer Lock API present unique accessibility challenges. Relying on a global click listener on a div overlay makes it impossible for keyboard-only users to start the game, as they cannot trigger a click on a non-interactive element.
**Action:** Always provide a semantic `<button>` for the "Start" action. This ensures:
1.  Screen readers announce it as a button.
2.  It is focusable via Tab.
3.  It can be activated via Enter/Space.
4.  The click event bubbles up to the Pointer Lock handler.
