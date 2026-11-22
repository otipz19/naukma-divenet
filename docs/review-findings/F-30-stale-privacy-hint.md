# F-30 Edit profile has an outdated privacy hint

- **Area:** Profile
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
Under Privacy, Edit profile says "These apply as dive logs and certificates are added
to profiles." Both features exist now, so the hint reads as if they were still coming.

## Cause
The `user.profile.edit.privacyHint` string dates from before the dive log and
certificates existed.

## Fix (owner's decision)
New wording in `en` and `uk` that says what the switches do, for example "Choose what
other divers see on your profile."
