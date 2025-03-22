import pytest
import pandas as pd
from extract_features import ExtractFeatures
from utils import example_with_hashtags, example_with_icons


def test_compute_metrics_structure():
    ef = ExtractFeatures()
    text = f"Hello WORLD! {example_with_icons} {example_with_hashtags}"
    metrics = ef.compute_metrics(text)
    expected_keys = {
        "word_count",
        "length",
        "upper_char_count",
        "upper_word_count",
        "unicode_letter_count",
        "emoji_count",
        "hashtag_count",
    }
    assert expected_keys.issubset(metrics.keys())


def test_compute_sentiment_score():
    ef = ExtractFeatures()
    pos_text = "I love this product!"
    neg_text = "I hate this product!"
    pos_score = ef.compute_sentiment_score(pos_text)
    neg_score = ef.compute_sentiment_score(neg_text)

    # Verify that positive text yields a positive score
    assert pos_score > 0
    assert neg_score < 0


def test_extract_features_returns_dataframe():
    ef = ExtractFeatures()
    text = f"Hello WORLD! {example_with_icons} {example_with_hashtags}"
    df = ef.extract_features(text)
    assert isinstance(df, pd.DataFrame)

    # Sentiment column is present
    assert "sentiment" in df.columns
