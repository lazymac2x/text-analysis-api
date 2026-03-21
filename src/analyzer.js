// ─── Text Analysis Engine (fully rule-based, no ML/AI APIs) ─────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// WORD LISTS
// ═══════════════════════════════════════════════════════════════════════════════

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','wonderful','fantastic','awesome','outstanding',
  'superb','brilliant','love','happy','joy','delight','pleasant','beautiful','perfect',
  'best','better','nice','fine','cool','incredible','remarkable','magnificent','splendid',
  'terrific','marvelous','fabulous','superior','exceptional','impressive','positive',
  'fortunate','lucky','pleased','glad','cheerful','grateful','thankful','exciting',
  'inspired','hopeful','optimistic','confident','proud','satisfied','comfortable',
  'peaceful','calm','relaxed','enjoy','enjoyed','enjoying','like','liked','recommend',
  'recommended','success','successful','win','winner','winning','achieve','achieved',
  'benefit','beneficial','improve','improved','improvement','effective','efficient',
  'elegant','easy','simple','clean','clear','bright','vibrant','fresh','innovative',
  'creative','generous','kind','friendly','warm','helpful','valuable','useful',
  'meaningful','significant','worthy','reliable','trustworthy','honest','genuine',
  'authentic','delicious','tasty','healthy','strong','powerful','fast','quick','smart',
  'clever','wise','talented','skilled','professional','quality','premium','elite',
  'top','leading','advanced','modern','popular','favorite','ideal','paradise',
]);

const NEGATIVE_WORDS = new Set([
  'bad','terrible','horrible','awful','worst','worse','poor','ugly','hate','hated',
  'angry','anger','sad','sadness','depressed','depressing','miserable','unhappy',
  'disappointed','disappointing','frustrating','frustrated','annoying','annoyed',
  'boring','bored','dull','stupid','dumb','idiot','fool','foolish','ridiculous',
  'pathetic','useless','worthless','meaningless','pointless','waste','wasted',
  'fail','failed','failure','mistake','error','wrong','broken','damaged','ruined',
  'destroyed','disaster','catastrophe','crisis','problem','trouble','difficult',
  'hard','complex','complicated','confusing','confused','messy','dirty','nasty',
  'gross','disgusting','sick','ill','pain','painful','hurt','suffering','struggle',
  'stress','stressful','anxious','anxiety','worried','worry','fear','scared','afraid',
  'dangerous','threat','risk','risky','weak','slow','lazy','careless','reckless',
  'selfish','greedy','cruel','harsh','rough','violent','aggressive','hostile',
  'negative','pessimistic','hopeless','helpless','lonely','isolated','ignored',
  'rejected','abandoned','lost','missing','lacking','shortage','deficit','debt',
  'expensive','overpriced','cheap','fake','fraud','scam','lie','lied','lying',
  'corrupt','toxic','poison','deadly','fatal','kill','death','die','died',
]);

const NEGATION_WORDS = new Set([
  'not','no','never','neither','nobody','nothing','nowhere','nor',
  "don't","doesn't","didn't","won't","wouldn't","couldn't","shouldn't",
  "isn't","aren't","wasn't","weren't","hasn't","haven't","hadn't",
  'cannot','barely','hardly','scarcely','seldom','rarely',
]);

