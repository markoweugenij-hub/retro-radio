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

// 1. Створюємо контейнер для прихованого плеєра YouTube прямо на сторінці
const ytContainer = document.createElement('div');
ytContainer.id = 'yt-player-invisible';
ytContainer.style.position = 'absolute';
ytContainer.style.top = '-9999px'; // Ховаємо його далеко за межі екрана, щоб ніхто не бачив відео
document.body.appendChild(ytContainer);

// 2. Підключаємо офіційний скрипт YouTube API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script');
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. Коли плеєр YouTube завантажиться, ініціалізуємо його
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('yt-player-invisible', {
        height: '1',
        width: '1',
        videoId: '', // Порожній на старті
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1
        },
        events: {
            'onStateChange': (event) => {
                // Коли трек починає реально грати — запускаємо анімацію радіоприймача
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

// Функція стабільного пошуку: використовує надійне відкрите API для пошуку ID відео в обхід блокувань
async function searchAndPlayHidden(trackName) {
    document.getElementById('track-title').innerText = "Налаштування...";
    document.getElementById('track-status').innerText = "Шукаємо всесвітню хвилю...";
    initRadioNoise(); // Миттєво вмикаємо тріск радіо

    try {
        // Отримуємо результати пошуку з YouTube через стабільний проксі-сервер, який працює і на GitHub
        const searchUrl = `https://allorigins.win{encodeURIComponent('https://youtube.com' + trackName)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        // Знаходимо ID найпершого відео у видачі
        const match = data.contents.match(/"videoId":"([^"]+)"/);
        
        if (match && match) {
            const videoId = match;
            
            // Наказуємо нашому таємному плеєру завантажити цей трек
            youtubePlayer.loadVideoById(videoId);
            
            document.getElementById('track-title').innerText = trackName;
            document.getElementById('track-status').innerText = "Радіосигнал стабільний";
        } else {
            document.getElementById('track-title').innerText = "Хвилю втрачено";
            document.getElementById('track-status').innerText = "Спробуйте іншу назву";
        }
    } catch (error) {
        console.error(error);
        document.getElementById('track-title').innerText = "Помилка радіохвилі";
        document.getElementById('track-status').innerText = "Спробуйте ще раз";
    }
}

playBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query && youtubePlayer) {
        searchAndPlayHidden(query);
    }
});

noiseVolume.addEventListener('input', (e) => {
    if (noiseGain) {
        noiseGain.gain.value = e.target.value;
    }
});

function updatePlaylistUI() {
    playlistItems.innerHTML = "";
    myPlaylist.forEach((track) => {
        const li = document.createElement('li');
        li.innerText = track;
        li.addEventListener('click', () => {
            searchInput.value = track;
            playBtn.click();
        });
        playlistItems.appendChild(li);
    });
}

addToPlaylistBtn.addEventListener('click', () => {
    const currentTrack = document.getElementById('track-title').innerText;
    const blockList = ["Знайдіть трек", "Хвилю втрачено", "Налаштування...", "Помилка радіохвилі"];
    if (currentTrack && !blockList.includes(currentTrack) && !myPlaylist.includes(currentTrack)) {
        myPlaylist.push(currentTrack);
        localStorage.setItem('radio_playlist', JSON.stringify(myPlaylist));
        updatePlaylistUI();
    }
});

updatePlaylistUI();
