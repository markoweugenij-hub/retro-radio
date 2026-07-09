let audioContext;
let noiseNode;
let noiseGain;
let youtubePlayer;

let myPlaylist = JSON.parse(localStorage.getItem('radio_playlist')) || [];

const playBtn = document.getElementById('play-btn');
const searchInput = document.getElementById('search-input');
const noiseVolume = document.getElementById('noise-volume');
const addToPlaylistBtn = document.getElementById('add-to-playlist');
const playlistItems = document.getElementById('playlist-items');
const radioBody = document.getElementById('radio-body');

// 1. Створюємо контейнер-невидимку для плеєра YouTube під капотом сайту
const ytContainer = document.createElement('div');
ytContainer.id = 'yt-player-invisible';
ytContainer.style.position = 'absolute';
ytContainer.style.top = '-9999px'; // Ховаємо його з екрана, щоб ніхто не бачив відео
document.body.appendChild(ytContainer);

// 2. Підключаємо офіційний скрипт YouTube API
const tag = document.createElement('script');
tag.src = "https://youtube.com";
const firstScriptTag = document.getElementsByTagName('script');
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. Коли плеєр завантажиться, ініціалізуємо його
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('yt-player-invisible', {
        height: '1',
        width: '1',
        videoId: '', 
        playerVars: {
            'autoplay': 1,
            'controls': 0
        },
        events: {
            'onStateChange': (event) => {
                // Коли трек починає реально грати — вмикаємо анімацію радіоприймача
                if (event.data == YT.PlayerState.PLAYING) {
                    radioBody.classList.add('playing-animation');
                } else {
                    radioBody.classList.remove('playing-animation');
                }
            }
        }
    });
};

function initRadioNoise() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (!noiseNode) {
        const bufferSize = 2 * audioContext.sampleRate;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;
        noiseGain = audioContext.createGain();
        noiseGain.gain.value = noiseVolume.value;
        noiseNode.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseNode.start();
    }
}

// Функція вилучення чистого ID відео з будь-якого посилання YouTube
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Клік на кнопку "Увімкнути радіохвилю"
playBtn.addEventListener('click', () => {
    const urlInput = searchInput.value.trim();
    const videoId = extractVideoId(urlInput);

    if (videoId && youtubePlayer) {
        initRadioNoise(); // Миттєво вмикаємо тріск радіо хвилі
        
        youtubePlayer.loadVideoById(videoId); // Запускаємо звук у прихованому плеєрі
        
        document.getElementById('track-title').innerText = "Радіохвиля спіймана!";
        document.getElementById('track-status').innerText = "Музика грає з перешкодами...";
        
        // Робимо красиву чисту заставку замість чорного вікна з помилкою YouTube
        const tvScreen = document.getElementById('music-frame');
        if (tvScreen) {
            tvScreen.innerHTML = "<div style='color:#00ff66; text-align:center; padding-top:45px; font-size:14px; letter-spacing: 2px;'>LIVE RADIO MODE</div>";
        }
    } else {
        document.getElementById('track-title').innerText = "Помилка сигналу";
        document.getElementById('track-status').innerText = "Вставте правильне посилання YouTube";
    }
});

noiseVolume.addEventListener('input', (e) => {
    if (noiseGain) {
        noiseGain.gain.value = e.target.value;
    }
});

function updatePlaylistUI() {
    playlistItems.innerHTML = "";
    myPlaylist.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerText = `Збережена хвиля №${index + 1}`;
        li.addEventListener('click', () => {
            searchInput.value = track;
            playBtn.click();
        });
        playlistItems.appendChild(li);
    });
}

addToPlaylistBtn.addEventListener('click', () => {
    const currentUrl = searchInput.value.trim();
    if (currentUrl && extractVideoId(currentUrl) && !myPlaylist.includes(currentUrl)) {
        myPlaylist.push(currentUrl);
        localStorage.setItem('radio_playlist', JSON.stringify(myPlaylist));
        updatePlaylistUI();
    }
});

updatePlaylistUI();
