const header = document.getElementById("header")
const section = document.getElementById("section")
const button = document.getElementById("more")

const storiesBtn = document.getElementById("stories-btn")
const jobsBtn = document.getElementById("jobs-btn")
const pollsBtn = document.getElementById("polls-btn")

const liveNotice = document.getElementById("live-notice")
const refreshBtn = document.getElementById("refresh-btn")

let ids = []
let start = 0
let size = 20
let end = size
let last = 0
let currentType = "topstories" 

storiesBtn.addEventListener("click", async () => {
    currentType = "topstories"
    ids = await getTypeIds(currentType)
    resetAndReload()
})

jobsBtn.addEventListener("click", async () => {
    currentType = "jobstories"
    ids = await getTypeIds(currentType)
    resetAndReload()
})

pollsBtn.addEventListener("click", async () => {
    currentType = "polls"
    ids = await getPolls()
    resetAndReload()
})

refreshBtn.addEventListener("click", async () => {
    liveNotice.style.display = "none"
    if (currentType === "polls") {
        ids = await getPolls()
    } else {
        ids = await getTypeIds(currentType)
    }
    resetAndReload()
})

function resetAndReload() {
    section.innerHTML = ""
    start = 0
    end = size
    reload()
}

async function getTypeIds(type) {
    try {
        let res = await fetch(`https://hacker-news.firebaseio.com/v0/${type}.json`)
        return await res.json()
    } catch (err) {
        console.error(err)
        return []
    }
}

async function getPolls() {
    try {
        const res = await fetch("https://hacker-news.firebaseio.com/v0/maxitem.json")
        const all = await res.json()
        last = all
        let fetched = []
        for (let i = all; i >= all - 200; i--) {
            let post = await story(i)
            if (post && post.type === "poll") {
                fetched.push(i)
                if (fetched.length >= 30) break
            }
        }
        return fetched
    } catch (err) {
        console.error("Error loading polls:", err)
        return []
    }
}

async function story(id) {
    try {
        let res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        if (!res.ok) throw new Error(res.statusText)
        return await res.json()
    } catch (error) {
        console.log(error)
        return {}
    }
}

async function reload() {
    let batch = ids.slice(start, end)

    for (const ele of batch) {
        let res = await story(ele)
        const div = document.createElement("div")
        div.className = "story-card"
        div.innerHTML = `
            <h2 class="title">${res.title}</h2>
            <p class="meta">By <strong>${res.by}</strong> | 💬 ${res.kids !== undefined ? res.kids.length : 0} comments | ⭐ ${res.score || 0}</p>
            <a class="link" href="${res.url || '#'}" target="_blank">🔗 Visit</a>
        `
        section.appendChild(div)
    }
}

button.addEventListener("click", async () => {
    start = end
    end += size
    await reload()
})

window.onload = async () => {
    ids = await getTypeIds("topstories")
    last = await getMaxItem()
    await reload()

    setInterval(async () => {
        try {
            const max = await getMaxItem()
            if (max > last) {
                liveNotice.style.display = "block"
            }
        } catch (e) {
            console.log("Live check error:", e)
        }
    }, 5000)
}

async function getMaxItem() {
    const res = await fetch("https://hacker-news.firebaseio.com/v0/maxitem.json")
    return await res.json()
}
