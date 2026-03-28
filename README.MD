# cam

> A simple web app to capture photos from your camera in the browser.

## Live Demo

This repository is set up to deploy the `main`branch directly to GitHub Pages.
https://matthias-jaeger-net.github.io/cam/

---

## Project Structure

**Details:**

- **index.html** – Contains the layout: camera container, shutter button, switch camera button, and photo overlay.
- **script.js** – Handles camera initialization, switching front/back cameras, taking photos, showing flash effect, and sharing/downloading images.
- **style.css** – Provides styling for the camera view, buttons, overlays, and simple transitions.

## Features

- Access front/back camera from the browser
- Full-screen video preview
- Take photos with a shutter button
- Flash animation for capture
- Preview captured image in an overlay
- Download or share captured photos
- Switch between front and back cameras

---

## Usage

1. Open `index.html` in a modern browser (mobile recommended).
2. Allow camera access when prompted.
3. Use the **shutter button** to take a photo.
4. Use the **switch camera button** to toggle front/back camera.
5. Click the overlay image **close button** to return to camera view.

---

## Notes

- Works best on **mobile browsers** that support the Media Capture API.
- p5*.*js framework is used for camera and rendering.
- Minimal styling for easy customization.
