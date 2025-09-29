// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Homepage Initialized!');
    fetchAndRenderVideos();
});

/**
 * Fetches video data from our API and renders the video cards on the page.
 */
async function fetchAndRenderVideos() {
    const videoGrid = document.getElementById('videoGrid');
    videoGrid.innerHTML = '<p style="color: #aaa; grid-column: 1 / -1;">Loading videos...</p>';

    const videos = await getAllVideos(); // This is the call to our server
    videoGrid.innerHTML = ''; // Clear the "Loading..." message

    if (videos.length === 0) {
        videoGrid.innerHTML = '<p class="no-results" style="color: #aaa; grid-column: 1 / -1;">No videos found. Your backend might be offline or the database is empty.</p>';
        return;
    }

    // Create video cards with real durations (async)
    for (const video of videos) {
        const videoCard = await createVideoCard(video);
        videoGrid.appendChild(videoCard);
    }
}

/**
 * Creates an HTML element for a single video card using data from the server.
 * @param {object} video - The video data from the API.
 * @returns {HTMLElement} The video card element.
 */
async function createVideoCard(video) {
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';

    // --- Generate thumbnail URL from S3 ---
    // Note: This should match your S3 bucket configuration
    const S3_BUCKET_BASE_URL = 'https://youtube-clone-uploads-aws.s3.us-east-1.amazonaws.com';
    
    // Use uploaded thumbnail if available, otherwise use placeholder
    const thumbnailUrl = video.thumbnail_s3_key 
        ? `${S3_BUCKET_BASE_URL}/${video.thumbnail_s3_key}`
        : 'https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg';
    
    // Create a simple base64 fallback image
    const fallbackThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSIxNjAiIHk9IjkwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZmZmZiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5ObyBUaHVtYm5haWw8L3RleHQ+PC9zdmc+';
    
    // Get real video duration
    const duration = await getVideoDuration(video.s3_key);
    console.log(`🏠 Homepage - Video "${video.title}" duration: ${duration}`);
    
    const channelName = "Awesome Creator";
    const views = "1K views"; // TODO: This could be tracked in database
    const timeAgo = new Date(video.created_at).toLocaleDateString();

    videoCard.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnailUrl}" alt="${video.title}" 
                 onerror="console.error('Thumbnail failed to load:', '${thumbnailUrl}'); this.src='${fallbackThumbnail}';"
                 onload="console.log('Thumbnail loaded successfully:', '${thumbnailUrl}');">
            <div class="video-duration">${duration}</div>
        </div>
        <div class="video-info">
            <div class="video-avatar">
                <img src="https://yt3.ggpht.com/a/default-user=s68-c-k-c0x00ffffff-no-rj" alt="Channel">
            </div>
            <div class="video-details">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-channel">${channelName}</p>
                <p class="video-stats">${views} • ${timeAgo}</p>
            </div>
        </div>
    `;

    // Add a click listener to navigate to the video player page,
    // passing the video's unique s3_key in the URL.
    videoCard.addEventListener('click', () => {
        window.location.href = `video.html?v=${encodeURIComponent(video.s3_key)}`;
    });

    return videoCard;
}