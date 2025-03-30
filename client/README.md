# MLM Post Detector (Chrome Extension)

A Vite-based Chrome extension that detects Multi-Level Marketing (MLM) related content on Instagram. By default, it uses an advanced BERT model with SHAP explanations.

## Installation & Build

1. **Change to client directory:**
   ```bash
   cd client
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the extension:**
   ```bash
   npm run build
   ```
   - This outputs a `dist/` folder containing the production-ready extension.

## Loading into Google Chrome

Before loading the extension make sure you have the [Flask server](../server/README.md) running.

1. **Open Chrome** and navigate to `chrome://extensions/`.
2. **Enable developer mode** (toggle in the top-right corner).
3. **Click "Load unpacked"** and select the `dist/` folder.  
   Chrome will load the extension as an unpacked extension.
4. **Pin the extension**:
   Once loaded, click the Extensions (puzzle piece) icon in the Chrome toolbar. Find "MLM post detector" in the list and click the pin icon next to it to pin the extension to your toolbar.

## Usage

1. **Navigate to** [instagram.com](https://www.instagram.com) and log in. Graders will be provided with an account via the Coursera project submission should they not wish to use their own.
2. **Click the pinned extension icon** to open the popup and **turn on scanning** by clicking the switch at the bottom of the popup.
   - By default, the extension uses the "Advanced" (BERT) model with SHAP explanations enabled.
   - You can switch to "Basic" (BoW) or toggle explanations in the popup’s settings.
3. **Click "Analyse post"** on any Instagram post in the main feed to see the model’s prediction.
4. **Navigate directly to a single post** from a profile or the Discover page for automatic predictions.

## Testing & Coverage

- **View coverage report**:  
  Open `coverage/index.html` in your browser (e.g., `file:///path/to/your/project/coverage/index.html`).
- **Run tests** (unit tests and coverage report in terminal):
  ```bash
  npm run test
  ```
