import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.tokenize import RegexpTokenizer
import emoji


def is_emoji(token):
    return any(char in emoji.EMOJI_DATA for char in token)


def is_hashtag(token):
    return token.startswith("#") and any(ch.isalnum() for ch in token[1:])


def preprocess_text(text):
    text = text.replace("\\n", "\n")  # convert literal \n to newline
    text = re.sub(r"\s+", " ", text)  # normalise whitespace
    text = text.lower()  # lowercase
    text = re.sub(r"@\w+", "", text)  # remove mentions

    tokenizer = RegexpTokenizer(r"#[\w]+|\w+|\S")
    tokens = tokenizer.tokenize(text)
    stop_words = set(stopwords.words("english"))

    processed_tokens = []
    for token in tokens:
        if is_emoji(token):
            processed_tokens.append(token)  # preserve emojis
        elif is_hashtag(token):
            processed_tokens.append(token)  # preserve hashtags
        elif token.isalnum() and token not in stop_words:
            processed_tokens.append(token)  # remove numbers

    return " ".join(processed_tokens).strip()
