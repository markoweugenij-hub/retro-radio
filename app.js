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

window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('yt-player-visible', {
        height: '100%',
        width: '100%',
        videoId: '', 
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onStateChange': (event) => {
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

// Залізобетонний пошук без помилок Playback ID
playBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        initRadioNoise(); // Миттєво вмикаємо тріск радіо хвилі
        
        document.getElementById('track-title').innerText = query;
        document.getElementById('track-status').innerText = "Сигнал радіо стабільний";
        radioBody.classList.add('playing-animation');

        // Використовуємо офіційну вбудовану систему пошуку YouTube: вона сама шукає назву і відтворює перший трек прямо в iframe
        const tvScreen = document.getElementById('yt-player-visible');
        tvScreen.innerHTML = `<iframe width="100%" height="100%" src="https://youtube.com{encodeURIComponent(query)}&autoplay=1" frameborder="0" allow="autoplay" allowfullscreen></iframe>`;
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
    const blockList = ["Знайдіть трек", "Хвилю втрачено", "Налаштування...", "Помилка ТБ сигналу"];
    if (currentTrack && !blockList.includes(currentTrack) && !myPlaylist.includes(currentTrack)) {
        myPlaylist.push(currentTrack);
        localStorage.setItem('radio_playlist', JSON.stringify(myPlaylist));
        updatePlaylistUI();
    }
});

updatePlaylistUI();
