const header = document.getElementById("header")
const section = document.getElementById("section")
const button = document.getElementById("more")
const buttons = document.querySelectorAll("#header button")
const liveNotice = document.getElementById("live-notice")
const refreshBtn = document.getElementById("refresh-btn")
const newCountSpan = document.getElementById("new-count")

let ids = []
let start = 0
let size = 20
let end = size
let last = 0
let currentType = "topstories"
let newPostsCount = 0

function debounce(func, delay) {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
}


const debouncehandler = debounce(async (event) =>  {
    const bnt = event.target
    setActiveButton(bnt)
    currentType = bnt.dataset.type
      if (currentType === "polls") {
    section.innerHTML = ""

        ids = await getPolls()
    } else {
        ids = await getTypeIds(currentType)
    }
    resetAndReload()
}, 500)


buttons.forEach(bnt => bnt.addEventListener("click", debouncehandler))


function setActiveButton(activeBtn) {
    buttons.forEach(btn => btn.classList.remove('active'))
    activeBtn.classList.add('active')
}
refreshBtn.addEventListener("click", async () => {
    liveNotice.style.display = "none"
    newPostsCount = 0
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
        const maxId = await res.json()
        last = maxId
        let fetched = []

        for (let i = maxId; i >= maxId - 1000 && fetched.length < 200; i--) {
            try {
                let post = await story(i)
                if (post && post.type === "poll") {
                    fetched.push(i)
                }
            } catch (e) {
                continue
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
        const data = await res.json()
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

async function loadComments(commentIds) {
    const comments = []
    for (const id of commentIds.slice(0, 5)) { 
        try {
            const comment = await story(id)
            if (comment && comment.text) {
                comments.push(comment)
            }
        } catch (e) {
            continue
        }
    }
    return comments
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
}

async function toggleComments(storyId, commentsSection, commentIds) {
    if (commentsSection.style.display === "none") {
        commentsSection.innerHTML = '<div class="loading">Loading comments...</div>'
        commentsSection.style.display = "block"

        const comments = await loadComments(commentIds)
        commentsSection.innerHTML = comments.length > 0
            ? comments.map(comment => `
                        <div class="comment">
                            <div class="comment-meta">By ${comment.by} • ${formatTime(comment.time)}</div>
                            <div class="comment-text">${comment.text}</div>
                        </div>
                    `).join('')
            : '<div class="comment">No comments available</div>'
    } else {
        commentsSection.style.display = "none"
    }
}

async function reload() {
    let batch = ids.slice(start, end)

    for (const ele of batch) {
        let res = await story(ele)
        if (!res) continue

        const div = document.createElement("div")
        div.className = "story-card"

        const commentsCount = res.kids ? res.kids.length : 0
        const hasComments = commentsCount > 0

        div.innerHTML = `
                    <h2 class="title">${res.title || 'No Title'}</h2>
                    <p class="meta">
                        By <strong>${res.by || 'Unknown'}</strong> | 
                        ${hasComments ?
                `<button class="comment-toggle" onclick="toggleComments(${res.id}, this.parentElement.parentElement.querySelector('.comments-section'), ${JSON.stringify(res.kids || [])})">💬 ${commentsCount} comments</button>` :
                `💬 ${commentsCount} comments`
            } | 
                        ⭐ ${res.score || 0} | 
                        🕒 ${formatTime(res.time)}
                    </p>
                    ${res.url ? `<a class="link" href="${res.url}" target="_blank">🔗 Visit</a>` : ''}
                    ${res.text ? `<div style="margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 3px;">${res.text}</div>` : ''}
                    ${hasComments ? '<div class="comments-section" style="display: none;"></div>' : ''}
                `
        section.appendChild(div)
    }
}

window.toggleComments = toggleComments

button.addEventListener("click", async () => {
    button.disabled = true
    button.textContent = "Loading..."

    start = end
    end += size
    await reload()

    button.disabled = false
    button.textContent = "Load More"
})

window.onload = async () => {
  ids = await getTypeIds("topstories")  
  last = await getMaxItem()              
  await reload()                       
  setInterval(async () => {
    try {
      const max = await getMaxItem()
      if (max > last) {
        newPostsCount = max - last
        newCountSpan.textContent = newPostsCount  
        liveNotice.style.display = "block"         
        last = max                                  
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