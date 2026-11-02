# media/uploads

## ADDED Requirements

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
