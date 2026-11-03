# media/uploads Specification

## Purpose

Lets signed-in users upload photos once, serves them and their thumbnails to everyone, and
lets features claim uploads for their content, so that uploads nobody claims are removed.

## Requirements

### Requirement: Signed-in users upload images
`POST /api/v1/media` SHALL accept a multipart request with one file in the part `file` from an
authenticated user. It SHALL store the file and respond 201 with the media's `id`, `url`,
`thumbnailUrl`, `contentType`, `width` and `height`, and a `Location` header equal to `url`.
The `id` SHALL be a random UUID, so media URLs cannot be guessed from other ids.

#### Scenario: JPEG upload
- **WHEN** an authenticated user posts a valid 1200×800 JPEG as `file`
- **THEN** the response status is 201
- **AND** the body has `contentType` `image/jpeg`, `width` 1200 and `height` 800
- **AND** `url` is `/media/{id}`, `thumbnailUrl` is `/media/{id}/thumb`, and `Location` equals `url`

#### Scenario: PNG and WebP uploads
- **WHEN** an authenticated user posts a valid PNG, and then a valid WebP
- **THEN** both responses are 201 with `contentType` `image/png` and `image/webp`

#### Scenario: Anonymous upload
- **WHEN** a client without an access token posts an image to `POST /api/v1/media`
- **THEN** the response status is 401 and nothing is stored

#### Scenario: No file part
- **WHEN** an authenticated user posts a multipart request without a `file` part
- **THEN** the response status is 400 with a problem detail whose `errors` names `file`

### Requirement: Only supported images are accepted
The upload SHALL decide the type from the file's content, not from its name or declared
content type, and accept only JPEG, PNG and WebP. It SHALL refuse a file that is larger than
10 MB, that cannot be decoded as an image of its type, or whose width × height exceeds
50 million pixels. A refused upload SHALL store nothing.

#### Scenario: Other file type with an image name
- **WHEN** an authenticated user posts a PDF named `photo.jpg` with the content type `image/jpeg`
- **THEN** the response status is 415 with a problem detail, and nothing is stored

#### Scenario: GIF
- **WHEN** an authenticated user posts a valid GIF image
- **THEN** the response status is 415

#### Scenario: Image sent with a wrong content type
- **WHEN** an authenticated user posts a valid PNG named `photo.bin` with the content type `application/octet-stream`
- **THEN** the response status is 201 with `contentType` `image/png`

#### Scenario: File over 10 MB
- **WHEN** an authenticated user posts a file of 10 MB plus one byte
- **THEN** the response status is 413 with a problem detail, and nothing is stored

#### Scenario: Corrupt image
- **WHEN** an authenticated user posts a file that starts with the JPEG signature but is not a decodable JPEG
- **THEN** the response status is 400 with a problem detail, and nothing is stored

#### Scenario: Too many pixels
- **WHEN** an authenticated user posts a PNG whose header declares 10000×6000 pixels
- **THEN** the response status is 400 with a problem detail, and nothing is stored

### Requirement: Each upload gets a thumbnail
On upload the system SHALL generate a JPEG thumbnail that keeps the image's aspect ratio and
whose longer side is 640 pixels, or the image's own size when the image is smaller. Transparent
areas SHALL become white.

#### Scenario: Large image is scaled down
- **WHEN** a 1200×800 image is uploaded and its `thumbnailUrl` is fetched
- **THEN** the response is a JPEG of 640×427 pixels

#### Scenario: Small image is not enlarged
- **WHEN** a 300×200 image is uploaded and its `thumbnailUrl` is fetched
- **THEN** the response is a JPEG of 300×200 pixels

#### Scenario: Transparent PNG
- **WHEN** a fully transparent PNG is uploaded and its `thumbnailUrl` is fetched
- **THEN** the thumbnail's pixels are white

### Requirement: Media is served to everyone
`GET /media/{id}` SHALL return the uploaded file byte for byte with its content type, and
`GET /media/{id}/thumb` its thumbnail as `image/jpeg`, to anonymous clients. Both SHALL send
`Cache-Control: public, max-age=31536000, immutable`, because a media id never changes its
content. An unknown or malformed id SHALL give 404.

