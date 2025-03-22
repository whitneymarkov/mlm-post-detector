import pytest
from app import app
from utils import example_text


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.url_map.strict_slashes = False
    with app.test_client() as client:
        yield client


def test_analyse_advanced_without_explanation(client, monkeypatch):
    dummy_response = {
        "prediction": 1,
        "confidence": 90.0,
        "raw_confidence_score": 0.9,
        "cleaned_text": "dummy",
        "word_scores": None,
    }
    from predict_BERT import PredictBERT

    monkeypatch.setattr(PredictBERT, "predict", lambda self, text: dummy_response)
    response = client.post(
        "/analyse/advanced", json={"post_content": example_text}, follow_redirects=True
    )
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["prediction"] == 1


def test_analyse_advanced_with_explanation(client, monkeypatch):
    dummy_response = {
        "prediction": 0,
        "confidence": 85.0,
        "raw_confidence_score": 0.85,
        "cleaned_text": "dummy",
        "word_scores": [{"word": "test", "value": 0.1}],
    }
    from predict_BERT import PredictBERT

    monkeypatch.setattr(PredictBERT, "predict", lambda self, text: dummy_response)
    response = client.post(
        "/analyse/advanced?explanations=true",
        json={"post_content": example_text},
        follow_redirects=True,
    )
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["word_scores"] is not None


def test_analyse_basic(client, monkeypatch):
    dummy_response = {
        "prediction": 1,
        "confidence": 95.0,
        "raw_confidence_score": 0.95,
        "cleaned_text": "dummy",
        "word_scores": None,
    }
    import app

    class DummyPredictBoW:
        def predict(self, text):
            return dummy_response

    app.predictor_BoW = DummyPredictBoW()
    response = client.post(
        "/analyse/basic", json={"post_content": example_text}, follow_redirects=True
    )
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["prediction"] == 1


def test_analyse_invalid_model(client):
    response = client.post(
        "/analyse/invalid", json={"post_content": example_text}, follow_redirects=True
    )
    assert response.status_code == 200
    json_data = response.get_json()
    assert "error" in json_data
    assert json_data["error"] == "Invalid model type"


def test_feedback(client):
    feedback_data = {
        "prediction": 1,
        "confidence": 90.0,
        "raw_confidence_score": 0.9,
        "cleaned_text": "dummy",
        "word_scores": None,
    }
    response = client.post("/feedback", json=feedback_data, follow_redirects=True)
    assert response.status_code == 200
    json_data = response.get_json()
    assert "Feedback received" in json_data["message"]
