import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"  # Disable parallelism


from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from clean_text import CleanText
from extract_features import ExtractFeatures
from scipy.sparse import hstack, csr_matrix
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import torch.nn.functional as F
import shap
from predict_BERT import PredictBERT

app = Flask(__name__)
CORS(app)

# For BoW model:
model = joblib.load("models/BoW/bow_model.pkl")
vectorizer = joblib.load("models/BoW/bow_vectorizer.pkl")

# For BERT model, using Hugging Face:
bert_model = AutoModelForSequenceClassification.from_pretrained("./models/BERT/model")
bert_tokenizer = AutoTokenizer.from_pretrained("./models/BERT/tokenizer")

# Initialise the CleanText class for BoW
preprocessor_bow = CleanText(for_ml_pipeline=True)

# BERT without shap explanations
predictor_BERT_base = PredictBERT(with_explanation=False)

# BERT with shap explanations
predictor_BERT_shap = PredictBERT(with_explanation=True)

# Feature extractor for BoW
extractor = ExtractFeatures()


# Route for analysing using the BoW model
# @app.route("/analyse-fast", methods=["POST"])
# def predict_fast():
#     data = request.json
#     post_content = data.get("post_content", "")

#     # Extract numeric features into a one-row df
#     numeric_features_df = extractor.extract_features(post_content)

#     # Clean the text for BoW
#     cleaned_text = preprocessor_bow.clean_text(post_content)

#     # Transform the cleaned text using vectorizer
#     text_vector = vectorizer.transform([cleaned_text])

#     # Convert numeric features df to a sparse matrix
#     numeric_sparse = csr_matrix(numeric_features_df.values)

#     # Stack the text vector with the numeric features
#     final_vector = hstack([text_vector, numeric_sparse])

#     prediction = model.predict(final_vector)
#     return jsonify({"prediction": int(prediction[0])})


# Route for analysing using the trained BERT model
@app.route("/analyse", methods=["POST"])
def predict_slow():
    data = request.json
    post_content = data.get("post_content", "")
    print("\nReceived post:\n", post_content)

    results = predictor_BERT_shap.predict(post_content)

    # Print the results without the word scores
    results_without_word_scores = {
        k: v for k, v in results.items() if k != "word_scores"
    }
    print("\nResults:")
    for key, value in results_without_word_scores.items():
        print(f"{key}: {value}")

    return jsonify(results)


# Route for receiving misclassification feedback
@app.route("/feedback", methods=["POST"])
def receive_feedback():
    data = request.json

    # Extract the values
    prediction = data.get("prediction")
    confidence = data.get("confidence")
    raw_confidence_score = data.get("raw_confidence_score")
    cleaned_text = data.get("cleaned_text")
    word_scores = data.get("word_scores")

    # TODO: Save the feedback to a database or file for further analysis.

    # Log the feedback.
    print("\nMisclassification feedback received:")
    print("Prediction:", prediction)
    print("Confidence:", confidence)
    print("Raw confidence score:", raw_confidence_score)
    print("Cleaned text:", cleaned_text)

    return jsonify({"message": "Feedback received"}), 200


if __name__ == "__main__":
    app.run(debug=True)