const INTENSIFIERS = {
  'very': 1.5, 'really': 1.5, 'extremely': 2.0, 'incredibly': 2.0,
  'absolutely': 2.0, 'totally': 1.8, 'completely': 1.8, 'utterly': 2.0,
  'highly': 1.5, 'deeply': 1.5, 'truly': 1.5, 'remarkably': 1.8,
  'exceptionally': 1.8, 'particularly': 1.3, 'especially': 1.3,
  'quite': 1.2, 'rather': 1.1, 'somewhat': 0.7, 'slightly': 0.5,
  'barely': 0.3, 'hardly': 0.3, 'a bit': 0.5, 'a little': 0.5,
  'so': 1.5, 'too': 1.3, 'super': 1.8, 'mega': 2.0,
};

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','been','be','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need','must',
  'ought','i','me','my','mine','we','us','our','ours','you','your','yours','he',
  'him','his','she','her','hers','it','its','they','them','their','theirs','this',
  'that','these','those','what','which','who','whom','whose','where','when','how',
  'why','all','each','every','both','few','more','most','other','some','such','no',
  'not','only','own','same','so','than','too','very','just','about','above','after',
  'again','against','also','am','any','because','before','below','between','during',
  'further','here','into','itself','myself','off','once','out','over','own','re',
  'then','there','through','under','until','up','while','able','like','get','got',
  'go','going','goes','went','gone','come','came','make','made','take','took','taken',
  'give','gave','given','find','found','know','knew','known','think','thought','say',
  'said','see','saw','seen','want','use','used','using','work','well','way','even',
  'new','now','old','one','two','three','first','last','long','great','little','much',
  'still','back','being','being','many','thing','things','something','anything',
  'everything','nothing','another','around','since','without','however','whether',
  'though','although','yet','already','always','never',
]);

