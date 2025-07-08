const API_BASE = "https://hacker-news.firebaseio.com/v0"
let allIDs = []
let postIndex = 0
const chunkSize = 20

async function fetchTopStoryIDs() {
  const res = await fetch(`${API_BASE}/topstories.json`)
  return res.json()
}

async function fetchItem(id) {
  const res = await fetch(`${API_BASE}/item/${id}.json`)
  return res.json()
}

async function fetchNextPosts() {
  const nextIDs = allIDs.slice(postIndex, postIndex + chunkSize)
  const posts = await Promise.all(nextIDs.map(fetchItem))
  postIndex += chunkSize
  return posts
}

function renderPosts(posts) {
  const container = document.getElementById("posts")

  posts.forEach(post => {
    const div = document.createElement("div")
    div.className = "post"

    const titleHTML = `<h3>${post.title}</h3>
      <p>By: ${post.by} | ${new Date(post.time * 1000).toLocaleString()}</p>`

    const commentsDiv = `<div class="comments" id="comments-${post.id}"></div><hr/>`

    div.innerHTML = titleHTML + commentsDiv

    container.appendChild(div)

    if (post.kids && post.kids.length > 0) {
      const btn = document.createElement("button")
      btn.setAttribute("data-id", post.id)
      btn.textContent = `Show Comments (${post.kids.length})`

btn.addEventListener("click", async () => {
  const fetchedPost = await fetchItem(post.id)
  if (fetchedPost.kids && fetchedPost.kids.length > 0) {
    const comments = await fetchComments(fetchedPost.kids)
    await renderComments(fetchedPost.id, comments)
    btn.disabled = true
    btn.textContent = "Comments Loaded"
  } else {
    btn.textContent = "No comments"
    btn.disabled = true
  }
})



      div.insertBefore(btn, div.querySelector(".comments"))
    }
  })
}



async function init() {
  allIDs = await fetchTopStoryIDs()
  const posts = await fetchNextPosts()
  renderPosts(posts)
}

window.addEventListener("load", init)

window.addEventListener("scroll", async () => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
  if (nearBottom && postIndex < allIDs.length) {
    const posts = await fetchNextPosts()
    renderPosts(posts)
  }
})

async function fetchComments(ids = []) {
  const comments = await Promise.all(ids.map(fetchItem))
  return comments.filter(c => c && !c.deleted)
}

async function renderComments(parentId, comments, depth = 0) {
  const containerId = depth === 0 ? `comments-${parentId}` : `replies-${parentId}`
  const container = document.getElementById(containerId)

  if (!container) {
    console.warn("Missing container:", containerId)
    return
  }

  for (let comment of comments) {
    const div = document.createElement("div")
    div.className = "comment"
    div.style.marginLeft = `${depth * 20}px`
    div.innerHTML = `
      <p><strong>${comment.by}</strong>: ${comment.text}</p>
      <div class="replies" id="replies-${comment.id}"></div>
    `

    if (comment.kids && comment.kids.length > 0) {
      const replyBtn = document.createElement("button")
      replyBtn.textContent = `Show Replies (${comment.kids.length})`
      replyBtn.style.marginTop = "5px"
      replyBtn.style.fontSize = "0.8em"

      replyBtn.addEventListener("click", async () => {
        const replies = await fetchComments(comment.kids)
        await renderComments(comment.id, replies, depth + 1)
        replyBtn.disabled = true
        replyBtn.textContent = "Replies Loaded"
      })

      div.appendChild(replyBtn)
    }

    container.appendChild(div)
  }
}



