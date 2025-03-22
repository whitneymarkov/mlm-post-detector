import pytest
from utils import (
    word_regex,
    upper_word_regex,
    emoji_regex,
    hashtag_regex,
    example_with_hashtags,
    example_with_punctuation,
    example_with_icons,
    example_with_ZWJ_icons,
)


def test_word_regex():
    words = word_regex.findall(example_with_punctuation)
    assert "Hello" in words and "world" in words


def test_upper_word_regex():
    text = "THIS is a TEST"
    upper_words = upper_word_regex.findall(text)
    assert "THIS" in upper_words and "TEST" in upper_words


def test_emoji_regex():
    emojis_found = emoji_regex.findall(f"{example_with_icons} {example_with_ZWJ_icons}")
    assert "🔥" in emojis_found
    assert "🏳️‍🌈" in emojis_found


def test_hashtag_regex():
    hashtags = hashtag_regex.findall(example_with_hashtags)
    assert any(tag.startswith("#") for tag in hashtags)
