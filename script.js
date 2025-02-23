document.getElementById('convertBtn').addEventListener('click', convertImages);
document.getElementById('compressionSlider').addEventListener('input', updateCompressionValue);
document.getElementById('cropBtn').addEventListener('click', cropImage);
document.getElementById('resetBtn').addEventListener('click', resetApp);

let cropper;

// Drag and drop functionality
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('imageInput');

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('drag-over');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('drag-over');
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('drag-over');
  fileInput.files = e.dataTransfer.files;
  previewImages(fileInput.files);
});

fileInput.addEventListener('change', () => {
  previewImages(fileInput.files);
});

function updateCompressionValue() {
  const compressionValue = document.getElementById('compressionSlider').value;
  document.getElementById('compressionValue').textContent = compressionValue;
}

function previewImages(files) {
  const previewSection = document.getElementById('imagePreview');
  previewSection.innerHTML = '';

  Array.from(files).forEach((file) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.className = 'preview-image';

      const container = document.createElement('div');
      container.className = 'preview-image';
      container.appendChild(img);
      previewSection.appendChild(container);
    };

    reader.readAsDataURL(file);
  });
}

function cropImage() {
  const previewImages = document.querySelectorAll('.preview-image img');
  if (previewImages.length === 0) {
    alert('Please upload an image first.');
    return;
  }

  const image = previewImages[0];
  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(image, {
    aspectRatio: NaN, // Free crop
    viewMode: 1,
  });
}

async function convertImages() {
  const fileInput = document.getElementById('imageInput');
  const formatSelect = document.getElementById('formatSelect');
  const compressionSlider = document.getElementById('compressionSlider');
  const resizeWidth = document.getElementById('resizeWidth');
  const resizeHeight = document.getElementById('resizeHeight');
  const convertedImagesContainer = document.getElementById('convertedImages');
  const progressBar = document.getElementById('conversionProgress');
  const progressText = document.getElementById('progressText');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please upload one or more images first.');
    return;
  }

  convertedImagesContainer.innerHTML = ''; // Clear previous results
  progressBar.value = 0;
  progressText.textContent = '0%';

  const files = Array.from(fileInput.files);
  const totalFiles = files.length;
  let processedFiles = 0;

  for (const file of files) {
    let imageSrc;

    // Handle HEIC/HEIF files
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      imageSrc = await heic2any({ blob: file, toType: 'image/jpeg' });
    } else {
      imageSrc = URL.createObjectURL(file);
    }

    const img = new Image();
    img.src = imageSrc;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Apply cropping if Cropper is active
      if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        canvas.width = croppedCanvas.width;
        canvas.height = croppedCanvas.height;
        ctx.drawImage(croppedCanvas, 0, 0);
      } else {
        // Resize image if dimensions are provided
        const width = resizeWidth.value ? parseInt(resizeWidth.value) : img.width;
        const height = resizeHeight.value ? parseInt(resizeHeight.value) : img.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }

      const selectedFormat = formatSelect.value;
      const mimeType = `image/${selectedFormat}`;
      const quality = parseFloat(compressionSlider.value);

      // Convert image to the selected format
      canvas.toBlob(
        function (blob) {
          const url = URL.createObjectURL(blob);

          // Create a container for the converted image
          const imageContainer = document.createElement('div');
          imageContainer.className = 'converted-image';

          // Display the converted image
          const outputImage = document.createElement('img');
          outputImage.src = url;
          imageContainer.appendChild(outputImage);

          // Create a download link
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `converted_image_${Date.now()}.${selectedFormat}`;
          downloadLink.textContent = `Download ${selectedFormat.toUpperCase()}`;
          downloadLink.className = 'download-link';
          imageContainer.appendChild(downloadLink);

          // Append the container to the output section
          convertedImagesContainer.appendChild(imageContainer);

          // Update progress
          processedFiles++;
          const progress = (processedFiles / totalFiles) * 100;
          progressBar.value = progress;
          progressText.textContent = `${Math.round(progress)}%`;
        },
        mimeType,
        quality
      );
    };
  }
}

function resetApp() {
  // Clear file input
  const fileInput = document.getElementById('imageInput');
  fileInput.value = '';

  // Clear preview section
  const previewSection = document.getElementById('imagePreview');
  previewSection.innerHTML = '';

  // Clear output section
  const convertedImagesContainer = document.getElementById('convertedImages');
  convertedImagesContainer.innerHTML = '';

  // Reset format select
  const formatSelect = document.getElementById('formatSelect');
  formatSelect.value = 'png';

  // Reset compression slider
  const compressionSlider = document.getElementById('compressionSlider');
  compressionSlider.value = 1;
  document.getElementById('compressionValue').textContent = '1';

  // Reset resize inputs
  document.getElementById('resizeWidth').value = '';
  document.getElementById('resizeHeight').value = '';

  // Reset progress bar
  const progressBar = document.getElementById('conversionProgress');
  progressBar.value = 0;
  document.getElementById('progressText').textContent = '0%';

  // Destroy Cropper instance if it exists
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  alert('App has been reset!');
}