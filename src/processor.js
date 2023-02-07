const defaultStopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','that\'ll','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','th','nd','can','will','just','don','should','now','d','ll','m','o','re','ve','y','ain','aren','couldn','didn','doesn','hadn','hasn','haven','isn','ma','mightn','mustn','needn','shan','shouldn','wasn','weren','won','wouldn','www','com','also'];
const defaultAbbreviations = ['abr','apr','aug','ave','cir','ct','dec','dr','ed','etc','et al','feb','gen','inc','jan','jr','jul','jun','ln','mar','mr','mrs','nov','oct','pp','prof','rep','rd','rev','sen','sep','sr','st','vol','vs'];

class ProbeSentenceDocument {
	constructor(original, words, vocabulary, score, sortOrder) {
		this.original = original
		this.words = words
		this.vocabulary = vocabulary
		this.score = score
		this.sortOrder = sortOrder
	}
}

class ProbeSentencesDocumentProcessor {
	constructor(text, topPercent=0.1, stopwords=defaultStopwords, abbreviations=defaultAbbreviations) {
		this.text = text
		this.stopwords = stopwords
		this.abbreviations = abbreviations
		this.documents = []
		this.topics = []
		this.topPercent = topPercent
		this.nlp = new probeNLP(this.stopwords)
		this.terminators = {
			sentence: new RegExp('(?:[\\!\\?\\r\\n]+[\"\']?)|(?:(?<!\\b(?:' + this.abbreviations.join('|') + '|[a-z]))\\.+(?![\\w\\.\\!\\?])[\"\']?)', 'gi'),
			word: new RegExp('(?:^\\[.*\\])|(?:[^a-z\\.\\s]+)|(?:(?<!\\b[a-z])\\.)|(?:(?<!\\b[a-z]\\.)\\s)|(?:\\s(?![a-z]\\.))', 'gi'),
		}
		const docs = text
			.replace('."', '".')
			.replace('.\'', '\'.')
			.replace('?"', '"?')
			.replace('?\'', '\'?')
			.replace('!"', '"!')
			.replace('!\'', '\'!')
			.split(this.terminators.sentence)
			.map(s => s && s.trim())
			.filter(n => n)
		const lists = docs.map(d => d.toLowerCase().split(this.terminators.word).map(w => w && w.trim()).filter(w => w))
		this.topics = this.nlp.toTopics(lists, 4, true)

		const bags = lists.map(s => this.nlp.toBagOfWords(s, true))
		const scores = this.nlp.find_similarity_scores(false, ...bags)
		this.documents = docs.map((s, i) => new ProbeSentenceDocument(s, lists[i], bags[i], scores[i], i))
	}

	get_topK_value() {
		return Math.ceil(this.topPercent * this.documents.length)
	}
	get_topK_documents() {
		return this.documents
			.filter(d => d.score > 0)
			.sort((a,b) => b.score-a.score)
			.slice(0, this.get_topK_value())
			.sort((a,b) => a.sortOrder-b.sortOrder)
	}

	get_topK_topics() {
		const k = this.get_topK_value()
		const topic2K = Math.ceil(2 * this.topPercent * this.topics.size)
		const topics = [...this.topics.entries()]
		const mainTopicCount = topics.reduce((a,b) => a + (b.count > k ? 1 : 0), 0)
		return topics
			.sort((a, b) => b[1].score - a[1].score)
			.slice(0, Math.max(mainTopicCount, Math.min(topic2K, k)))
    }
}
