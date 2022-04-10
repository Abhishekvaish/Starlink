const main = document.querySelector(".main")
const form = document.querySelector("#newfolder")
const back = document.querySelector(".back")
const current_dir = document.querySelector(".current_dir")
const LINK_TO_IMAGE = {}

chrome.storage.sync.get({ data: [] }, ({ data }) => {
	current_dir.innerText = "home"
	current_dir.prev_dirs = []
	data.sort((a, b) => {
		if (a.type == "folder" && b.type == "link") return -1
		if (a.type == "link" && b.type == "folder") return 1
		if (a.type == "folder" && b.type == "folder") return a.name < b.name ? -1 : 1
		return 1
	})
	generateImages()
	renderCurrentDir(current_dir.innerText)
	// console.log(data)

	form.addEventListener("submit", e => {
		e.preventDefault()

		const folder_name = e.target[0].value.trim()

		if (folder_name.length == 0) return

		const index = data.findIndex(e => e.type == "folder" && e.name == folder_name)
		console.log(index)
		if (index == -1) {
			e.target.children[1].innerText = ""
			e.target[0].value = ""
			data.push({
				type: "folder",
				parent: current_dir.innerText,
				name: folder_name,
			})
			chrome.storage.sync.set({ data: data }, () => console.log("added to data"))
			renderCurrentDir(current_dir.innerText)
		} else {
			e.target.children[1].innerText = "folder name " + folder_name + " already exists"
		}
	})

	function renderCurrentDir(parent_dir) {
		main.replaceChildren()
		data.forEach((element, index) => {
			if (element.parent != parent_dir) return
			if (element.type == "link") {
				const div = document.createElement("div")
				div.classList.add("link")
				div.id = element.url

				const image = LINK_TO_IMAGE[`http://free.pagepeeker.com/v2/thumbs_ready.php?size=m&url=${element.url}`]
				const a = document.createElement("a")
				a.href = element.url
				a.target = "_blank"
				a.append(image)

				const span1 = document.createElement("span")
				span1.innerText = element.name

				const span = document.createElement("span")
				span.innerHTML = "&#x2715;"
				span.onclick = () => {
					data.splice(index, 1)
					chrome.storage.sync.set({ data: data }, () => console.log("updated data"))
					div.remove()
				}

				div.append(a, span1, span)

				main.append(div)
			} else if (element.type == "folder") {
				const div = document.createElement("div")
				div.classList.add("folder")
				div.id = element.name

				const image = document.createElement("img")
				image.src = "folder.png"

				const span1 = document.createElement("span")
				span1.innerText = element.name

				const span2 = document.createElement("span")
				span2.innerHTML = "&#x2715;"

				span2.onclick = () => {
					if (data.filter(e => e.parent == element.name).length > 0) {
						alert("cannot delete non-empty directory")
						return
					}
					data.splice(index, 1)
					chrome.storage.sync.set({ data: data }, () => console.log("updated data"))
					div.remove()
				}

				div.append(image, span1, span2)

				div.addEventListener("dblclick", () => {
					current_dir.prev_dirs.push(current_dir.innerText)
					current_dir.innerText = element.name
					renderCurrentDir(element.name)
				})

				main.append(div)
			}
		})
	}

	back.addEventListener("click", e => {
		if (current_dir.innerText == "home") return
		const prev_dir = current_dir.prev_dirs.pop()
		current_dir.innerText = prev_dir
		renderCurrentDir(prev_dir)
	})

	function generateImages() {
		const queue = []
		data.forEach(element => {
			if (element.type == "folder") return
			const image = document.createElement("img")

			image.src = `http://free.pagepeeker.com/v2/thumbs.php?size=m&url=${element.url}`
			queue.push(`http://free.pagepeeker.com/v2/thumbs_ready.php?size=m&url=${element.url}`)
			LINK_TO_IMAGE[queue[queue.length - 1]] = image
		})

		queue.forEach(function request(url) {
			fetch(url)
				.then(res => res.json())
				.then(({ IsReady }) => {
					if (IsReady == 1) {
						// console.log("Ready", url)
						LINK_TO_IMAGE[url].src = LINK_TO_IMAGE[url].src
					} else {
						// console.log("Not Ready", url)
						setTimeout(() => request(url), 250)
					}
				})
		})
	}
})
