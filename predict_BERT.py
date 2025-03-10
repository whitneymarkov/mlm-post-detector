from clean_text import CleanText
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import shap
from utils import example_text
import math


class PredictBERT:
    def __init__(self, with_explanation=False):
        self.cleaner = CleanText(for_ml_pipeline=False)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            "./models/BERT/model"
        )
        self.tokenizer = AutoTokenizer.from_pretrained("./models/BERT/tokenizer")
        self.with_explanation = with_explanation

        if self.with_explanation:
            self.explainer = shap.Explainer(self.predict_probabilities, self.tokenizer)

    def predict_probabilities(self, texts):
        # Ensure the input is a list of strings
        texts = list(texts)

        # Tokenise batch of texts to tensors
        encodings = self.tokenizer(
            texts, padding=True, truncation=True, return_tensors="pt"
        )

        # Run model
        with torch.no_grad():
            outputs = self.model(**encodings)

        logits = outputs.logits  # shape: [batch_size, num_classes]

        # Convert to probabilities
        probs = torch.nn.functional.softmax(logits, dim=1).numpy()
        return probs[:, 1]

    def get_word_level_shap(self, sample_text, shap_values):
        # Tokenise with offsets to map back to original words
        enc = self.tokenizer(
            sample_text,
            return_offsets_mapping=True,
            return_tensors="pt",
            truncation=True,
        )
        tokens = self.tokenizer.convert_ids_to_tokens(enc["input_ids"][0])
        offsets = enc["offset_mapping"][0].tolist()
        token_shap_vals = shap_values.values[0]

        # Merge tokens based on offsets
        merged_words = []
        current_word = ""
        current_shap = 0.0
        current_start = None
        current_end = None

        for idx, (start, end) in enumerate(offsets):
            if start == end:
                continue
            token_text = sample_text[start:end]
            token_shap = token_shap_vals[idx]
            if current_end is None or start != current_end:
                # Not contiguous with previous token: start a new word
                if current_word:
                    merged_words.append(
                        {"word": current_word, "value": round(current_shap, 2)}
                    )
                current_word = token_text
                current_shap = token_shap
                current_start = start
                current_end = end
            else:
                # Contiguous: merge with current word
                current_word += token_text
                current_shap += token_shap
                current_end = end

        # Append the final word
        if current_word:
            merged_words.append({"word": current_word, "value": round(current_shap, 2)})

        # Handle hashtags
        final_word_scores = []
        skip_next = set()
        for i, word_info in enumerate(merged_words):
            word = word_info["word"]
            # Merge hashtags (if '#' is a standalone token and the next word exists)
            if word == "#" and i + 1 < len(merged_words):
                next_word = merged_words[i + 1]["word"]
                combined_word = "#" + next_word
                combined_value = round(
                    word_info["value"] + merged_words[i + 1]["value"], 2
                )
                final_word_scores.append(
                    {"word": combined_word, "value": combined_value}
                )
                skip_next.add(i + 1)
            elif i in skip_next:
                continue
            else:
                final_word_scores.append(word_info)

        return final_word_scores

    def predict(self, text):
        cleaned_text = self.cleaner.clean_text(text)
        probability = float(self.predict_probabilities([cleaned_text])[0])
        prediction = int(probability > 0.5)
        confidence = (
            round(probability * 100, 2)
            if prediction == 1
            else round((1 - probability) * 100, 2)
        )

        if self.with_explanation:
            shap_values = self.explainer([cleaned_text])
            word_level_scores = self.get_word_level_shap(cleaned_text, shap_values)
            return {
                "prediction": prediction,
                "confidence": confidence,
                "raw_confidence_score": probability,
                "cleaned_text": cleaned_text,
                "word_scores": word_level_scores,
            }
        else:
            return {
                "prediction": prediction,
                "confidence": confidence,
                "raw_confidence_score": probability,
                "cleaned_text": cleaned_text,
                "word_scores": None,
            }
