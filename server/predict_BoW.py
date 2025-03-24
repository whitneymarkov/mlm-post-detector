import joblib
import numpy as np
from clean_text import CleanText
from extract_features import ExtractFeatures
from scipy.sparse import hstack, csr_matrix
from utils import example_text


class PredictBoW:
    def __init__(self, model=None, vectorizer=None, preprocessor=None, extractor=None):
        self.model = (
            model if model is not None else joblib.load("models/BoW/bow_model.pkl")
        )
        self.vectorizer = (
            vectorizer
            if vectorizer is not None
            else joblib.load("models/BoW/bow_vectorizer.pkl")
        )
        self.preprocessor = (
            preprocessor
            if preprocessor is not None
            else CleanText(for_ml_pipeline=True)
        )
        self.extractor = extractor if extractor is not None else ExtractFeatures()

    def transform(self, text):
        # Extract numeric features
        numeric_features_df = self.extractor.extract_features(text)

        # Clean
        cleaned_text = self.preprocessor.clean_text(text)

        # Vectorise
        text_vector = self.vectorizer.transform([cleaned_text])

        # Convert numeric features df to a sparse matrix
        numeric_sparse = csr_matrix(numeric_features_df.values)

        # Stack the text vector with the numeric features
        final_vector = hstack([text_vector, numeric_sparse])
        return final_vector, cleaned_text

    def predict(self, text):
        final_vector, cleaned_text = self.transform(text)
        prediction = int(self.model.predict(final_vector)[0])
        probabilities = self.model.predict_proba(final_vector)
        probability = float(probabilities[0, 1])
        confidence = (
            round(probability * 100, 2)
            if prediction == 1
            else round((1 - probability) * 100, 2)
        )
        return {
            "prediction": prediction,
            "confidence": confidence,
            "raw_confidence_score": probability,
            "cleaned_text": cleaned_text,
            "word_scores": None,
        }
