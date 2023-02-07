document.addEventListener('DOMContentLoaded', async() => {
    const view = new View(document.body)
    const tab = await chrome.tabs.query({ active: true, currentWindow: true })
    chrome.tabs.sendMessage(tab[0].id, 'getElementContent', summary => {
        document.body.classList.remove('loading')
        view.update(summary || {success: false, message: 'The page took too long to load. Please try again.'})
    })
})



