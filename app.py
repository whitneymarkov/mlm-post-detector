from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from clean_text import CleanText
from extract_features import ExtractFeatures
from scipy.sparse import hstack, csr_matrix
from transformers import AutoModelForSequenceClassification, AutoTokenizer

app = Flask(__name__)
CORS(app)

# For BoW model:
model = joblib.load("models/BoW/bow_model.pkl")
vectorizer = joblib.load("models/BoW/bow_vectorizer.pkl")

# For BERT model, using Hugging Face:
bert_model = AutoModelForSequenceClassification.from_pretrained("./models/BERT/model")
bert_tokenizer = AutoTokenizer.from_pretrained("./models/BERT/tokenizer")

# Initialize the CleanText class
preprocessor_bow = CleanText(for_ml_pipeline=True)  # BoW
preprocessor_bert = CleanText(for_ml_pipeline=False)  # BERT

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

    # Clean text for BERT
    cleaned_text = preprocessor_bert.clean_text(post_content)

    # Tokenize the cleaned text
    inputs = bert_tokenizer(
        cleaned_text, return_tensors="pt", padding=True, truncation=True
    )

    # Get logits
    import torch

    with torch.no_grad():
        outputs = bert_model(**inputs)

    # Get probabilities
    import torch.nn.functional as F

    probs = F.softmax(outputs.logits, dim=1).detach().numpy()

    prediction = int(probs.argmax(axis=1)[0])

    return jsonify({"prediction": prediction})


if __name__ == "__main__":
    app.run(debug=True)
