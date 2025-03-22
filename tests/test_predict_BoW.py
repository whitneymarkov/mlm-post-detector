import pytest
from scipy.sparse import csr_matrix
import joblib
import importlib
import numpy as np
from utils import example_text


# Dummy model returns fixed predictions
class DummyModel:
    def predict(self, X):
        return [1]

    def predict_proba(self, X):
        # Probability vals
        return np.array([[0.05, 0.95]])


class DummyVectorizer:
    def transform(self, texts):
        return csr_matrix([[1, 2]])


def dummy_load(path):
    if "bow_model" in path:
        return DummyModel()
    elif "bow_vectorizer" in path:
        return DummyVectorizer()
    raise ValueError(f"Unexpected path: {path}")


# Monkey-patch joblib.load
joblib.load = dummy_load
import predict_BoW

importlib.reload(predict_BoW)
from predict_BoW import PredictBoW


def test_predict_bow():
    pb = PredictBoW()
    result = pb.predict(example_text)
    assert result["prediction"] == 1
    assert result["confidence"] == 95.0
    assert isinstance(result["cleaned_text"], str) and result["cleaned_text"]
