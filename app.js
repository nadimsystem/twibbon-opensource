const { createApp, ref, onMounted, onBeforeUnmount } = Vue;

        createApp({
            setup() {
                // DOM refs
                const canvas = ref(null);
                const dropZone = ref(null);
                const fileInput = ref(null);

                // Reactive state
                const isImageLoaded = ref(false);
                const imgX = ref(0);
                const imgY = ref(0);
                const imgScale = ref(1);
                const imgScalePercent = ref(100);
                const zoomDisplay = ref('100');
                
                // Drag state
                const isDragging = ref(false);
                const dragStart = ref({ x: 0, y: 0 });

                // Images
                let userImage = null;
                let twibbonImage = null;
                let ctx = null;

                // Config
                const TWIBBON_URL = 'Twibbon.png';

                // --- Canvas Drawing ---
                const drawCanvas = () => {
                    if (!ctx || !canvas.value) return;
                    
                    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

                    if (isImageLoaded.value && userImage) {
                        ctx.save();
                        ctx.translate(canvas.value.width / 2 + imgX.value, canvas.value.height / 2 + imgY.value);
                        ctx.scale(imgScale.value, imgScale.value);
                        ctx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
                        ctx.restore();
                    }

                    if (twibbonImage) {
                        ctx.drawImage(twibbonImage, 0, 0, canvas.value.width, canvas.value.height);
                    }
                };

                // --- Zoom Handler ---
                const onZoomChange = () => {
                    imgScale.value = imgScalePercent.value / 100;
                    zoomDisplay.value = Math.round(imgScalePercent.value);
                    drawCanvas();
                };

                // --- File Handling ---
                const handleFile = (file) => {
                    if (!file || !file.type.startsWith('image/')) return;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        userImage = new Image();
                        userImage.onload = () => {
                            isImageLoaded.value = true;
                            imgX.value = 0;
                            imgY.value = 0;
                            
                            // Cover effect scaling
                            const scaleX = canvas.value.width / userImage.width;
                            const scaleY = canvas.value.height / userImage.height;
                            imgScale.value = Math.max(scaleX, scaleY);
                            imgScalePercent.value = imgScale.value * 100;
                            zoomDisplay.value = Math.round(imgScalePercent.value);
                            
                            drawCanvas();
                        };
                        userImage.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                };

                const triggerFileInput = () => fileInput.value?.click();
                
                const onFileSelect = (e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                };

                const onDragOver = () => dropZone.value?.classList.add('border-sr-green-mid', 'bg-green-50');
                const onDragLeave = () => dropZone.value?.classList.remove('border-sr-green-mid', 'bg-green-50');
                
                const onDrop = (e) => {
                    dropZone.value?.classList.remove('border-sr-green-mid', 'bg-green-50');
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleFile(file);
                };

                // --- Drag Logic ---
                const getEventPos = (e) => {
                    const rect = canvas.value.getBoundingClientRect();
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    return {
                        x: (clientX - rect.left) * (canvas.value.width / rect.width),
                        y: (clientY - rect.top) * (canvas.value.height / rect.height)
                    };
                };

                const startDragging = (e) => {
                    if (!isImageLoaded.value) return;
                    isDragging.value = true;
                    const pos = getEventPos(e);
                    dragStart.value = { x: pos.x - imgX.value, y: pos.y - imgY.value };
                };

                const dragImage = (e) => {
                    if (!isDragging.value || !isImageLoaded.value) return;
                    e.preventDefault();
                    const pos = getEventPos(e);
                    imgX.value = pos.x - dragStart.value.x;
                    imgY.value = pos.y - dragStart.value.y;
                    drawCanvas();
                };

                const stopDragging = () => { isDragging.value = false; };

                // --- Download ---
                const downloadTwibbon = () => {
                    if (!isImageLoaded.value || !canvas.value) return;
                    const link = document.createElement('a');
                    link.download = 'Twibbon-Lebaran-SutanRaya.png';
                    link.href = canvas.value.toDataURL('image/png', 1.0);
                    link.click();
                };

                // --- Lifecycle ---
                onMounted(() => {
                    ctx = canvas.value?.getContext('2d');
                    if (!ctx) return;

                    // Load twibbon frame
                    twibbonImage = new Image();
                    twibbonImage.crossOrigin = 'Anonymous';
                    twibbonImage.onload = () => {
                        canvas.value.width = twibbonImage.naturalWidth;
                        canvas.value.height = twibbonImage.naturalHeight;
                        canvas.value.style.aspectRatio = `${canvas.value.width} / ${canvas.value.height}`;
                        drawCanvas();
                    };
                    twibbonImage.onerror = () => alert('Gagal memuat frame twibbon. Pastikan URL benar dan mendukung CORS.');
                    twibbonImage.src = TWIBBON_URL;

                    // Event listeners for drag
                    canvas.value?.addEventListener('mousedown', startDragging);
                    canvas.value?.addEventListener('touchstart', startDragging, { passive: true });
                    window.addEventListener('mousemove', dragImage);
                    window.addEventListener('touchmove', dragImage, { passive: false });
                    window.addEventListener('mouseup', stopDragging);
                    window.addEventListener('touchend', stopDragging);
                });

                onBeforeUnmount(() => {
                    // Cleanup listeners
                    canvas.value?.removeEventListener('mousedown', startDragging);
                    canvas.value?.removeEventListener('touchstart', startDragging);
                    window.removeEventListener('mousemove', dragImage);
                    window.removeEventListener('touchmove', dragImage);
                    window.removeEventListener('mouseup', stopDragging);
                    window.removeEventListener('touchend', stopDragging);
                });

                return {
                    canvas, dropZone, fileInput,
                    isImageLoaded, imgScalePercent, zoomDisplay,
                    onZoomChange, triggerFileInput, onFileSelect,
                    onDragOver, onDragLeave, onDrop, downloadTwibbon
                };
            }
        }).mount('#app');