#### Scenario: Anonymous client reads an upload
- **WHEN** an anonymous client fetches the `url` of an uploaded WebP
- **THEN** the response status is 200 with the content type `image/webp`
- **AND** the body equals the uploaded bytes
- **AND** the `Cache-Control` header is `public, max-age=31536000, immutable`

#### Scenario: Anonymous client reads a thumbnail
- **WHEN** an anonymous client fetches the `thumbnailUrl` of an upload
- **THEN** the response status is 200 with the content type `image/jpeg` and the same `Cache-Control` header

#### Scenario: Unknown media
- **WHEN** a client fetches `/media/{id}` or `/media/{id}/thumb` for a random UUID that was never uploaded
- **THEN** the response status is 404 with the content type `application/problem+json`

#### Scenario: Malformed id
- **WHEN** a client fetches `/media/not-a-uuid`
- **THEN** the response status is 404

### Requirement: Features attach a user's uploads to their content
The system SHALL let a feature attach uploads to a piece of content on behalf of a user. It
SHALL attach all the given uploads only when each exists, was uploaded by that user and is not
attached yet; otherwise it SHALL attach none of them and report which id was refused.

#### Scenario: Own unattached uploads
- **WHEN** a feature attaches two unattached uploads of user A on behalf of user A
- **THEN** both are attached

#### Scenario: Another user's upload
- **WHEN** a feature attaches, on behalf of user A, one upload of user A and one of user B
- **THEN** the attach is refused, naming user B's upload
- **AND** neither upload is attached

#### Scenario: Upload already attached
- **WHEN** a feature attaches, on behalf of its uploader, an upload that is already attached
- **THEN** the attach is refused, naming that upload

#### Scenario: Unknown id
- **WHEN** a feature attaches an id that was never uploaded
- **THEN** the attach is refused, naming that id

### Requirement: Released media is deleted
When a feature releases media, for example because its content was deleted or a photo was
removed from it, the system SHALL delete the file, its thumbnail and its record.

#### Scenario: Released upload is gone
- **WHEN** a feature releases an attached upload
- **THEN** `GET /media/{id}` and `GET /media/{id}/thumb` for it return 404
- **AND** its file and thumbnail no longer exist in storage

### Requirement: Unattached uploads expire
At least once an hour the system SHALL delete every upload that is not attached and was
uploaded more than 24 hours earlier, with its file and thumbnail. Attached uploads and uploads
24 hours old or younger SHALL be kept.

#### Scenario: Old unattached upload
- **WHEN** the cleanup runs 25 hours after an upload that was never attached
- **THEN** that upload's record, file and thumbnail are deleted

#### Scenario: Recent unattached upload
- **WHEN** the cleanup runs 23 hours after an upload that was never attached
- **THEN** that upload is kept

#### Scenario: Old attached upload
- **WHEN** the cleanup runs 25 hours after an upload that was attached
- **THEN** that upload is kept

### Requirement: Signed-in users upload videos

`POST /api/v1/media/videos` SHALL accept a multipart request with one file in the part `file` from an authenticated user. It SHALL accept MP4 and WebM up to 50 MB, decided by the file's content, and store the file unchanged. It SHALL respond 201 with the video's `id`, `url` and `contentType`, and a `Location` header equal to `url`.

#### Scenario: MP4 upload

- **WHEN** an authenticated user posts an MP4 as `file`
- **THEN** the response status is 201, `contentType` is `video/mp4`, `url` is `/media/{id}`, and `Location` equals `url`

#### Scenario: WebM upload

- **WHEN** an authenticated user posts a WebM as `file`
- **THEN** the response status is 201 and `contentType` is `video/webm`

#### Scenario: Anonymous upload

- **WHEN** a client without an access token posts a video
- **THEN** the response status is 401 and nothing is stored

#### Scenario: Not a video

