import regex as re
from unidecode import unidecode
from nltk.stem import WordNetLemmatizer
from custom_tokenizer import CustomTweetTokenizer
import emoji
from utils import emoji_regex, hashtag_regex, stopwords_list


class CleanText:
    def __init__(self, for_ml_pipeline=False):
        self.for_ml_pipeline = for_ml_pipeline
        self.lemmatizer = WordNetLemmatizer()

    @staticmethod
    def is_emoji(token):
        return any(char in emoji.EMOJI_DATA for char in token)

    @staticmethod
    def is_hashtag(token):
        return token.startswith("#") and any(ch.isalnum() for ch in token[1:])

    @staticmethod
    def preserve_tokens(text):
        placeholders = {}
        token_id = 0

        def replace_hashtag(match):
            nonlocal token_id
            token = match.group(0)
            placeholder = f"XHT{token_id}X"  # Safe placeholder for hashtags
            placeholders[placeholder] = token
            token_id += 1
            return placeholder

        text = re.sub(hashtag_regex, replace_hashtag, text)

        def replace_emoji(match):
            nonlocal token_id
            token = match.group(0)
            placeholder = f"XEMOJI{token_id}X"  # Safe placeholder for emojis
            placeholders[placeholder] = token
            token_id += 1
            return placeholder

        text = emoji_regex.sub(replace_emoji, text)
        return text, placeholders

    @staticmethod
    def restore_tokens(text, placeholders):
        for placeholder, token in placeholders.items():
            text = text.replace(placeholder, token)
        return text

    def remove_symbols(self, text):
        # Remove unwanted symbols, preserve !, ?, ', -, (, ), periods and commas (avoiding placeholders XHTX/XEMOJIX)
        text = re.sub(r"[^\w\s#'!?\-.,!?()]", "", text)

        if self.for_ml_pipeline:
            # Replace repeated occurrences of the same symbol (except placeholders) !!! → !
            text = re.sub(r"([!?'-])\1+", r"\1", text)

            # Remove standalone symbols (not attached to words)
            text = re.sub(r"(?<!\w)[.,!?()-]+(?!\w)", "", text)

        return text

    def clean_text(self, text):
        # Replace newlines
        text = text.replace("\\n", " ")

        # Remove mentions
        text = re.sub(r"@\w+", "", text)

        # Remove URLs
        text = re.sub(
            r"(https?://|www\.)[\w.-]+(?:\.[a-zA-Z]{2,})+(?:/[^\s]*)?", "", text
        )

        # Protect hashtags and emojis using safe placeholders for unidecode and symbol removal
        text_with_placeholders, placeholders = self.preserve_tokens(text)

        # Run unidecode
        decoded_text = unidecode(text_with_placeholders)

        # Remove symbols
        symbols_removed = self.remove_symbols(decoded_text)

        # Restore original hashtags and emojis
        restored_text = self.restore_tokens(symbols_removed, placeholders)

        # Custom TweetTokenizer (preserves emojis, hashtags, and contractions)
        tokens = CustomTweetTokenizer(strip_handles=False, reduce_len=True).tokenize(
            restored_text
        )

        processed_tokens = []
        for token in tokens:
            if self.is_emoji(token):
                processed_tokens.append(token)  # preserve emojis
            elif self.is_hashtag(token):
                processed_tokens.append(token)  # preserve hashtags
            else:
                # Apply lemmatisation & stopword removal only if for ML pipeline
                if self.for_ml_pipeline:
                    lemmatised_token = self.lemmatizer.lemmatize(token)
                    if lemmatised_token.lower() not in stopwords_list:
                        processed_tokens.append(lemmatised_token)
                else:
                    # Keep original token for sentiment analysis and transformer models
                    processed_tokens.append(token)

        processed_text = " ".join(processed_tokens)
        if self.for_ml_pipeline:
            processed_text = processed_text.lower()

        # Normalise multiple spaces
        final_text = re.sub(r"\s+", " ", processed_text).strip()

        return final_text
