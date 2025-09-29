// js/upload.js

document.addEventListener('DOMContentLoaded', () => {
    // Check if these elements exist before adding listeners
    const uploadModal = document.getElementById('uploadModal');
    if (!uploadModal) return; // Don't run this script if the modal isn't on the page

    const closeModalBtn = document.getElementById('closeModalBtn');
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const submitBtn = document.getElementById('submitUploadBtn');
    const thumbnailFile = document.getElementById('thumbnailFile');
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const thumbnailPreviewImg = document.getElementById('thumbnailPreviewImg');

    // Thumbnail preview functionality
    thumbnailFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnailPreviewImg.src = e.target.result;
                thumbnailPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            thumbnailPreview.style.display = 'none';
        }
    });

    // Use event delegation for the upload button in the header
    document.body.addEventListener('click', (event) => {
        if (event.target.closest('.upload-btn')) {
            uploadModal.style.display = 'flex';
        }
    });

    // Function to close the modal
    const closeModal = () => {
        uploadModal.style.display = 'none';
        uploadForm.reset(); // Clear the form
        uploadStatus.textContent = '';
        submitBtn.disabled = false;
        thumbnailPreview.style.display = 'none';
    };

    closeModalBtn.addEventListener('click', closeModal);

    // The main upload form submission handler
    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;

        const videoFile = document.getElementById('videoFile').files[0];
        const thumbnailFileInput = document.getElementById('thumbnailFile').files[0];
        const title = document.getElementById('videoTitle').value;
        const description = document.getElementById('videoDescription').value;

        if (!videoFile) {
            uploadStatus.textContent = 'Please select a video file.';
            submitBtn.disabled = false;
            return;
        }

        if (!thumbnailFileInput) {
            uploadStatus.textContent = 'Please select a thumbnail image.';
            submitBtn.disabled = false;
            return;
        }

        // --- Start of 5-Step Upload Process ---

        try {
            // 1. Get the secure upload URLs from our backend
            uploadStatus.textContent = 'Preparing upload...';
            
            const [videoUploadConfig, thumbnailUploadConfig] = await Promise.all([
                getUploadUrl(),
                getThumbnailUploadUrl(thumbnailFileInput.type)
            ]);

            if (!videoUploadConfig || !thumbnailUploadConfig) {
                uploadStatus.textContent = 'Error: Could not get upload URLs.';
                submitBtn.disabled = false;
                return;
            }

            // 2. Upload thumbnail first (faster)
            uploadStatus.textContent = 'Uploading thumbnail...';
            const thumbnailUploadResponse = await fetch(thumbnailUploadConfig.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': thumbnailFileInput.type },
                body: thumbnailFileInput,
            });
            
            if (!thumbnailUploadResponse.ok) {
                throw new Error('Thumbnail upload failed.');
            }

            // 3. Upload the video file to S3
            uploadStatus.textContent = 'Uploading video... (this may take a moment)';
            const videoUploadResponse = await fetch(videoUploadConfig.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'video/mp4' },
                body: videoFile,
            });
            
            if (!videoUploadResponse.ok) {
                throw new Error('Video upload failed.');
            }

            // 4. Save video metadata including thumbnail
            uploadStatus.textContent = 'Saving video details...';
            const newVideo = await saveVideoMetadata(
                title, 
                description, 
                videoUploadConfig.key,
                thumbnailUploadConfig.key
            );
            
            if (!newVideo) {
                uploadStatus.textContent = 'Error: Could not save video details.';
                submitBtn.disabled = false;
                return;
            }

            // 5. Success!
            uploadStatus.textContent = '✅ Upload successful! Video and thumbnail uploaded.';
            
            setTimeout(() => {
                closeModal();
                window.location.reload(); // Refresh the page to see the new video
            }, 2500);

        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = `Error: ${error.message}`;
            submitBtn.disabled = false;
        }
    });
});