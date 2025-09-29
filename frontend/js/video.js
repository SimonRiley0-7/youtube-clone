// js/video.js

// --- ❗ IMPORTANT CONFIGURATION ❗ ---
// S3 bucket URL where videos are stored
// This should match your actual S3 bucket from the backend configuration
const S3_BUCKET_URL = 'https://youtube-clone-uploads-aws.s3.us-east-1.amazonaws.com';


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoKey = urlParams.get('v');

    if (!videoKey) {
        handlePlayerError('<h1>Error: No video specified.</h1>');
        return;
    }
    if (!S3_BUCKET_URL.startsWith('http')) {
        handlePlayerError('<h1>Configuration Error: S3 Bucket URL is not set in video.js</h1>');
        alert('Your S3 bucket URL is not configured correctly in js/video.js. Please update the S3_BUCKET_URL variable.');
        return;
    }

    const videoData = await getVideoById(videoKey);

    if (!videoData) {
        handlePlayerError('<h1>Error: Video not found.</h1>');
        return;
    }

    populateVideoDetails(videoData);
    setupRealVideoPlayer(videoData);
    loadUpNextVideos(videoData.s3_key); // Load real videos for Up next section
});

function handlePlayerError(message) {
    const videoMain = document.querySelector('.video-main');
    videoMain.innerHTML = message;
    console.error(message.replace(/<[^>]*>?/gm, '')); // Log clean error to console
}

function populateVideoDetails(video) {
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').innerHTML = `<p>${video.description || 'No description available.'}</p>`;
    document.getElementById('videoDate').textContent = new Date(video.created_at).toLocaleDateString();
    document.getElementById('channelName').textContent = 'Awesome Creator'; // Placeholder
}

function setupRealVideoPlayer(video) {
    const videoPlayerContainer = document.getElementById('videoPlayer');
    const videoUrl = `${S3_BUCKET_URL}/${video.s3_key}`;

    console.log('🎬 Setting up video player for:', video.title);
    console.log('📹 Video URL:', videoUrl);
    
    // Create loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'video-loading';
    videoPlayerContainer.appendChild(loadingSpinner);
    
    // Create the video element and add it to the page
    const videoElement = document.createElement('video');
    videoElement.id = 'main-video';
    videoElement.src = videoUrl;
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.controls = false; // Disable native controls for custom YouTube-like experience
    videoElement.preload = 'metadata';
    
    // Add error handling
    videoElement.addEventListener('error', (e) => {
        console.error('❌ Video load error:', e);
        console.error('Video error code:', videoElement.error?.code);
        console.error('Video error message:', videoElement.error?.message);
        handlePlayerError(`<h1>Error loading video</h1><p>Could not load video from: ${videoUrl}</p><p>Error: ${videoElement.error?.message || 'Unknown error'}</p>`);
    });
    
    videoElement.addEventListener('loadstart', () => {
        console.log('📥 Video loading started...');
        loadingSpinner.style.display = 'block';
    });
    
    videoElement.addEventListener('canplay', () => {
        console.log('✅ Video can start playing');
        loadingSpinner.style.display = 'none';
    });
    
    videoElement.addEventListener('waiting', () => {
        loadingSpinner.style.display = 'block';
    });
    
    videoElement.addEventListener('playing', () => {
        loadingSpinner.style.display = 'none';
    });
    
    videoPlayerContainer.prepend(videoElement); // Add video before the controls

    // Get references to enhanced YouTube-like controls
    const videoControls = document.getElementById('videoControls');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('duration');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    
    let controlsTimeout;
    let isControlsVisible = false;

    // Enhanced play/pause functionality
    const togglePlay = () => {
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    };

    // Show/hide controls with YouTube-like behavior
    const showControls = () => {
        videoControls.classList.add('show');
        isControlsVisible = true;
        clearTimeout(controlsTimeout);
        
        if (!videoElement.paused) {
            controlsTimeout = setTimeout(() => {
                hideControls();
            }, 3000);
        }
    };

    const hideControls = () => {
        if (!videoElement.paused) {
            videoControls.classList.remove('show');
            isControlsVisible = false;
        }
    };

    // Video event listeners
    videoElement.addEventListener('play', () => {
        playPauseIcon.className = 'fas fa-pause';
        showControls();
    });

    videoElement.addEventListener('pause', () => {
        playPauseIcon.className = 'fas fa-play';
        showControls();
    });

    videoElement.addEventListener('timeupdate', () => {
        const percentage = (videoElement.currentTime / videoElement.duration) * 100;
        progressFill.style.width = `${percentage}%`;
        currentTimeSpan.textContent = formatTime(videoElement.currentTime);
    });

    videoElement.addEventListener('loadedmetadata', () => {
        durationSpan.textContent = formatTime(videoElement.duration);
    });

    // Mouse movement controls
    videoPlayerContainer.addEventListener('mousemove', showControls);
    videoPlayerContainer.addEventListener('mouseleave', () => {
        if (!videoElement.paused) {
            controlsTimeout = setTimeout(hideControls, 1000);
        }
    });

    // Click events
    videoElement.addEventListener('click', togglePlay);
    playPauseBtn.addEventListener('click', togglePlay);

    // Enhanced progress bar with hover effects
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        videoElement.currentTime = videoElement.duration * percentage;
        showControls();
    });

    progressBar.addEventListener('mousemove', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const percentage = (hoverX / rect.width) * 100;
        progressBar.style.setProperty('--hover-position', `${percentage}%`);
    });

    // Volume controls
    volumeBtn.addEventListener('click', () => {
        if (videoElement.muted) {
            videoElement.muted = false;
            volumeIcon.className = 'fas fa-volume-up';
            volumeSlider.value = videoElement.volume * 100;
        } else {
            videoElement.muted = true;
            volumeIcon.className = 'fas fa-volume-mute';
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        videoElement.volume = volume;
        videoElement.muted = false;
        
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    });

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            videoPlayerContainer.requestFullscreen().then(() => {
                fullscreenIcon.className = 'fas fa-compress';
            }).catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenIcon.className = 'fas fa-expand';
            });
        }
    });

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenIcon.className = 'fas fa-compress';
        } else {
            fullscreenIcon.className = 'fas fa-expand';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'KeyF':
                e.preventDefault();
                fullscreenBtn.click();
                break;
            case 'KeyM':
                e.preventDefault();
                volumeBtn.click();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                videoElement.volume = Math.min(1, videoElement.volume + 0.1);
                volumeSlider.value = videoElement.volume * 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                videoElement.volume = Math.max(0, videoElement.volume - 0.1);
                volumeSlider.value = videoElement.volume * 100;
                break;
        }
    });

    // Initialize controls
    showControls();
}

