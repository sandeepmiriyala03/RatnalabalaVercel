# api/aksharamala_data.py
#
# Plain data module — NOT a Vercel handler/route. Shared source of
# truth for both aksharamala.py and aksharamala_similar.py.
#
# Splitting this out (instead of importing AKSHARALU from another
# handler file) is deliberate: Vercel's Python builder treats each
# handler file in api/ as its own function to trace and bundle.
# Importing directly from a HANDLER file (aksharamala.py) pulls that
# file's full build context along with it. A plain data-only module
# has no handler class, no side effects, and is much cheaper for the
# builder to include — this is part of what was contributing to the
# oversized build that triggered the EMFILE error.

AKSHARALU = [
    {"id": "s1", "type": "swaralu", "letter": "అ", "word": "అరటి", "image": "/akshara/1.jpg"},
    {"id": "s2", "type": "swaralu", "letter": "ఆ", "word": "ఆవు", "image": "/akshara/2.jpg"},
    {"id": "s3", "type": "swaralu", "letter": "ఇ", "word": "ఇల్లు", "image": "/akshara/3.jpg"},
    {"id": "s4", "type": "swaralu", "letter": "ఈ", "word": "ఈక", "image": "/akshara/4.jpg"},
    {"id": "s5", "type": "swaralu", "letter": "ఉ", "word": "ఉడుత", "image": "/akshara/5.jpg"},
    {"id": "s6", "type": "swaralu", "letter": "ఊ", "word": "ఊయల", "image": "/akshara/6.jpg"},
    {"id": "s7", "type": "swaralu", "letter": "ఋ", "word": "ఋషి"},
    {"id": "s8", "type": "swaralu", "letter": "ౠ", "word": "ౠ"},
    {"id": "s9", "type": "swaralu", "letter": "ఎ", "word": "ఎలుక", "image": "/akshara/7.jpg"},
    {"id": "s10", "type": "swaralu", "letter": "ఏ", "word": "ఏనుగు", "image": "/akshara/8.jpg"},
    {"id": "s11", "type": "swaralu", "letter": "ఐ", "word": "ఐదు", "image": "/akshara/9.jpg"},
    {"id": "s12", "type": "swaralu", "letter": "ఒ", "word": "ఒంటె", "image": "/akshara/10.jpg"},
    {"id": "s13", "type": "swaralu", "letter": "ఓ", "word": "ఓడ", "image": "/akshara/11.jpg"},
    {"id": "s14", "type": "swaralu", "letter": "ఔ", "word": "ఔషధం", "image": "/akshara/12.jpg"},
    {"id": "s15", "type": "swaralu", "letter": "అం", "word": "అంకెలు", "image": "/akshara/13.jpg"},
    {"id": "s16", "type": "swaralu", "letter": "అః", "word": "అంతఃపురం"},
    {"id": "v1", "type": "vyanjanalu", "letter": "క", "word": "కప్ప", "image": "/akshara/14.jpg"},
    {"id": "v2", "type": "vyanjanalu", "letter": "ఖ", "word": "ఖడ్గం", "image": "/akshara/15.jpg"},
    {"id": "v3", "type": "vyanjanalu", "letter": "గ", "word": "గడియారం", "image": "/akshara/16.jpg"},
    {"id": "v4", "type": "vyanjanalu", "letter": "ఘ", "word": "ఘంట", "image": "/akshara/17.jpg"},
    {"id": "v5", "type": "vyanjanalu", "letter": "ఙ", "word": "జ్ఞానము"},
    {"id": "v6", "type": "vyanjanalu", "letter": "చ", "word": "చక్రము", "image": "/akshara/18.jpg"},
    {"id": "v7", "type": "vyanjanalu", "letter": "ఛ", "word": "ఛత్రము", "image": "/akshara/19.jpg"},
    {"id": "v8", "type": "vyanjanalu", "letter": "జ", "word": "జడ", "image": "/akshara/20.jpg"},
    {"id": "v9", "type": "vyanjanalu", "letter": "ఝ", "word": "ఝషము", "image": "/akshara/21.jpg"},
    {"id": "v10", "type": "vyanjanalu", "letter": "ఞ", "word": "ఞ"},
    {"id": "v11", "type": "vyanjanalu", "letter": "ట", "word": "టపాకాయ", "image": "/akshara/22.jpg"},
    {"id": "v12", "type": "vyanjanalu", "letter": "ఠ", "word": "కంఠము", "image": "/akshara/23.jpg"},
    {"id": "v13", "type": "vyanjanalu", "letter": "డ", "word": "డప్పు", "image": "/akshara/24.jpg"},
    {"id": "v14", "type": "vyanjanalu", "letter": "ఢ", "word": "ఢంకా", "image": "/akshara/25.jpg"},
    {"id": "v15", "type": "vyanjanalu", "letter": "ణ", "word": "వీణ", "image": "/akshara/26.jpg"},
    {"id": "v16", "type": "vyanjanalu", "letter": "త", "word": "తల", "image": "/akshara/27.jpg"},
    {"id": "v17", "type": "vyanjanalu", "letter": "థ", "word": "రథము", "image": "/akshara/28.jpg"},
    {"id": "v18", "type": "vyanjanalu", "letter": "ద", "word": "దంతము", "image": "/akshara/29.jpg"},
    {"id": "v19", "type": "vyanjanalu", "letter": "ధ", "word": "ధనుస్సు", "image": "/akshara/30.jpg"},
    {"id": "v20", "type": "vyanjanalu", "letter": "న", "word": "నత్త", "image": "/akshara/31.jpg"},
    {"id": "v21", "type": "vyanjanalu", "letter": "ప", "word": "పడవ", "image": "/akshara/32.jpg"},
    {"id": "v22", "type": "vyanjanalu", "letter": "ఫ", "word": "ఫలము", "image": "/akshara/33.jpg"},
    {"id": "v23", "type": "vyanjanalu", "letter": "బ", "word": "బండి", "image": "/akshara/34.jpg"},
    {"id": "v24", "type": "vyanjanalu", "letter": "భ", "word": "భవనము", "image": "/akshara/35.jpg"},
    {"id": "v25", "type": "vyanjanalu", "letter": "మ", "word": "మద్దెల", "image": "/akshara/36.jpg"},
    {"id": "v26", "type": "vyanjanalu", "letter": "య", "word": "యంత్రము", "image": "/akshara/37.jpg"},
    {"id": "v27", "type": "vyanjanalu", "letter": "ర", "word": "రంగులు", "image": "/akshara/38.jpg"},
    {"id": "v28", "type": "vyanjanalu", "letter": "ల", "word": "లత", "image": "/akshara/39.jpg"},
    {"id": "v29", "type": "vyanjanalu", "letter": "వ", "word": "వల", "image": "/akshara/40.jpg"},
    {"id": "v30", "type": "vyanjanalu", "letter": "శ", "word": "శంఖము", "image": "/akshara/41.jpg"},
    {"id": "v31", "type": "vyanjanalu", "letter": "ష", "word": "షట్పదము", "image": "/akshara/42.jpg"},
    {"id": "v32", "type": "vyanjanalu", "letter": "స", "word": "సంచి", "image": "/akshara/43.jpg"},
    {"id": "v33", "type": "vyanjanalu", "letter": "హ", "word": "హంస", "image": "/akshara/44.jpg"},
    {"id": "v34", "type": "vyanjanalu", "letter": "ళ", "word": "తాళము", "image": "/akshara/45.jpg"},
    {"id": "v35", "type": "vyanjanalu", "letter": "క్ష", "word": "వృక్షము"},
    {"id": "v36", "type": "vyanjanalu", "letter": "ఱ", "word": "ఱంపము"},
]