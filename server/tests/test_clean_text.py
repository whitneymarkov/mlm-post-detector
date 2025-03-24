import pytest
from clean_text import CleanText
from utils import (
    example_with_urls,
    example_with_mentions,
    example_with_hashtags,
    example_with_punctuation,
)


def test_preserve_and_restore_tokens():
    # Combine hashtag and punctuation examples
    text = f"{example_with_hashtags} {example_with_punctuation}"
    preserved, placeholders = CleanText.preserve_tokens(text)

    for placeholder in placeholders:
        assert placeholder in preserved
    restored = CleanText.restore_tokens(preserved, placeholders)

    # Ensure that each token from the hashtag example appears
    for token in example_with_hashtags.split():
        assert token in restored


def test_remove_symbols_without_pipeline():
    text = f"{example_with_punctuation} {example_with_mentions}?"
    ct = CleanText(for_ml_pipeline=False)
    cleaned = ct.remove_symbols(text)

    # Exclamation and question marks should be preserved
    assert "!" in cleaned and "?" in cleaned

    # Standard words are still present
    assert "Hello" in cleaned


def test_clean_text_without_pipeline():
    text = f"{example_with_urls} {example_with_mentions} {example_with_hashtags}"
    ct = CleanText(for_ml_pipeline=False)
    cleaned = ct.clean_text(text)

    # Mentions and URLs should be removed
    assert "https://" not in cleaned
    assert "@" not in cleaned

    # Hashtags should remain
    for hashtag in example_with_hashtags.split():
        assert hashtag in cleaned


def test_clean_text_for_pipeline_lowercases():
    ct = CleanText(for_ml_pipeline=True)
    text = example_with_punctuation.upper()
    cleaned = ct.clean_text(text)

    # Output should be entirely lowercased
    assert cleaned == cleaned.lower()