function formatTime(timeInSeconds) {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Load real videos for Up next section
async function loadUpNextVideos(currentVideoKey) {
    try {
        console.log('📺 Loading Up next videos...');
        
        // Fetch all videos from the API
        const videos = await getAllVideos();
        
        if (videos.length === 0) {
            console.log('No videos found for Up next section');
            return;
        }
        
        // Filter out the current video and get up to 5 other videos
        const upNextVideos = videos
            .filter(video => video.s3_key !== currentVideoKey)
            .slice(0, 5);
        
        console.log(`Found ${upNextVideos.length} videos for Up next section`);
        
        // Get the container for recommended videos
        const recommendedContainer = document.getElementById('recommendedVideos');
        
        if (!recommendedContainer) {
            console.error('Recommended videos container not found');
            return;
        }
        
        // Clear existing content
        recommendedContainer.innerHTML = '';
        
        // Create video cards for each video (async)
        for (const video of upNextVideos) {
            const videoCard = await createUpNextVideoCard(video);
            recommendedContainer.appendChild(videoCard);
        }
        
        console.log('✅ Up next videos loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading Up next videos:', error);
    }
}

// Create a video card for the Up next section
async function createUpNextVideoCard(video) {
    const videoCard = document.createElement('div');
    videoCard.className = 'recommended-video';
    
    // Generate thumbnail URL from S3
    const S3_BUCKET_BASE_URL = 'https://youtube-clone-uploads-aws.s3.us-east-1.amazonaws.com';
    const thumbnailUrl = video.thumbnail_s3_key 
        ? `${S3_BUCKET_BASE_URL}/${video.thumbnail_s3_key}`
        : 'https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg';
    
    // Create fallback thumbnail
    const fallbackThumbnail = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTY4IiBoZWlnaHQ9Ijk0IiB2aWV3Qm94PSIwIDAgMTY4IDk0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjgiIGhlaWdodD0iOTQiIGZpbGw9IiMzMzMzMzMiLz48dGV4dCB4PSI4NCIgeT0iNDciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjZmZmZmZmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=';
    
    // Format the upload date
    const uploadDate = new Date(video.created_at);
    const timeAgo = getTimeAgo(uploadDate);
    
    // Get real video duration
    const realDuration = await getVideoDuration(video.s3_key);
    console.log(`📹 Video "${video.title}" duration: ${realDuration}`);
    
    videoCard.innerHTML = `
        <div class="recommended-thumbnail">
            <img src="${thumbnailUrl}" alt="${video.title}" 
                 onerror="this.src='${fallbackThumbnail}';">
            <span class="recommended-duration">${realDuration}</span>
        </div>
        <div class="recommended-info">
            <h4>${video.title}</h4>
            <p>Awesome Creator</p>
            <p>1K views • ${timeAgo}</p>
        </div>
    `;
    
    // Add click event to navigate to the video
    videoCard.addEventListener('click', () => {
        console.log('🎬 Navigating to video:', video.title);
        window.location.href = `video.html?v=${encodeURIComponent(video.s3_key)}`;
    });
    
    return videoCard;
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
}