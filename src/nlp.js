class probeNLP {
    constructor(stopwords = defaultStopwords) {
        this.stopwords = stopwords
    }
    toBagOfWords(words, remove_stopwords = true) {
        const countByWord = new Map()
        countByWord.innerLength = words.length
        for (const w of words)
            if (!remove_stopwords || !this.stopwords.includes(w.toLowerCase()))
                countByWord.set(w, (countByWord.get(w) ?? 0) + 1)
        return countByWord
    }
    toTopics(wordLists, contextLength = 4, remove_stopwords = true) {
        let topics = new Map()
        for (let list of wordLists) {
            if (remove_stopwords)
                list = this.remove_stopwords(list)
            const context = []
            for (const w of list) {
                if (context.length == contextLength)
                    context.shift()
                context.push(w)
                for (let i = 0, l = context.length; i < l - 1; i++) {
                    const asArray = context.slice(i, l)
                    const str = asArray.join(' ')
                    const value = topics.get(str) ?? { asArray: asArray, score: 0, count: 0, }
                    value.count += 1
                    value.score += 1 + 0.1 * (l - i)
                    topics.set(str, value)
                }
            }
        }

        topics = [...topics.entries()].filter(t => t[1].score > 3)
        topics = topics
            .filter(([_, t]) => topics.every(([__, t2]) => t2.score <= t.score || t2.asArray.length < t.asArray.length || !t.asArray.every(w => t2.asArray.includes(w))))
            .sort((a, b) => b[0].length - a[0].length)
            .sort((a, b) => b[1].score - a[1].score)
        return new Map(topics)
    }

    remove_stopwords(listOfWords) {
        return listOfWords.filter(w => !this.stopwords.includes(w.toLowerCase()))
    }

    toVocabulary(...listOfWords) {
        return Array.from(new Set([].concat.apply([], listOfWords)))
    }

    find_similarity_scores(normalize, ...bagOfWords) {
        const matrix = this.find_similarity_matrix(...bagOfWords)
        return this.scoreSimilarityMatrix(matrix, normalize)
    }

    find_similarity_matrix(...bagOfWords) {
        const length = bagOfWords.length
        const matrix = this.buildMatrix(length, 2)
        matrix.innerLength = 0

        for (var i = 0; i < length - 1; i++) {
            const currentBag = bagOfWords[i]
            matrix.innerLength += currentBag.innerLength
            matrix[i].innerLength = currentBag.innerLength

            for (var j = i + 1; j < length; j++) {
                const similarity = this.getSimilarity(currentBag, bagOfWords[j])
                matrix[i][j] = similarity
                matrix[j][i] = similarity
            }
        }
        return matrix
    }

    buildMatrix(length, dimensions) {
        if (dimensions == 1) {
            return Array(length).fill(0)
        } else {
            return Array(length).fill().map(_ => this.buildMatrix(length, dimensions - 1))
        }
    }

    getSimilarity(bagOfWords1, bagOfWords2) {
        if (bagOfWords1.size == 0 || bagOfWords2.size == 0)
            return 0

        const vocab = this.toVocabulary(
            [...bagOfWords1.keys()],
            [...bagOfWords2.keys()]
        )
        return this.cosineSimilarity(
            this.normalize_words_to_vocab(vocab, bagOfWords1),
            this.normalize_words_to_vocab(vocab, bagOfWords2)
        )
    }
    normalize_words_to_vocab(vocab, bagOfWords) {
        return vocab.map(v => bagOfWords.get(v) || 0)
    }

    cosineSimilarity(vector1, vector2) {
        const ab = this.getDotProduct(vector1, vector2)
        const aa = this.getDotProduct(vector1, vector1)
        const bb = this.getDotProduct(vector2, vector2)
        return ab / (Math.sqrt(aa) * Math.sqrt(bb))
    }

    getDotProduct(vector1, vector2) {
        return vector1.reduce((accum, val, i) => accum + val * vector2[i] || accum, 0)
    }

    scoreSimilarityMatrix(matrix, normalize = false) {
        const average = matrix.innerLength / matrix.length
        const scores = matrix.map(m => m.innerLength < 4 ? 0 : m.reduce((a, b) => a + b * Math.min(m.innerLength / average, 1) || a), 0)
        return normalize ? this.normalizeScoreList(scores) : scores
    }

    normalizeScoreList(scores) {
        const total = scores.reduce((a, b) => a + b || a, 0)
        return scores.map(m => m / total)
    }
}