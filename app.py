from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
from utils import preprocess_text

app = Flask(__name__)
CORS(app)

# Load the saved model and vectorizer
model = joblib.load("bow_model.pkl")
vectorizer = joblib.load("bow_vectorizer.pkl")


# Route for analysing
@app.route("/analyse", methods=["POST"])
def predict():
    data = request.json
    post_content = data.get("post_content", "")
    preprocessed_text = preprocess_text(post_content)
    transformed_text = vectorizer.transform([preprocessed_text])
    prediction = model.predict(transformed_text)
    return jsonify({"prediction": prediction[0]})


if __name__ == "__main__":
    app.run(debug=True)