const PROFANITY_LIST = new Set([
  'damn','dammit','hell','crap','shit','bullshit','fuck','fucking','fucked',
  'ass','asshole','bastard','bitch','dick','piss','slut','whore',
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SYLLABLE COUNTING
// ═══════════════════════════════════════════════════════════════════════════════

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 2) return 1;

  // Common exceptions
  const exceptions = {
    'the': 1, 'he': 1, 'she': 1, 'we': 1, 'be': 1, 'me': 1,
    'are': 1, 'were': 1, 'there': 1, 'where': 1, 'here': 1,
    'every': 3, 'everything': 4, 'everyone': 3, 'everywhere': 3,
    'beautiful': 4, 'interest': 3, 'interesting': 4, 'different': 3,
    'business': 3, 'family': 3, 'evening': 3, 'area': 3,
    'idea': 3, 'create': 2, 'real': 1, 'really': 3,
  };
  if (exceptions[word] !== undefined) return exceptions[word];

  let count = 0;
  const vowels = 'aeiouy';
  let prevVowel = false;

  // Remove trailing silent e
  let w = word;
  if (w.endsWith('e') && !w.endsWith('le') && w.length > 2) {
    w = w.slice(0, -1);
  }

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Handle -le ending
  if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) {
    count++;
  }

  // Handle -ed ending (often silent)
  if (word.endsWith('ed') && word.length > 3) {
    const before = word[word.length - 3];
    if (before !== 't' && before !== 'd') {
      count = Math.max(1, count - 1);
    }
  }

  return Math.max(1, count);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function tokenize(text) {
  return text.toLowerCase().match(/[a-z']+/g) || [];
}

function getSentences(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  return sentences.length > 0 ? sentences : [text];
}

function getParagraphs(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

function getWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0);
}

function letterCount(text) {
  return (text.match(/[a-zA-Z]/g) || []).length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENTIMENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeSentiment(text) {
  const words = tokenize(text);
  if (words.length === 0) {
    return { score: 0, comparative: 0, label: 'neutral', positive: [], negative: [], tokens: 0 };
  }

  let score = 0;
  const positiveFound = [];
  const negativeFound = [];
  let negationActive = false;
  let intensifier = 1.0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z']/g, '');
    if (!word) continue;

    // Check negation
    if (NEGATION_WORDS.has(word)) {
      negationActive = true;
      continue;
    }

    // Check intensifier
    if (INTENSIFIERS[word] !== undefined) {
      intensifier = INTENSIFIERS[word];
      continue;
    }

    let wordScore = 0;
    if (POSITIVE_WORDS.has(word)) {
      wordScore = 1 * intensifier;
      if (negationActive) {
        wordScore = -wordScore * 0.75;
        negativeFound.push('not ' + word);
      } else {
        positiveFound.push(word);
      }
    } else if (NEGATIVE_WORDS.has(word)) {
      wordScore = -1 * intensifier;
      if (negationActive) {
        wordScore = -wordScore * 0.75;
        positiveFound.push('not ' + word);
      } else {
        negativeFound.push(word);
      }
    }

    score += wordScore;
    negationActive = false;
    intensifier = 1.0;
  }

  // Handle exclamation marks (amplify)
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 0 && score !== 0) {
    score *= (1 + exclamations * 0.1);
  }

  // Handle ALL CAPS words (amplify)
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  if (capsWords > 0 && score !== 0) {
    score *= (1 + capsWords * 0.15);
  }

  const comparative = score / words.length;
  let label = 'neutral';
  if (comparative > 0.05) label = 'positive';
  else if (comparative < -0.05) label = 'negative';

  // Confidence: how far from neutral
  const confidence = Math.min(1, Math.abs(comparative) * 5);

  return {
    score: Math.round(score * 1000) / 1000,
    comparative: Math.round(comparative * 1000) / 1000,
    label,
    confidence: Math.round(confidence * 1000) / 1000,
    positive: [...new Set(positiveFound)],
    negative: [...new Set(negativeFound)],
    tokens: words.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// READABILITY SCORES
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeReadability(text) {
  const sentences = getSentences(text);
  const words = getWords(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  if (wordCount === 0 || sentenceCount === 0) {
    return {
      fleschKincaidGrade: 0,
      fleschReadingEase: 0,
      colemanLiauIndex: 0,
      automatedReadabilityIndex: 0,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
      interpretation: 'Insufficient text',
    };
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  // Flesch-Kincaid Grade Level
  const fkGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  // Flesch Reading Ease
  const fre = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Coleman-Liau Index
  const letters = letterCount(text);
  const L = (letters / wordCount) * 100; // letters per 100 words
  const S = (sentenceCount / wordCount) * 100; // sentences per 100 words
  const cli = 0.0588 * L - 0.296 * S - 15.8;

  // Automated Readability Index
  const charCount = text.replace(/\s/g, '').length;
  const ari = 4.71 * (charCount / wordCount) + 0.5 * avgWordsPerSentence - 21.43;

  // Interpretation based on Flesch Reading Ease
  let interpretation;
  if (fre >= 90) interpretation = 'Very easy to read (5th grade)';
  else if (fre >= 80) interpretation = 'Easy to read (6th grade)';
  else if (fre >= 70) interpretation = 'Fairly easy to read (7th grade)';
  else if (fre >= 60) interpretation = 'Standard (8th-9th grade)';
  else if (fre >= 50) interpretation = 'Fairly difficult (10th-12th grade)';
  else if (fre >= 30) interpretation = 'Difficult (college level)';
  else interpretation = 'Very difficult (graduate level)';

  return {
    fleschKincaidGrade: Math.round(fkGrade * 100) / 100,
    fleschReadingEase: Math.round(fre * 100) / 100,
    colemanLiauIndex: Math.round(cli * 100) / 100,
    automatedReadabilityIndex: Math.round(ari * 100) / 100,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    interpretation,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION (TF-based)
// ═══════════════════════════════════════════════════════════════════════════════

function extractKeywords(text, options = {}) {
  const maxKeywords = options.maxKeywords || 10;
  const minLength = options.minLength || 3;
  const words = tokenize(text);

  if (words.length === 0) return { keywords: [], totalWords: 0, uniqueWords: 0 };

  // Count term frequency, skip stop words and short words
  const freq = {};
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length < minLength) continue;
    if (STOP_WORDS.has(clean)) continue;
    freq[clean] = (freq[clean] || 0) + 1;
  }

  // Sort by frequency, then alphabetically
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxKeywords);

  const uniqueWords = new Set(words.map(w => w.replace(/[^a-z]/g, '')).filter(w => w)).size;

  return {
    keywords: sorted.map(([word, count]) => ({
      word,
      count,
      tf: Math.round((count / words.length) * 10000) / 10000,
    })),
    totalWords: words.length,
    uniqueWords,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANGUAGE DETECTION (character frequency analysis)
// ═══════════════════════════════════════════════════════════════════════════════

function detectLanguage(text) {
  const clean = text.replace(/\s+/g, '');
  if (clean.length === 0) return { language: 'unknown', confidence: 0, scores: {} };

  const scores = {};

  // Korean: Hangul block U+AC00-U+D7AF, Jamo U+1100-U+11FF, compat U+3130-U+318F
  const koreanChars = (clean.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  scores.ko = koreanChars / clean.length;

  // Japanese: Hiragana U+3040-U+309F, Katakana U+30A0-U+30FF
  const japaneseChars = (clean.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  scores.ja = japaneseChars / clean.length;

  // Chinese: CJK Unified U+4E00-U+9FFF (shared with Japanese kanji, but if no hiragana/katakana, likely Chinese)
  const cjkChars = (clean.match(/[\u4E00-\u9FFF]/g) || []).length;
  const pureChineseRatio = cjkChars / clean.length;
  // If Japanese kana present, reduce Chinese score
  scores.zh = japaneseChars > 0 ? pureChineseRatio * 0.3 : pureChineseRatio;
  // If CJK chars present alongside kana, boost Japanese
  if (japaneseChars > 0 && cjkChars > 0) {
    scores.ja += cjkChars / clean.length * 0.5;
  }

  // Latin-based languages: detect by common patterns
  const latinChars = (clean.match(/[a-zA-Z]/g) || []).length;
  const latinRatio = latinChars / clean.length;

  if (latinRatio > 0.5) {
    const lower = text.toLowerCase();

    // Spanish markers
    const esMarkers = (lower.match(/\b(el|la|los|las|de|del|en|es|un|una|que|por|con|para|como|pero|este|esta|tiene|hacer|puede|todo|sobre|desde|hasta|entre|antes|durante)\b/g) || []).length;
    const esAccents = (text.match(/[áéíóúñ¿¡]/g) || []).length;
    scores.es = ((esMarkers * 2 + esAccents) / getWords(text).length) * latinRatio;

    // French markers
    const frMarkers = (lower.match(/\b(le|la|les|de|des|du|un|une|et|en|est|que|pour|dans|sur|avec|qui|pas|plus|sont|cette|nous|vous|ils|elle|elles|tout|aussi|comme|mais|bien|fait|peut|entre|chez|depuis|avant|pendant)\b/g) || []).length;
    const frAccents = (text.match(/[àâéèêëïîôùûüÿç]/g) || []).length;
    scores.fr = ((frMarkers * 2 + frAccents) / getWords(text).length) * latinRatio;

    // German markers
    const deMarkers = (lower.match(/\b(der|die|das|den|dem|des|ein|eine|und|ist|ich|nicht|auf|mit|auch|sich|von|als|für|nach|über|aber|noch|kann|nur|werden|haben|diese|wird|oder|sein|bei|zum|zur|vor|wenn|mehr|sehr|schon|durch)\b/g) || []).length;
    const deChars = (text.match(/[äöüß]/g) || []).length;
    scores.de = ((deMarkers * 2 + deChars) / getWords(text).length) * latinRatio;

    // English markers
    const enMarkers = (lower.match(/\b(the|is|are|was|were|have|has|had|will|would|could|should|been|being|this|that|with|from|they|their|there|what|which|when|where|who|how|about|into|through|during|before|after|between|under|over|again|further|then|once|here|just|also|than|other|some|such|only|same|because|does|each|different|another|while|since|without|however|whether|though)\b/g) || []).length;
    scores.en = (enMarkers * 2 / getWords(text).length) * latinRatio;
  } else {
    scores.es = 0;
    scores.fr = 0;
    scores.de = 0;
    scores.en = 0;
  }

  // Find winner
  let bestLang = 'unknown';
  let bestScore = 0;
  for (const [lang, sc] of Object.entries(scores)) {
    if (sc > bestScore) {
      bestScore = sc;
      bestLang = lang;
    }
  }

  // Need minimum confidence
  if (bestScore < 0.05) {
    bestLang = latinRatio > 0.5 ? 'en' : 'unknown';
    bestScore = latinRatio > 0.5 ? 0.3 : 0;
  }

  const langNames = {
    en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese',
    es: 'Spanish', fr: 'French', de: 'German', unknown: 'Unknown',
  };

  // Normalize scores to 0-1 range
  const maxScore = Math.max(...Object.values(scores), 0.001);
  const normalized = {};
  for (const [lang, sc] of Object.entries(scores)) {
    normalized[lang] = Math.round((sc / maxScore) * 1000) / 1000;
  }

  return {
    language: bestLang,
    languageName: langNames[bestLang] || 'Unknown',
    confidence: Math.round(Math.min(1, bestScore * 3) * 1000) / 1000,
    scores: normalized,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeStats(text) {
  const words = getWords(text);
  const sentences = getSentences(text);
  const paragraphs = getParagraphs(text);
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const letters = letterCount(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const paragraphCount = paragraphs.length;

  const avgWordLength = wordCount > 0
    ? Math.round((words.reduce((s, w) => s + w.replace(/[^a-zA-Z]/g, '').length, 0) / wordCount) * 100) / 100
    : 0;

  const avgSentenceLength = sentenceCount > 0
    ? Math.round((wordCount / sentenceCount) * 100) / 100
    : 0;

  // Reading time: average 238 WPM for English
  const readingTimeMinutes = wordCount / 238;
  const readingTimeSec = Math.round(readingTimeMinutes * 60);

  // Speaking time: ~150 WPM
  const speakingTimeMinutes = wordCount / 150;
  const speakingTimeSec = Math.round(speakingTimeMinutes * 60);

  return {
    characters: chars,
    charactersNoSpaces: charsNoSpaces,
    letters,
    words: wordCount,
    sentences: sentenceCount,
    paragraphs: paragraphCount,
    avgWordLength,
    avgSentenceLength,
    readingTime: {
      minutes: Math.round(readingTimeMinutes * 10) / 10,
      seconds: readingTimeSec,
      display: readingTimeSec < 60 ? `${readingTimeSec}s` : `${Math.ceil(readingTimeMinutes)} min`,
    },
    speakingTime: {
      minutes: Math.round(speakingTimeMinutes * 10) / 10,
      seconds: speakingTimeSec,
      display: speakingTimeSec < 60 ? `${speakingTimeSec}s` : `${Math.ceil(speakingTimeMinutes)} min`,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFANITY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function detectProfanity(text) {
  const words = tokenize(text);
  const found = [];

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (PROFANITY_LIST.has(clean)) {
      found.push(clean);
    }
  }

  return {
    hasProfanity: found.length > 0,
    count: found.length,
    words: [...new Set(found)],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARIZATION (extractive, sentence scoring)
// ═══════════════════════════════════════════════════════════════════════════════

function summarize(text, options = {}) {
  const sentenceCount = options.sentences || 3;
  const sentences = getSentences(text);

  if (sentences.length <= sentenceCount) {
    return { summary: text.trim(), sentenceCount: sentences.length, ratio: 1 };
  }

  // Build word frequency (skip stop words)
  const freq = {};
  for (const sentence of sentences) {
    const words = tokenize(sentence);
    for (const w of words) {
      const clean = w.replace(/[^a-z]/g, '');
      if (clean.length < 3 || STOP_WORDS.has(clean)) continue;
      freq[clean] = (freq[clean] || 0) + 1;
    }
  }

  // Score each sentence
  const scored = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    let score = 0;
    for (const w of words) {
      const clean = w.replace(/[^a-z]/g, '');
      score += freq[clean] || 0;
    }
    // Normalize by sentence length
    if (words.length > 0) score /= words.length;
    // Boost first and early sentences (positional bias)
    if (index === 0) score *= 1.5;
    else if (index < 3) score *= 1.2;
    return { sentence, score, index };
  });

  // Pick top sentences, preserve original order
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index);

  const summary = top.map(t => t.sentence).join('. ') + '.';
  const ratio = Math.round((top.length / sentences.length) * 100) / 100;

  return { summary, sentenceCount: top.length, totalSentences: sentences.length, ratio };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeAll(text, options = {}) {
  return {
    sentiment: analyzeSentiment(text),
    readability: analyzeReadability(text),
    keywords: extractKeywords(text, options),
    language: detectLanguage(text),
    stats: analyzeStats(text),
    profanity: detectProfanity(text),
    summary: summarize(text, options),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  analyzeSentiment,
  analyzeReadability,
  extractKeywords,
  detectLanguage,
  analyzeStats,
  detectProfanity,
  summarize,
  analyzeAll,
  countSyllables,
};
