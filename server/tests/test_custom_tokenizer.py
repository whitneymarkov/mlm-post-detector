import pytest
from custom_tokenizer import CustomTweetTokenizer
from utils import example_with_ZWJ_icons, example_with_hashtags


def test_tokenize_with_emoji():
    tokenizer = CustomTweetTokenizer()
    tokens = tokenizer.tokenize(example_with_ZWJ_icons)
    # Ensure ZWJ emoji is not lost
    assert "🏳️‍🌈" in tokens


def test_tokenize_handles_placeholders():
    # When an emoji or hashtag is replaced with a placeholder, the tokeniser should substitute it back
    text = f"{example_with_ZWJ_icons} {example_with_hashtags}"
    tokenizer = CustomTweetTokenizer()
    tokens = tokenizer.tokenize(text)

    assert any(token == "🏳️‍🌈" for token in tokens)
    assert any(token == "#28daychallenge" for token in tokens)
