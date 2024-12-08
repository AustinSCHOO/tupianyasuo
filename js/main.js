// DOM 元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const compressionControls = document.getElementById('compressionControls');
const previewContainer = document.getElementById('previewContainer');
const actionButtons = document.getElementById('actionButtons');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// 当前处理的图片数据
let currentFile = null;
let compressedBlob = null;

// 初始化拖放区域事件
function initDropZone() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

// 阻止默认行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 高亮拖放区域
function highlight(e) {
    dropZone.classList.add('highlight');
}

// 取消高亮拖放区域
function unhighlight(e) {
    dropZone.classList.remove('highlight');
}

// 处理拖放文件
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// 处理文件
async function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
        alert('请选择图片文件！');
        return;
    }

    currentFile = file;
    await displayOriginalImage(file);
    showControls();
    await compressImage();
}

// 显示原始图片
async function displayOriginalImage(file) {
    originalPreview.src = URL.createObjectURL(file);
    originalSize.textContent = formatFileSize(file.size);
}

// 显示控制区域
function showControls() {
    compressionControls.style.display = 'block';
    previewContainer.style.display = 'grid';
    actionButtons.style.display = 'flex';
}

// 压缩图片
async function compressImage() {
    if (!currentFile) return;
    
    try {
        const quality = parseInt(qualitySlider.value) / 100;
        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality,
            alwaysKeepResolution: true,  // 保持原始分辨率
            initialQuality: quality,      // 设置初始质量
            fileType: currentFile.type    // 保持原始文件类型
        };

        // 释放之前的 Blob URL
        if (compressedPreview.src) {
            URL.revokeObjectURL(compressedPreview.src);
        }

        // 执行压缩
        compressedBlob = await imageCompression(currentFile, options);
        
        // 创建新的 Blob URL
        const blobUrl = URL.createObjectURL(compressedBlob);
        compressedPreview.src = blobUrl;
        compressedSize.textContent = formatFileSize(compressedBlob.size);

        console.log('压缩完成:', {
            原始大小: currentFile.size,
            压缩后大小: compressedBlob.size,
            压缩比例: quality,
            压缩率: ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(2) + '%'
        });
    } catch (error) {
        console.error('压缩失败:', error);
        alert('图片压缩失败，请重试！');
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 下载压缩后的图片
function downloadCompressedImage() {
    if (!compressedBlob) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    link.download = `compressed_${currentFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 重置
function reset() {
    currentFile = null;
    compressedBlob = null;
    fileInput.value = '';
    originalPreview.src = '';
    compressedPreview.src = '';
    originalSize.textContent = '0 KB';
    compressedSize.textContent = '0 KB';
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
    compressionControls.style.display = 'none';
    previewContainer.style.display = 'none';
    actionButtons.style.display = 'none';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 事件监听
const debouncedCompress = debounce(async () => {
    await compressImage();
}, 300);

qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = `${e.target.value}%`;
    debouncedCompress();
});

downloadBtn.addEventListener('click', downloadCompressedImage);
resetBtn.addEventListener('click', reset);

// 初始化
initDropZone(); 