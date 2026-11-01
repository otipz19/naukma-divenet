# Spec Delta

## Purpose

Gives every form that takes photos (reviews, posts, profiles) one field that uploads them,
shows their thumbnails and hands the form the uploaded media ids.

## ADDED Requirements

### Requirement: The photo field shows the form's photos
The photo field SHALL render as in the Photos field of `design/screens/ReviewForm.html`: a
"Photos" label, a thumbnail for each photo in the form's value, an "Add photo" button that
opens a file picker for JPEG, PNG and WebP images, and the hint "JPEG, PNG or WebP up to 10 MB
each." Each thumbnail SHALL have a text alternative with its position.

#### Scenario: Field with two photos
- **WHEN** the field renders with a value of two uploaded media
- **THEN** it shows two images whose sources are their `thumbnailUrl`s, with the alternatives "Photo 1" and "Photo 2"
- **AND** it shows the "Add photo" button and the hint

#### Scenario: File picker accepts images only
- **WHEN** the field renders
- **THEN** its file input accepts `image/jpeg,image/png,image/webp` and allows several files

#### Scenario: Field in Ukrainian
- **WHEN** the active language is `uk`
- **THEN** the label, button, hint and alternatives are the `uk` translations

### Requirement: Picked photos are uploaded
The photo field SHALL upload each picked file to `POST /api/v1/media` as the signed-in user.
While a file uploads, the field SHALL show a busy placeholder for it and tell assistive
technology that it is uploading. When the upload succeeds, the field SHALL add the media to
its value, in the order the files were picked.

#### Scenario: Two photos picked
- **WHEN** the user picks two valid images and both uploads succeed
- **THEN** the field's value gains both media, in the order picked
- **AND** their thumbnails replace the busy placeholders

#### Scenario: Upload in progress
- **WHEN** the user picks an image and its upload has not finished
- **THEN** the field shows a busy placeholder with the accessible name "Uploading photo"

### Requirement: Invalid photos are refused with a message
The photo field SHALL refuse, without uploading, a picked file that is larger than 10 MB or
whose type is not JPEG, PNG or WebP. When the server refuses an upload or the network fails,
the field SHALL show a message that names the file and the reason. A refused file SHALL not
change the value or affect the other picked files.

#### Scenario: Too large before upload
- **WHEN** the user picks a 12 MB JPEG named `reef.jpg`
- **THEN** no upload request is sent
- **AND** the field shows an error naming `reef.jpg` and the 10 MB limit

#### Scenario: Wrong type before upload
- **WHEN** the user picks `notes.pdf`
- **THEN** no upload request is sent
- **AND** the field shows an error naming `notes.pdf` and the accepted types

#### Scenario: Server refuses the file
- **WHEN** the user picks two images and the server answers one upload with 415
- **THEN** the other image is added to the value
- **AND** the field shows an error naming the refused file

#### Scenario: Network failure
- **WHEN** the user picks an image and the upload request fails without a response
- **THEN** the value is unchanged
- **AND** the field shows an error naming the file that tells the user to try again

### Requirement: Photos can be removed
Each thumbnail SHALL have a remove button whose accessible name includes the photo's
position. Removing a photo SHALL take it out of the field's value and keep the order of the
others.

#### Scenario: Remove the first photo
- **WHEN** the field holds three photos and the user activates "Remove photo 1"
- **THEN** the value holds the second and third photos, in that order

### Requirement: The field limits the number of photos
The photo field SHALL take a maximum number of photos from its form. When the value holds
that many photos, the "Add photo" button SHALL be hidden and the hint SHALL state the limit.
Files picked beyond the remaining room SHALL not be uploaded, and the field SHALL say how many
were skipped.

#### Scenario: Limit reached
- **WHEN** the field has a maximum of 3 and holds 3 photos
- **THEN** the "Add photo" button is not shown
- **AND** the hint says at most 3 photos can be added

#### Scenario: Too many picked
- **WHEN** the field has a maximum of 3, holds 2 photos, and the user picks 3 images
- **THEN** only the first picked image is uploaded
- **AND** the field says 2 files were skipped
