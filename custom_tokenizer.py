from nltk.tokenize import TweetTokenizer
from nltk.tokenize.casual import REGEXPS  # Import original regex patterns
from utils import emoji_regex


class CustomTweetTokenizer(TweetTokenizer):
    def __init__(
        self,
        preserve_case=True,
        reduce_len=False,
        strip_handles=False,
        match_phone_numbers=True,
    ):
        super().__init__(
            preserve_case=preserve_case,
            reduce_len=reduce_len,
            strip_handles=strip_handles,
            match_phone_numbers=match_phone_numbers,
        )
        self._WORD_RE = None

    def tokenize(self, text):
        emoji_matches = emoji_regex.findall(text)

        cleaned_text = emoji_regex.sub(" EMOJI_PLACEHOLDER ", text)

        tokens = super().tokenize(cleaned_text)

        final_tokens = []
        emoji_index = 0

        for token in tokens:
            if token == "EMOJI_PLACEHOLDER":
                final_tokens.append(emoji_matches[emoji_index])
                emoji_index += 1
            else:
                final_tokens.append(token)

        return final_tokens
