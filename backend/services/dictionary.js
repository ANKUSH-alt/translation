/**
 * Custom Dictionary for Old/Historical Spanish Words
 * Maps archaic spellings and OCR-confused variants to modern equivalents.
 * Used as a pre-LLM deterministic correction layer.
 */

const OLD_SPANISH_DICTIONARY = {
    // ─── Archaic → Modern Spanish ─────────────────────────────────
    // Common old Spanish spellings
    'zeloso': 'celoso',
    'zelos': 'celos',
    'zelo': 'celo',
    'zelar': 'celar',
    'zelador': 'celador',
    'hazer': 'hacer',
    'haziendo': 'haciendo',
    'dezir': 'decir',
    'dixo': 'dijo',
    'dixeron': 'dijeron',
    'dixe': 'dije',
    'mesmo': 'mismo',
    'mesma': 'misma',
    'agora': 'ahora',
    'ansí': 'así',
    'ansi': 'así',
    'assi': 'así',
    'deste': 'de este',
    'desta': 'de esta',
    'desto': 'de esto',
    'dellos': 'de ellos',
    'dellas': 'de ellas',
    'dello': 'de ello',
    'destos': 'de estos',
    'destas': 'de estas',
    'aquel': 'aquel',
    'aqueste': 'este',
    'aquessa': 'esa',
    'vos': 'vos',          // Keep — still valid in some dialects
    'vuestra': 'vuestra',  // Keep — still valid
    'coraçon': 'corazón',
    'corazon': 'corazón',
    'cabeça': 'cabeza',
    'cabeza': 'cabeza',
    'plaça': 'plaza',
    'fuerça': 'fuerza',
    'esperança': 'esperanza',
    'criança': 'crianza',
    'confiança': 'confianza',
    'alabança': 'alabanza',
    'vengança': 'venganza',
    'mudança': 'mudanza',
    'usança': 'usanza',
    'privança': 'privanza',
    'bonança': 'bonanza',
    'tardança': 'tardanza',
    'holgança': 'holganza',
    'enseñança': 'enseñanza',

    // ─── OCR-Confused Old Spanish (z↔c, ç↔z, f↔s) ───────────────
    'çielo': 'cielo',
    'çielos': 'cielos',
    'çiudad': 'ciudad',
    'çerca': 'cerca',
    'çercar': 'cercar',
    'çierto': 'cierto',
    'çierta': 'cierta',
    'merçed': 'merced',
    'reçibir': 'recibir',
    'reçibido': 'recibido',
    'oraçion': 'oración',
    'razon': 'razón',
    'sazon': 'sazón',
    'naçion': 'nación',
    'obligaçion': 'obligación',

    // ─── Common OCR misreads in Spanish text ─────────────────────
    'devocion': 'devoción',
    'oracion': 'oración',
    'nacion': 'nación',
    'obligacion': 'obligación',
    'corazon': 'corazón',
    'razon': 'razón',
    'sazon': 'sazón',
    'cancion': 'canción',
    'leccion': 'lección',
    'accion': 'acción',
    'atencion': 'atención',
    'intencion': 'intención',
    'condicion': 'condición',
    'posicion': 'posición',
    'situacion': 'situación',
    'poblacion': 'población',
    'informacion': 'información',
    'educacion': 'educación',
    'comunicacion': 'comunicación',
    'investigacion': 'investigación',

    // ─── Old verb forms ──────────────────────────────────────────
    'escrivir': 'escribir',
    'escrivió': 'escribió',
    'recibir': 'recibir',    // Already modern but common OCR target
    'bivir': 'vivir',
    'bevir': 'vivir',
    'vevir': 'vivir',
    'servir': 'servir',
    'cumplir': 'cumplir',

    // ─── Typography artifacts ────────────────────────────────────
    'deſde': 'desde',
    'eſte': 'este',
    'eſta': 'esta',
    'eſtos': 'estos',
    'eſtas': 'estas',
    'ſer': 'ser',
    'ſu': 'su',
    'ſus': 'sus',
    'ſobre': 'sobre',
    'ſolo': 'solo',
    'ſiempre': 'siempre',
    'ſanto': 'santo',
    'ſanta': 'santa',
    'ſeñor': 'señor',
    'ſeñora': 'señora',
};

/**
 * Document type profiles for OCR tuning
 * Each profile configures Tesseract parameters and post-processing behavior
 */
