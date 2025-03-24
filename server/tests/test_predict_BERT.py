import pytest
import torch
from predict_BERT import PredictBERT
from utils import example_text


# Dummy model returns fixed logits
class DummyModel:
    def __call__(self, **kwargs):
        batch_size = kwargs["input_ids"].shape[0]
        logits = torch.tensor([[0.2, 0.8]] * batch_size)
        return type("DummyOutput", (object,), {"logits": logits})


# Dummy tokeniser returns a dummy offset mapping
class DummyTokenizer:
    def __call__(self, text, **kwargs):
        if kwargs.get("return_offsets_mapping", False):
            return {
                "input_ids": torch.tensor([[1, 2, 3]]),
                "offset_mapping": torch.tensor([[(0, 4), (4, 8), (8, 12)]]),
            }
        return {"input_ids": torch.tensor([[1, 2, 3]])}

    def convert_ids_to_tokens(self, ids):
        return ["[CLS]", "test", "[SEP]"]


# Dummy shap explainer
class DummyShap:
    def __init__(self):
        self.values = [[0.1, 0.2, 0.3]]


class DummyExplainer:
    def __call__(self, texts):
        return DummyShap()


@pytest.fixture
def dummy_predict_bert(monkeypatch):
    pb = PredictBERT(with_explanation=True)
    pb.model = DummyModel()
    pb.tokenizer = DummyTokenizer()
    pb.explainer = DummyExplainer()
    return pb


def test_predict_with_explanation(dummy_predict_bert):
    result = dummy_predict_bert.predict(example_text)

    # Explanations are returned and cleaned text is non-empty
    assert result["word_scores"] is not None
    assert result["cleaned_text"]
