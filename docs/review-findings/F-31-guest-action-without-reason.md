# F-31 A visitor's action jumps to Log in without a reason

- **Area:** Auth UX
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
A visitor who presses "Write a review" lands on the Log in page. Nothing says why.

## Cause
Visitors see the diver actions (F-09 kept this). The actions are links to routes inside
`RequireAuth`, which redirects to `/login` and then returns to the action after login.

## Fix (owner's suggestion, 2026-11-22)
For a visitor, these actions open a dialog instead: it says that you must log in to do
this, and offers **Log in** and **Cancel**. Log in goes to the log-in page and returns
to the action afterwards. The actions are "Log a dive here", "Write a review",
"Report a warning" and "Add a site". A direct visit to a protected URL keeps the
current redirect.
