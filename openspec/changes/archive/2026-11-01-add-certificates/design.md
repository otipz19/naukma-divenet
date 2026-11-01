# Design

## Context

See proposal.md for motivation. `ARCHITECTURE.md` places certificates in the `user` package. `User.isShowCertificates()` exists and nothing reads it. `MediaService.attach` and `release` clear the persistence context. `ModerationPage` holds one queue, and `PhotoField` takes `max`. Migrations run up to V12.

## Goals / Non-Goals

**Goals:**

- A verified badge that means something: editing a certificate removes its verification.
- A number and photo that never reach the public.

**Non-Goals:**

- Contacting agencies, ranking levels, or notifying divers of a decision. They see the result on their page.

## Decisions

### D1: Schema

`V13__create_certificates.sql`:

```sql
certificates (
  id bigint identity PK,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  agency varchar(16) NOT NULL CHECK (IN ('PADI','SSI','CMAS','OTHER')),
  level varchar(100) NOT NULL,
  number varchar(50) NOT NULL,
  photo_id uuid REFERENCES media ON DELETE SET NULL,
  status varchar(16) NOT NULL CHECK (IN ('PENDING','VERIFIED','REJECTED')),
  rejection_reason varchar(500),
  verified_at timestamptz,
  created_at, updated_at timestamptz NOT NULL,
  CHECK ((status = 'REJECTED') = (rejection_reason IS NOT NULL)),
  CHECK ((status = 'VERIFIED') = (verified_at IS NOT NULL))
)
```

Indexes on `(user_id, created_at DESC)` and `(status, created_at)`. `level` is free text, because agencies name levels differently. PRODUCT.md requires a number, so it is not null.

### D2: Rejection

PRODUCT.md and US-C1 mention only verifying. A rejected state is added because otherwise a bogus declaration stays in the queue for ever, and the moderation mockup and site moderation both use a reason. The owner fixes it by editing, which returns it to pending.

### D3: API and privacy

| Endpoint | Auth |
| --- | --- |
| `POST /api/v1/certificates` | signed in |
| `PUT`, `DELETE /api/v1/certificates/{id}` | owner |
| `GET /api/v1/users/{id}/certificates` | public, `showCertificates`; unpaged, one diver's list is small |
| `GET /api/v1/admin/certificates` | admin; paged with `@ParameterObject` |
| `POST /api/v1/admin/certificates/{id}/verify`, `/reject` | admin |

The note asks for owners and admins to see hidden certificates, so the `Viewer` carries both, as in `SiteCatalogService`. Hidden answers 403, as in `add-dive-log`. For other readers the service leaves out rejected certificates and nulls `number`, `photo` and `rejectionReason`: a certificate number identifies a person, and a photo of a card shows their name and more.

**Known limit:** `/media/{id}` is public by design (spec `media/uploads`), so a photo is protected only by its id not being disclosed. Anyone who has the URL can open it. The form's hint says so plainly, and this is why the photo is optional.

### D4: The badge

The note asks for the "highest" verified certificate, but a level is free text and cannot be ranked. `verifiedCertificate` is the most recently verified one, `ORDER BY verified_at DESC`. `OTHER` shows the level alone. The note left the privacy question open: the badge follows `showCertificates`, since a setting that hides certificates should not leave one on every review.

`CertificateService.verifiedBadges(Collection<Long> userIds)` returns a map in one query, and `ReviewService` calls it once per page, so a list adds one query rather than one per review.

### D5: Photos

As in `ProfileService.update`: attach a new id first, so a refusal changes nothing; save and flush; release the old one; read again. Delete releases the photo after removing the row.

### D6: Front-end

- `features/user/CertificatesPage` at `/profile/certificates`, in `RequireAuth`, with the list and a form on one page: React Hook Form with a Zod schema, `SelectField`, `TextField`, `PhotoField` with `max={1}`.
- `features/user/ProfileCertificates` in `ProfilePage`, waiting for the session as `ProfileDives` does.
- `features/user/CertificateQueue`, rendered in a tab. `ModerationPage` keeps its site queue as `SiteQueue` and gains `role="tablist"` tabs with counts, driven by `?tab=`. Both queries run on load for the counts.
- `ReviewCard` shows the badge beside the date.
- Status badge tones follow the Badge README: `VERIFIED` success, `PENDING` caution, `REJECTED` danger.

### i18n

No new namespace. New key groups: `user.certificates.*`, `site.moderation.tabs.*`, `site.moderation.certificates.*`; new key `review.verifiedBadge`.

## Risks / Trade-offs

- [An admin can verify their own certificate] → Accepted: one demo admin, who is trusted.
- [A level is free text, so spelling varies] → Accepted; a fixed list would have to cover every agency.
- [Two admins act at once] → As in site moderation: the last write wins if both pass the pending check.
- [Most recent is not the highest] → An owner who wants a different badge has no control. Acceptable for now, and the choice is visible in the spec.

## Migration Plan

Forward-only migration adding one table.
