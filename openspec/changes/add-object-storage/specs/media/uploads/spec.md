# media/uploads

## ADDED Requirements

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
