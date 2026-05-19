 // --- KONFIGURASI ---
        // Ganti URL ini dengan URL Twibbon PNG transparan Anda yang asli.
        const TWIBBON_URL = 'Twibbon.png'; 

        // --- INISIALISASI ---
        const canvas = document.getElementById('twibbonCanvas');
        const ctx = canvas.getContext('2d');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const zoomRange = document.getElementById('zoomRange');
        const zoomValue = document.getElementById('zoomValue');
        const downloadBtn = document.getElementById('downloadBtn');

        let userImage = new Image();
        let twibbonImage = new Image();
        let isImageLoaded = false;
        
        // Variabel untuk posisi dan skala foto user
        let imgX = 0, imgY = 0, imgScale = 1;
        
        // Variabel untuk dragging
        let isDragging = false;
        let startX, startY;

        // --- MUAT TWIBBON FRAME (Dinamis Aspek Rasio) ---
        twibbonImage.src = TWIBBON_URL;
        twibbonImage.crossOrigin = "Anonymous"; 
        twibbonImage.onload = () => {
            // Set dimensi internal canvas sesuai dengan ukuran asli PNG Twibbon
            canvas.width = twibbonImage.naturalWidth;
            canvas.height = twibbonImage.naturalHeight;
            
            // Set aspect ratio di CSS agar UI menyesuaikan dengan dimensi asli gambar
            canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

            // Gambar twibbon kosong dulu sebagai placeholder
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
        };
        twibbonImage.onerror = () => {
            alert('Gagal memuat frame twibbon. Pastikan URL benar dan mendukung CORS.');
        };

        // --- LOGIKA UTAMA: MENGGAMBAR KE CANVAS ---
        function drawCanvas() {
            // 1. Bersihkan canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (isImageLoaded) {
                // 2. Gambar Foto User (Layer Bawah)
                ctx.save();
                
                // Gambar foto dengan transformasi (geser dan skala)
                // Kita menggambar dari tengah agar zoom terasa natural
                ctx.translate(canvas.width / 2 + imgX, canvas.height / 2 + imgY);
                ctx.scale(imgScale, imgScale);
                ctx.drawImage(userImage, -userImage.width / 2, -userImage.height / 2);
                
                ctx.restore();
            }

            // 3. Gambar Frame Twibbon (Layer Atas)
            ctx.drawImage(twibbonImage, 0, 0, canvas.width, canvas.height);
        }

        // --- LOGIKA UPLOAD FOTO ---
        function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                userImage.onload = () => {
                    isImageLoaded = true;
                    // Reset posisi dan skala awal
                    imgX = 0; imgY = 0;
                    
                    // Skala awal agar foto menutupi canvas (cover effect), menyesuaikan ukuran canvas yang baru
                    const scaleX = canvas.width / userImage.width;
                    const scaleY = canvas.height / userImage.height;
                    imgScale = Math.max(scaleX, scaleY);
                    
                    // Setel slider zoom ke nilai awal yang sesuai
                    zoomRange.value = imgScale * 100;
                    zoomValue.textContent = Math.round(imgScale * 100) + '%';
                    
                    downloadBtn.disabled = false; // Aktifkan tombol download
                    drawCanvas();
                };
                userImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Event Listeners untuk Input File dan Drag & Drop
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
        
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-sr-green-mid', 'bg-green-50'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-sr-green-mid', 'bg-green-50'); });
        dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('border-sr-green-mid', 'bg-green-50'); handleFile(e.dataTransfer.files[0]); });

        // --- LOGIKA ZOOM ---
        zoomRange.addEventListener('input', () => {
            imgScale = zoomRange.value / 100;
            zoomValue.textContent = Math.round(zoomRange.value) + '%';
            if (isImageLoaded) drawCanvas();
        });

        // --- LOGIKA GESER (DRAG) FOTO ---
        function getEventPos(e) {
            // Menangani mouse dan touch events
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            // Konversi posisi layar ke posisi internal canvas yang dinamis
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

        function startDragging(e) {
            if (!isImageLoaded) return;
            isDragging = true;
            const pos = getEventPos(e);
            startX = pos.x - imgX;
            startY = pos.y - imgY;
        }

        function dragImage(e) {
            if (!isDragging || !isImageLoaded) return;
            e.preventDefault(); // Mencegah scrolling di mobile
            const pos = getEventPos(e);
            imgX = pos.x - startX;
            imgY = pos.y - startY;
            drawCanvas();
        }

        function stopDragging() { isDragging = false; }

        // Mouse Events
        canvas.addEventListener('mousedown', startDragging);
        window.addEventListener('mousemove', dragImage);
        window.addEventListener('mouseup', stopDragging);
        
        // Touch Events (untuk mobile)
        canvas.addEventListener('touchstart', startDragging);
        window.addEventListener('touchmove', dragImage, { passive: false });
        window.addEventListener('touchend', stopDragging);

        // --- LOGIKA DOWNLOAD ---
        downloadBtn.addEventListener('click', () => {
            if (!isImageLoaded) return;
            
            // Buat link unduhan sementara
            const link = document.createElement('a');
            link.download = 'Twibbon-Lebaran-SutanRaya.png';
            link.href = canvas.toDataURL('image/png', 1.0); // Kualitas maksimum
            link.click();
        });
