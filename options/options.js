async function generateSettingElements() {
    const container = document.getElementById('options')
    const settings = await chrome.storage.sync.get(null)
    Object.entries(settings)
        .filter(([_, s]) => s && s.configurable)
        .sort(([_, s1], [__, s2]) => s1.sort_order - s2.sort_order)
        .forEach(async ([key, s]) => container.appendChild(await createSettingElement(key, s)))
}

async function createSettingElement(key, setting) {
    var element = {}

    switch (setting.type) {
        case 'boolean': {
            element = document.createElement('input')
            element.setAttribute('type', 'checkbox')
            if (setting.value)
                element.setAttribute('checked', 'checked')
            element.addEventListener('click', async e => {
                setting.value = e.target.checked
                await setSettingValue(key, setting)
            })
            break
        }

        case 'slider': {
            element = document.createElement('slider')
            const input = document.createElement('input')
            input.setAttribute('type', 'range')
            input.setAttribute('min', setting.min)
            input.setAttribute('max', setting.max)
            input.setAttribute('value', setting.value)
            input.classList.add('slider')
            input.addEventListener('click', async e => {
                setting.value = e.target.value
                await setSettingValue(key, setting)
            })
            element.appendChild(input)
            break
        }
        default: {
            return
        }
    }
    const label = document.createElement('label')
    label.appendChild(element)
    const labelText = document.createElement('span')
    labelText.innerHTML = setting.name
    label.appendChild(labelText)

    const description = document.createElement('span')
    description.innerHTML = setting.description

    const container = document.createElement('li')
    container.appendChild(label)
    container.appendChild(description)

    return container
}
async function setSettingValue(key, value) {
    await chrome.storage.sync.set({ [key]: value })
}
generateSettingElements()