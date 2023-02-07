chrome.storage.sync.get(null, settings => {
	const node = document.createElement('probe')
	document.body.appendChild(node)
	const view = new View(node)
	const scrape_page = new scrape_page()
	scrape_page.injectCssEntries()

	if (settings.show_icon.value) {
		const summary = get_page_summary(settings, scrape_page)
		view.update(summary)
	}

	chrome.runtime.onMessage.addListener((data, _, callback) => {
		if (data == 'getElementContent') {
			const summary = get_page_summary(settings, scrape_page)
			callback(summary)
			view.update(summary)
		}
		return true
	})
})

function get_page_summary(settings, scrape_page) {
	const stopUrls = ['', '/', '/search', '/search/'] 

	if (settings.suppress_landing.value && stopUrls.includes(document.location.pathname.toLowerCase()))
		return {
			success: false,
			message: 'probe is configured to ignore landing pages and search pages, as they are generally bad candidates for summarization. You may change this in the extension Options.',
		}
	scrape_page.reset()
	scrape_page.ignoreAll(
		scrape_page.selectAbstractElements(),
		scrape_page.selectAsideElements(),
		scrape_page.selectHyperlinkContainers(),
		scrape_page.selectVisualContainers()
	)
	const node = scrape_page.findArticleContainer()
	if (node) {
		let text = ''
		for (const t of scrape_page.getTextList(node))
			text += t + '\n'
		const content = new ProbeSentencesDocumentProcessor(text, settings.summary_size.value / 20)
		if (text.length >= 250 && content.documents.length >= 12) {
			const topSentences = content.get_topK_documents()
			return {
				success: true,
				title: scrape_page.getPageTitle(),
				description: scrape_page.get_page_description(),
				topSentences: topSentences,
				topTopics: content.get_topK_topics(),
				originalWordCount: content.documents.reduce((a, b) => a + b.words.length, 0),
				summaryWordCount: topSentences.reduce((a, b) => a + b.words.length, 0),
			}
		}
	}
	
	return {
		success: false,
		message: 'This page is not appropriate for summarization. Please try longer pages.',
	}
}