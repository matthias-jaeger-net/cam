# cam

> A simple web app to capture photos from your camera in the browser.

## Live Demo

https://matthias-jaeger-net.github.io/cam/

---

## Project Structure

cam/
├── index.html # Main HTML page
├── script.js # JavaScript for camera logic & photo capture
└── style.css # CSS styling for camera UI and overlays

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
- No frameworks required — pure HTML, CSS, and JavaScript.
- Minimal styling for easy customization.

---

## Getting Started (Optional)

To run locally:

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cam.git
```
