import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"  # Disable parallelism


from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from predict_BoW import PredictBoW
from predict_BERT import PredictBERT

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app)

# BoW
predictor_BoW = PredictBoW()

# BERT without shap explanations
predictor_BERT_base = PredictBERT(with_explanation=False)

# BERT with shap explanations
predictor_BERT_shap = PredictBERT(with_explanation=True)


# Ping route for health check
@app.route("/ping", methods=["GET"])
def ping():
    print("\nPing received\n")
    return "pong", 200


@app.route("/analyse", defaults={"model_type": "advanced"}, methods=["POST"])
@app.route("/analyse/<model_type>", methods=["POST"])
def predict(model_type):
    data = request.json
    post_content = data.get("post_content", "")

    # Explanations param
    explanations_param = request.args.get("explanations", "false") == "true"
    print("\nReceived post for model:", model_type)
    print("\nExplanations enabled:", explanations_param)
    print("\nPost content:\n", post_content)

    # Predictor based on the model type and explanations flag
    if model_type.upper() == "ADVANCED":
        if explanations_param:
            results = predictor_BERT_shap.predict(post_content)
        else:
            results = predictor_BERT_base.predict(post_content)
    elif model_type.upper() == "BASIC":
        results = predictor_BoW.predict(post_content)

    else:
        results = {"error": "Invalid model type"}

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
    app.run(debug=True, host="localhost", port=4200)
