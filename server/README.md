# Flask Server

A lightweight Flask server for social media post classification (using trained BoW and BERT models) with endpoints for analysis and feedback. Classifies posts as being potentially Multi-Level Marketing (MLM) related.

## Setup

1. **Change to server directory:**
   ```bash
   cd server
   ```
2. **Create and activate a virtual environment.**

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the server on localhost port 4200:

```bash
python app.py
```

_(Runs in debug mode with `TOKENIZERS_PARALLELISM` disabled.)_

## Endpoints

### GET /ping

- **Purpose:** Health check.
- **Response:** Returns `"pong"`.

### POST /analyse

- **Purpose:** Analyse text and return prediction details.
- **Usage:**
  - **Default model:** Advanced (BERT).
  - **For BoW analysis:** Use `/analyse/basic`.
  - **For SHAP explanations (advanced):** Append `?explanations=true`.
- **Request Body:**
  ```json
  {
    "post_content": "Social media post text here"
  }
  ```
- **Response:**
  ```json
  {
    "prediction": <integer>,
    "confidence": <float>,
    "raw_confidence_score": <float>,
    "cleaned_text": "<string>",
    "word_scores": <array or null>
  }
  ```
  - **prediction:** Predicted class (0 or 1 for MLM-related)
  - **confidence:** Confidence percentage (e.g. 95.0)
  - **raw_confidence_score:** Underlying probability (e.g. 0.952335435)
  - **cleaned_text:** Processed text used for analysis
  - **word_scores:** Word-level SHAP scores (if explanations enabled), otherwise `null`

### POST /feedback

- **Purpose:** Receive misclassification feedback.
- **Request Body:** JSON with prediction data (prediction, confidence, cleaned text, etc.)

## Running Tests

Run all tests with:

```bash
pytest
```
