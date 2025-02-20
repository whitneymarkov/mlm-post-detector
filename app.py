from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from clean_text import CleanText
from extract_features import ExtractFeatures
from scipy.sparse import hstack, csr_matrix

app = Flask(__name__)
CORS(app)

# Load the saved model and vectorizer
model = joblib.load("models/BoW/bow_model.pkl")
vectorizer = joblib.load("models/BoW/bow_vectorizer.pkl")

# Initialize the CleanText class
preprocessor_fast = CleanText(for_ml_pipeline=True)  # BoW
preprocessor_slow = CleanText(for_ml_pipeline=False)  # BERT

# Feature extractor for BoW
extractor = ExtractFeatures()


# Route for analysing
@app.route("/analyse", methods=["POST"])
def predict():
    data = request.json
    post_content = data.get("post_content", "")

    # Extract numeric features into a one-row df
    numeric_features_df = extractor.extract_features(post_content)

    # Clean the text for BoW
    cleaned_text = preprocessor_fast.clean_text(post_content)

    # Transform the cleaned text using vectorizer
    text_vector = vectorizer.transform([cleaned_text])

    # Convert numeric features df to a sparse matrix
    numeric_sparse = csr_matrix(numeric_features_df.values)

    # Stack the text vector with the numeric features
    final_vector = hstack([text_vector, numeric_sparse])

    prediction = model.predict(final_vector)
    return jsonify({"prediction": int(prediction[0])})


if __name__ == "__main__":
    app.run(debug=True)
