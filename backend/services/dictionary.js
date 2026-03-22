/**
 * Custom Dictionary for Old/Historical Spanish Words (Normalization Mode)
 * Maps archaic spellings and OCR-confused variants to modern equivalents.
 */
const OLD_SPANISH_DICTIONARY = {
    'zeloso': 'celoso', 'zelos': 'celos', 'zelo': 'celo', 'hazer': 'hacer',
    'dezir': 'decir', 'dixo': 'dijo', 'mesmo': 'mismo', 'agora': 'ahora',
    'ansí': 'así', 'ansi': 'así', 'assi': 'así', 'coraçon': 'corazón',
    'cabeça': 'cabeza', 'plaça': 'plaza', 'fuerça': 'fuerza',
    'çielo': 'cielo', 'çiudad': 'ciudad', 'merçed': 'merced',
    'reçibir': 'recibir', 'oraçion': 'oración', 'razon': 'razón',
    'devocion': 'devoción', 'oracion': 'oración', 'nacion': 'nación'
};

/**
 * Custom Dictionary for Historical Spanish OCR Fixes (Preservation Mode)
 * Focuses on fixing OCR misreads while PRESERVING archaic spellings.
 */
const HISTORICAL_PRESERVATION_DICTIONARY = {
    'zel0so': 'zeloso', 'zel0s': 'zelos', 'zel0': 'zelo',
    'haz0r': 'hazer', 'haziend0': 'haziendo', 'dez0r': 'dezir',
    'dix0': 'dixo', 'dixer0n': 'dixeron', 'mesm0': 'mesmo',
    'agor4': 'agora', 'plaç4': 'plaça', 'coraç0n': 'coraçon'
};

/**
 * Document type profiles for OCR tuning
 */
const DOCUMENT_PROFILES = {
    'historical-preserve': {
        name: 'Historical Preservation',
        description: 'Preserve archaic spellings, fix ONLY character-level OCR errors',
        ocrConfig: { psm: 6, oem: 3, preserveSpaces: true },
        useDictionary: true,
        dictionaryName: 'historical-preserve',
        postProcessing: {
            preserveArchaic: true,
            fixLongS: false,
            fixCedilla: false,
            fixAccents: false,
            aggressiveness: 'minimal'
        }
    },
    'historical-normalize': {
        name: 'Historical Normalization',
        description: 'Modernize archaic spellings (e.g., zeloso -> celoso)',
        ocrConfig: { psm: 6, oem: 3, preserveSpaces: true },
        useDictionary: true,
        dictionaryName: 'old-spanish',
        postProcessing: {
            preserveArchaic: false,
            fixLongS: true,
            fixCedilla: true,
            fixAccents: true,
            aggressiveness: 'moderate'
        }
    },
    'modern-printed': {
        name: 'Modern Printed Document',
        description: 'Standard printed text, books, articles',
        ocrConfig: { psm: 3, oem: 3 },
        useDictionary: false,
        postProcessing: {
            preserveArchaic: false,
            fixLongS: true,
            fixCedilla: true,
            fixAccents: true,
            aggressiveness: 'conservative'
        }
    },
    'handwritten': {
        name: 'Handwritten Document',
        description: 'Handwritten notes, letters, forms',
        ocrConfig: { psm: 6, oem: 3, preserveSpaces: false },
        useDictionary: false,
        postProcessing: {
            preserveArchaic: false,
            fixLongS: true,
            fixCedilla: true,
            fixAccents: true,
            aggressiveness: 'moderate'
        }
    }
};

/**
 * Apply dictionary-based corrections to text
 */
function applyDictionary(text, dictionaryName = 'historical-preserve') {
    const dict = dictionaryName === 'historical-preserve' 
        ? HISTORICAL_PRESERVATION_DICTIONARY 
        : OLD_SPANISH_DICTIONARY;
    
    let corrected = text;
    let corrections = 0;

    for (const [oldWord, newWord] of Object.entries(dict)) {
        const regex = new RegExp(`\\b${escapeRegex(oldWord)}\\b`, 'gi');
        const matches = corrected.match(regex);
        if (matches) {
            corrected = corrected.replace(regex, (match) => {
                if (match === match.toUpperCase()) return newWord.toUpperCase();
                if (match[0] === match[0].toUpperCase()) {
                    return newWord[0].toUpperCase() + newWord.slice(1);
                }
                return newWord;
            });
            corrections += matches.length;
        }
    }

    if (corrections > 0) {
        console.log(`  📖 Dictionary (${dictionaryName}): ${corrections} word(s) corrected`);
    }

    return corrected;
}

/**
 * Apply typography fixes based on document profile
 */
function applyTypographyFixes(text, profile) {
    let result = text;

    if (profile.postProcessing.fixLongS) {
        result = result.replace(/ſ/g, 's');
    }

    if (profile.postProcessing.fixCedilla) {
        result = result.replace(/ç([ei])/gi, 'c$1');
        result = result.replace(/ç([aou])/gi, 'z$1');
    }

    result = result.replace(/ﬁ/g, 'fi');
    result = result.replace(/ﬂ/g, 'fl');
    result = result.replace(/ﬀ/g, 'ff');
    result = result.replace(/ﬃ/g, 'ffi');
    result = result.replace(/ﬄ/g, 'ffl');

    return result;
}

/**
 * Detect document type from text characteristics
 */
function detectDocumentType(text, ocrLanguage) {
    const hasLongS = /ſ/.test(text);
    const hasCedilla = /ç/.test(text);
    const hasOldSpelling = /\b(zeloso|hazer|dezir|dixo|mesmo|agora|ansí)\b/i.test(text);

    if ((hasLongS || hasCedilla || hasOldSpelling) && 
        (ocrLanguage === 'spa' || ocrLanguage === 'old')) {
        // Default to preserve for historical documents as per user request
        return 'historical-preserve';
    }

    const words = text.split(/\s+/);
    const avgWordLen = text.replace(/\s/g, '').length / (words.length || 1);
    const singleCharWords = words.filter(w => w.length === 1 && !/[aAiIoOyY]/.test(w)).length;
    
    if (avgWordLen < 3 || (singleCharWords / (words.length || 1)) > 0.2) {
        return 'handwritten';
    }

    return 'modern-printed';
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getProfile(profileKey) {
    return DOCUMENT_PROFILES[profileKey] || DOCUMENT_PROFILES['modern-printed'];
}

module.exports = {
    OLD_SPANISH_DICTIONARY,
    HISTORICAL_PRESERVATION_DICTIONARY,
    DOCUMENT_PROFILES,
    applyDictionary,
    applyTypographyFixes,
    detectDocumentType,
    getProfile
};
