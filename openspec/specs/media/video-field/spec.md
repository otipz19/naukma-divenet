# media/video-field Specification

## Purpose

The form field that uploads a form's videos, shows them in players, and removes them, with messages in both languages.

## Requirements

### Requirement: The video field uploads and shows videos

The field SHALL upload each picked file and add it to the form's value, showing a playable video for each item and a busy state while uploading. It SHALL offer no more files once the form's limit of 3 is reached.

#### Scenario: Picking a video

- **WHEN** the user picks an MP4
- **THEN** the field shows a busy state, and then a player for the uploaded video

#### Scenario: Reaching the limit

- **WHEN** the field holds 3 videos
- **THEN** it offers no Add video button, and says the limit is reached

#### Scenario: Removing

- **WHEN** the user chooses Remove on a video
- **THEN** the video leaves the value

### Requirement: Invalid videos are refused with a message

The field SHALL refuse, without uploading, a file larger than 50 MB or whose type is not MP4 or WebM. When the server refuses an upload or the network fails, it SHALL show a translated message naming the file and keep the other videos.

#### Scenario: Too large before upload

- **WHEN** the user picks a file of 51 MB
- **THEN** the field shows a message naming the file, and sends nothing

#### Scenario: Wrong type before upload

- **WHEN** the user picks a PNG
- **THEN** the field shows a message naming the file, and sends nothing

#### Scenario: Server refuses

- **WHEN** the server answers 415 for a picked file
- **THEN** the field shows a message naming the file, and the value is unchanged

#### Scenario: In Ukrainian

- **WHEN** the active language is `uk` and a file is refused
- **THEN** the message is in Ukrainian
