# F-29 Moderation actions give no feedback

- **Area:** Moderation
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
After Approve, Reject or Verify, the card just disappears from the queue. Nothing says
what happened.

## Cause
`features/site/ModerationPage.tsx` and `features/user/CertificateQueue.tsx` refresh
the queue after a decision and show nothing else. The app shell has had toasts since
`add-dialogs-and-toasts`.

## Fix (owner's decision)
Each decision shows a toast naming what happened, for example "Nereo Cave approved".