- **WHEN** an authenticated user posts a PNG, or text named `clip.mp4`
- **THEN** the response status is 415 and nothing is stored

#### Scenario: QuickTime file

- **WHEN** an authenticated user posts a QuickTime file, whose `ftyp` brand is `qt`
- **THEN** the response status is 415 and nothing is stored

#### Scenario: Matroska file

- **WHEN** an authenticated user posts a Matroska file that is not WebM
- **THEN** the response status is 415 and nothing is stored

#### Scenario: Too large

- **WHEN** an authenticated user posts a video larger than 50 MB
- **THEN** the response status is 413 and nothing is stored

### Requirement: The image limit stays at 10 MB

`POST /api/v1/media` SHALL keep refusing a file larger than 10 MB with 413, and SHALL keep refusing a video with 415.

#### Scenario: Large image

- **WHEN** an authenticated user posts an image of 11 MB to `POST /api/v1/media`
- **THEN** the response status is 413 and nothing is stored

#### Scenario: Video as an image

- **WHEN** an authenticated user posts an MP4 to `POST /api/v1/media`
- **THEN** the response status is 415 and nothing is stored

### Requirement: Videos are served with range requests

`GET /media/{id}` SHALL serve a video to everyone with its content type, and SHALL answer a range request with 206 and that part of the file. A video SHALL have no thumbnail.

#### Scenario: Whole file

- **WHEN** anyone fetches a video's `url`
- **THEN** the response is 200 with the stored bytes and its `Content-Type`

#### Scenario: Range

- **WHEN** anyone fetches a video's `url` with `Range: bytes=0-9`
- **THEN** the response is 206 with the first 10 bytes

#### Scenario: No thumbnail

- **WHEN** anyone fetches `/media/{id}/thumb` for a video
- **THEN** the response status is 404

### Requirement: Images and videos are attached only as themselves

Attaching for a photo SHALL refuse a video, and attaching for a video SHALL refuse an image, as an upload that cannot be attached. Every feature that takes images SHALL therefore refuse a video.

#### Scenario: Video as a photo

- **WHEN** a user names their own video as a review's photo, a post's cover or image, an avatar or a certificate photo
- **THEN** the API answers 400 naming that field, and nothing changes

#### Scenario: Image as a video

- **WHEN** a user names their own image in `videoIds`
- **THEN** the API answers 400 naming `videoIds`, and nothing changes

### Requirement: Videos follow the upload lifecycle

An unattached video SHALL expire like an unattached image, and a released video SHALL be deleted with its file.

#### Scenario: Never attached

- **WHEN** the cleanup runs after a video has stayed unattached for over 24 hours
- **THEN** the video and its file are deleted

#### Scenario: Released

- **WHEN** a feature releases a video
- **THEN** its `url` answers 404

### Requirement: Media can be kept in MinIO

With `divenet.media.storage` set to `minio`, the system SHALL keep every original and thumbnail in one private MinIO bucket, created at startup when missing, and SHALL behave as it does on local disk: uploads are stored, served with their content type and range requests, and deleted on release. A missing object SHALL answer 404. Local disk SHALL remain the default.

#### Scenario: Upload and serve

- **WHEN** an image is uploaded with MinIO storage
- **THEN** its original and thumbnail are objects in the bucket, and `GET /media/{id}` and `GET /media/{id}/thumb` return them

#### Scenario: Range

- **WHEN** a video stored in MinIO is fetched with `Range: bytes=0-9`
- **THEN** the response is 206 with the first 10 bytes

#### Scenario: Release

- **WHEN** a feature releases an upload stored in MinIO
- **THEN** its objects are deleted after the transaction commits

#### Scenario: Missing object

- **WHEN** a media row exists but its object is gone from the bucket
- **THEN** `GET /media/{id}` answers 404

#### Scenario: Bucket created at startup

- **WHEN** the back-end starts against MinIO with no bucket
- **THEN** the bucket exists and is not readable anonymously

#### Scenario: Default

- **WHEN** the back-end starts without `divenet.media.storage`
- **THEN** media is kept on local disk
