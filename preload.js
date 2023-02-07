chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.clear()
    chrome.storage.sync.set({
        show_icon: {
            name: 'Show probe icon on all pages',
            description: 'Show probe summarization tool as a floating icon on all applicable pages.',
            type: 'boolean',
            value: true,
            sort_order: 1,
            configurable: false
        },

        suppress_landing: {
            name: 'Suppress the icon on landing and search pages',
            description: 'Hide probe floating icon on search pages and first page of every website (e.g., hidden on \'website.com\', but shown on \'website.com/article\')',
            type: 'boolean',
            value: true,
            sort_order: 2,
            configurable: false
        },
        summary_size: {
            name: 'Summary size',
            description: 'Controls how many key sentences should be returned to summarize the page',
            type: 'slider',
            min: 1,
            max: 3,
            value: 2,
            sort_order: 3,
            configurable: true
        }
    })
})
