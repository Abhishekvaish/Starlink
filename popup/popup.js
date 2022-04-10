document.querySelector("h1 a").setAttribute("href", chrome.runtime.getURL("dashboard/dashboard.html"))

chrome.storage.sync.get({ data: [] }, ({ data }) => {
	const main = document.querySelector(".main")
	const form = document.querySelector("form")
	const note = document.querySelector(".note")
	const back = document.querySelector(".back")
	const current_dir = document.querySelector(".current_dir")

	current_dir.innerText = "home"
	current_dir.prev_dirs = []
	renderCurrentDir(current_dir.innerText)

	chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
		let url = tabs[0].url
		const index = data.findIndex(e => e.type == "link" && e.url == url)
		addEventListnerButton(index, url)
	})

	function addEventListnerButton(index, url) {
		if (index == -1) {
			let input = document.createElement("input")
			input.placeholder = "link name (optional)"
			form.children[0].replaceWith(input)
			form.children[1].innerText = "Add"
			form.onsubmit = e => {
				e.preventDefault()
				index = addURL(url, form.children[0].value.trim())
				addEventListnerButton(index, url)
			}
		} else {
			let span = document.createElement("span")
			span.innerText = data[index].name
			form.children[0].replaceWith(span)
			form.children[1].innerText = "Remove"
			form.onsubmit = e => {
				e.preventDefault()
				index = removeURL(index)
				addEventListnerButton(index, url)
			}
		}
	}

	function renderCurrentDir(parent) {
		main.replaceChildren()
		data.filter(d => d.parent == parent && d.type == "folder").forEach(e => {
			const folder = document.createElement("div")
			folder.classList.add("folder")
			folder.innerText = e.name
			folder.onclick = () => {
				parent = e.name
				current_dir.prev_dirs.push(current_dir.innerText)
				current_dir.innerText = parent
				renderCurrentDir(parent)
			}
			main.append(folder)
		})
		// main.replaceChildren(children)
	}

	function addURL(url, name) {
		data.push({
			type: "link",
			parent: current_dir.innerText,
			url: url,
			name: name,
		})
		chrome.storage.sync.set({ data: data }, res => {
			note.textContent = "added to " + current_dir.innerText
		})
		return data.length - 1
	}
	function removeURL(index) {
		data.splice(index, 1)
		chrome.storage.sync.set({ data: data }, res => {
			note.textContent = "removed from " + current_dir.innerText
		})
		return -1
	}
	back.onclick = () => {
		if (current_dir.prev_dirs.length > 0) {
			current_dir.innerText = current_dir.prev_dirs.pop()
			renderCurrentDir(current_dir.innerText)
		}
	}
})
