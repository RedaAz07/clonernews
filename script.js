const header = document.getElementById("header")
const section = document.getElementById("section")
const button = document.getElementById("more")

const storiesBtn = document.getElementById("stories-btn")
const jobsBtn = document.getElementById("jobs-btn")
const pollsBtn = document.getElementById("polls-btn")

let ids = []
let start = 0
let size = 20
let end = size

storiesBtn.addEventListener("click", async () => {
    ids = await getTypeIds("topstories")
    resetAndReload()
})

jobsBtn.addEventListener("click", async () => {
    ids = await getTypeIds("jobstories")
    resetAndReload()
})

pollsBtn.addEventListener("click", async () => {
    console.log(1);
    
    ids = await getPolls()
    resetAndReload()
    console.log(2);
    
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
        const res = await fetch("https://hacker-news.firebaseio.com/v0/newstories.json")
        const all = await res.json()
        const polls = []

        for (let i = 0; i < all.length; i++) {
            const item = await story(all[i])
            if (item && item.type === "poll") {
                polls.push(item.id)
            }

            if (polls.length >= 20) break
        }

        return polls
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
        console.log(error);
        return {}
    }
}

async function reload() {
    let batch = ids.slice(start, end)

    for (const ele of batch) {
        let res = await story(ele)
        if (!res.title) continue
        const div = document.createElement("div")
        div.className = "story-card"
        div.innerHTML = `
            <h2 class="title">${res.title}</h2>
            <p class="meta">By <strong>${res.by}</strong> | 💬 ${res.descendants || 0} comments | ⭐ ${res.score || 0}</p>
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
    await reload()
}
