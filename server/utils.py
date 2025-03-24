import regex as re
import nltk
from nltk.corpus import stopwords
import emoji

# Word regex
word_regex = re.compile(r"\w+")

# Uppercase regex (Unicode aware)
upper_word_regex = re.compile(r"\b\p{Lu}+\b", re.UNICODE)

# Emoji regex
emojis = sorted(emoji.EMOJI_DATA, key=len, reverse=True)
emoji_pattern = "(" + "|".join(re.escape(e) for e in emojis) + ")"
emoji_regex = re.compile(emoji_pattern)

# Unicode regex (excluding emojis)
unicode_letter_regex = re.compile(r"\p{L}", re.UNICODE)
unicode_word_regex = re.compile(r"\b[\p{L}]+\b", re.UNICODE)

# Hashtag regex
hashtag_regex = re.compile(r"(#[\w]+)")


negation_exceptions = {"not", "no", "never", "cannot"}
stopwords_list = set(stopwords.words("english")) - negation_exceptions

example_text = ".\n𝙄𝙉𝘾𝙊𝙈𝙄𝙉𝙂… 𝗦𝗨𝗠𝗠𝗘𝗥 𝗕𝗢𝗗𝗜𝗘𝗦 🔥🔥🔥\n\n28 ELEVATE - The GTC's 28 Day Elevate Challenge!\n\n⁣28 Days of full accountability on your program, ticking off your health & wellness goals & always finding a new ⁣level!\n\nWE'VE GOT YOUR BACK 🙌🏻\n\nChallenge starts 23RD OCTOBER!\n\nAs you guys already know... we love to elevate & get the best out of ourselves. So what better way to finish 2023 and keep striving for new goals!⁣\n\nIf this is your first challenge... just you wait!⁣\n\n💻 Private Facebook Group⁣\n\n💪🏼 At-Home Workouts⁣\n\n💡 Facebook Live Q&A's⁣\n\n📕 Recipe Book⁣\n\n📈 Goal Setting Blueprint⁣\n\n🥙 Fakeaway Nights⁣\n\n𝘈𝘕𝘕𝘕𝘕𝘋𝘋𝘋... 𝘈𝘞𝘌𝘚𝘖𝘔𝘌 𝘗𝘙𝘐𝘡𝘌𝘚 𝘍𝘖𝘙 𝘛𝘏𝘌 𝘞𝘐𝘕𝘕𝘌𝘙𝘚 🙌🏼⁣\n\nWho is joining me?!!\nReach out for more info!\n\n#choosewellness #28daychallenge #weightloss #musclegain #slayyourgoals #areyourready #overallwellness #healthylifestyle #healthylifestylehabits #letsdothis #thechallengeison #livethelifeyouchoose #elevate #28elevate #incomingsummerbody"

example_with_unicode = "𝙄𝙉𝘾𝙊𝙈𝙄𝙉𝙂… 𝗦𝗨𝗠𝗠𝗘𝗥 𝗕𝗢𝗗𝗜𝗘𝗦"
example_with_icons = "🔥💻📕"
example_with_ZWJ_icons = "🏳️‍🌈🏴‍☠️💏"
example_with_hashtags = "#28daychallenge #weightloss #musclegain #slayyourgoals"
example_with_stopwords = "I am going to the store today because I want to."
example_with_negation = "I am not going to the store today because I don't want to."
example_with_newline = "This is a test.\nThis is a new line."
example_with_punctuation = "Hello, world! This is a test."
example_with_mentions = "@user1 @user2 @user3"
example_with_urls = "Check out this link: https://www.example.com"
example_with_double_whitespace = "This  is  a  test."
