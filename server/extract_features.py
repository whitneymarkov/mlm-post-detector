import emoji
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from utils import (
    emoji_regex,
    hashtag_regex,
    word_regex,
    upper_word_regex,
    unicode_letter_regex,
    example_text,
)
import pandas as pd


class ExtractFeatures:
    def __init__(self):
        # Initialise VADER
        self.analyser = SentimentIntensityAnalyzer()

    def compute_metrics(self, text):

        # Extract all emojis
        emojis_used = emoji_regex.findall(text)

        # Remove duplicate emojis
        unique_emojis_used = list(set(emojis_used))

        # Remove emoji components (ZWJ parts, variation selectors, flags that aren't full emojis)
        unique_emojis_used = [e for e in unique_emojis_used if e in emoji.EMOJI_DATA]

        # Extract hashtags
        hashtags_used = hashtag_regex.findall(text)

        return {
            "word_count": len(word_regex.findall(text)),
            "length": len(text),
            "upper_char_count": sum(1 for c in text if c.isupper()),
            "upper_word_count": len(upper_word_regex.findall(text)),
            "unicode_letter_count": sum(
                1
                for c in text
                if unicode_letter_regex.match(c) and not emoji_regex.search(c)
            ),
            "emoji_count": len(emojis_used),
            "hashtag_count": len(hashtags_used),
        }

    def compute_sentiment_score(self, text):
        ## VADER
        compound_score = self.analyser.polarity_scores(text)["compound"]

        return compound_score

    def extract_features(self, content):
        # Extracts all features (numeric metrics and sentiment score) and returns a df
        metrics = self.compute_metrics(content)
        sentiment = self.compute_sentiment_score(content)
        metrics["sentiment"] = sentiment

        return pd.DataFrame([metrics])