const DOCUMENT_PROFILES = {
    'historical-spanish': {
        name: 'Historical Spanish Document',
        description: 'Colonial-era manuscripts, religious texts, legal documents',
        ocrConfig: {
            psm: 6,           // Assume uniform block of text
            oem: 3,           // Default LSTM + legacy
            preserveSpaces: true
        },
        useDictionary: true,
        dictionaryName: 'old-spanish',
        postProcessing: {
            fixLongS: true,       // ſ → s
            fixCedilla: true,     // ç → z/c
            fixAccents: true,     // Add missing accents
            aggressiveness: 'moderate'  // More corrections allowed
        }
    },
    'modern-printed': {
        name: 'Modern Printed Document',
        description: 'Standard printed text, books, articles',
        ocrConfig: {
            psm: 3,           // Fully automatic page segmentation
            oem: 3
        },
        useDictionary: false,
        postProcessing: {
            fixLongS: false,
            fixCedilla: false,
            fixAccents: false,
            aggressiveness: 'conservative'  // Minimal corrections
        }
    },
    'handwritten': {
        name: 'Handwritten Document',
        description: 'Handwritten notes, letters, forms',
        ocrConfig: {
            psm: 6,
            oem: 3,
            preserveSpaces: false  // Handwriting has irregular spacing
        },
        useDictionary: false,
        postProcessing: {
            fixLongS: false,
            fixCedilla: false,
            fixAccents: false,
            aggressiveness: 'moderate'
        }
    },
    'mixed': {
        name: 'Mixed Document',
        description: 'Documents with both printed and handwritten text',
        ocrConfig: {
            psm: 3,
            oem: 3
        },
        useDictionary: false,
        postProcessing: {
            fixLongS: false,
            fixCedilla: false,
            fixAccents: false,
            aggressiveness: 'conservative'
        }
    }
};

/**
 * Apply dictionary-based corrections to text
 * This is a fast, deterministic pre-LLM correction step
 * @param {string} text - Input text
 * @param {string} dictionaryName - Which dictionary to use
 * @returns {string} Corrected text
 */
function applyDictionary(text, dictionaryName = 'old-spanish') {
    if (dictionaryName !== 'old-spanish') return text;

    const dict = OLD_SPANISH_DICTIONARY;
    let corrected = text;
    let corrections = 0;

    // Word-boundary-aware replacement
    for (const [oldWord, newWord] of Object.entries(dict)) {
        // Match word boundaries, case-insensitive
        const regex = new RegExp(`\\b${escapeRegex(oldWord)}\\b`, 'gi');
        const matches = corrected.match(regex);
        if (matches) {
            corrected = corrected.replace(regex, (match) => {
                // Preserve original casing pattern
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
        console.log(`  📖 Dictionary: ${corrections} word(s) corrected`);
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
        // ç before e/i → c (in modern Spanish)
        result = result.replace(/ç([ei])/gi, 'c$1');
        // ç before a/o/u → z
        result = result.replace(/ç([aou])/gi, 'z$1');
    }

    // Fix common ligatures
    result = result.replace(/ﬁ/g, 'fi');
    result = result.replace(/ﬂ/g, 'fl');
    result = result.replace(/ﬀ/g, 'ff');
    result = result.replace(/ﬃ/g, 'ffi');
    result = result.replace(/ﬄ/g, 'ffl');

    return result;
}

/**
 * Detect document type from text characteristics
 * @param {string} text - OCR extracted text
 * @param {string} ocrLanguage - OCR language code
 * @returns {string} Document profile key
 */
function detectDocumentType(text, ocrLanguage) {
    // Check for long s (ſ) or cedilla (ç) → historical
    const hasLongS = /ſ/.test(text);
    const hasCedilla = /ç/.test(text);
    const hasOldSpelling = /\b(zeloso|hazer|dezir|dixo|mesmo|agora|ansí)\b/i.test(text);

    if ((hasLongS || hasCedilla || hasOldSpelling) && 
        (ocrLanguage === 'spa' || ocrLanguage === 'old')) {
        return 'historical-spanish';
    }

    // Check for handwriting indicators (very irregular spacing, short words)
    const words = text.split(/\s+/);
    const avgWordLen = text.replace(/\s/g, '').length / (words.length || 1);
    const singleCharWords = words.filter(w => w.length === 1 && !/[aAiIoOyY]/.test(w)).length;
    const singleCharRatio = singleCharWords / (words.length || 1);

    if (avgWordLen < 3 || singleCharRatio > 0.2) {
        return 'handwritten';
    }

    return 'modern-printed';
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get a document profile by key
 */
function getProfile(profileKey) {
    return DOCUMENT_PROFILES[profileKey] || DOCUMENT_PROFILES['modern-printed'];
}

module.exports = {
    OLD_SPANISH_DICTIONARY,
    DOCUMENT_PROFILES,
    applyDictionary,
    applyTypographyFixes,
    detectDocumentType,
    getProfile
};
