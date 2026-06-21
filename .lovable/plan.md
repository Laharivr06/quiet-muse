I’ll fix this so a locked poem can be unlocked, its lock can be removed, and it can be edited normally after unlocking.

Plan:
1. Update the poem detail page unlock flow:
   - Keep “Unlock” as a temporary view unlock that shows content.
   - Make “Remove lock” open a key prompt when needed and call unlock with `remove: true`.
   - After lock removal, clear local locked state and refresh the poem query so the Edit button appears.
   - Show helpful error messages if the key is wrong.

2. Update editing behavior:
   - Prevent direct edit route from loading locked content.
   - After a poem is unlocked for viewing, make the edit action remove the lock first or require lock removal before navigating to edit, so saving is not blocked by `savePoem`.

3. Validate server logic:
   - Confirm `unlockPoem({ remove: true })` sets `is_locked: false` and clears `lock_hash`.
   - Ensure read-only unlock does not change `updated_at`, while removing the lock can update it.

Expected result:
- Locking a poem is reversible if the correct key is entered.
- The title remains visible while locked.
- The poem content can be viewed after entering the key.
- The lock can be removed with the key.
- Editing works after the lock is removed.