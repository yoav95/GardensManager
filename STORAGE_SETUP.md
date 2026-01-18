# Firebase Storage Setup Guide

## Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `garden-manager-64f72`
3. Click **Storage** in the left sidebar
4. Click **Get Started**
5. Choose your storage location (any region is fine)
6. Click **Done**

Wait a few seconds for Storage to initialize...

## Deploy Storage Rules

After Storage is enabled, run:
```powershell
firebase deploy --only "storage"
```

## Image Upload Flow

When a user creates a new garden with an image:

1. User selects an image file (max 5MB)
2. Garden is created in Firestore first (gets an ID)
3. Image is uploaded to: `gardens/{gardenId}/{filename}`
4. Download URL is saved to the garden document as `imageURL`
5. Image is displayed in the garden card

## File Structure in Storage

```
gardens/
  ├── garden-id-1/
  │   ├── image1.jpg
  │   ├── image2.png
  │   └── ...
  ├── garden-id-2/
  │   ├── photo.jpg
  │   └── ...
  └── ...
```

Each garden folder is organized by its ID, and authenticated users can upload/read all images.
