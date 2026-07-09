let audioContext;
let noiseNode;
let noiseGain;
let audioTrack = new Audio();
audioTrack.crossOrigin = "anonymous"; 

let myPlaylist = JSON.parse(localStorage.getItem('radio_playlist')) || [];

const playBtn = document.getElementById('play-btn');
const searchInput = document.getElementById('search-input');
const noiseVolume = document.getElementById('noise-volume');
const addToPlaylistBtn = document.getElementById('add-to-playlist');
const playlistItems = document.getElementById('playlist-items');
const radioBody = document.getElementById('radio-body');

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

async function searchAndPlayRadio(stationName) {
    document.getElementById('track-title').innerText = "Налаштування...";
    document.getElementById('track-status').innerText = "Шукаємо радіохвилю...";
    initRadioNoise(); 

    try {
        // Подключаемся к мировой бесплатной базе радиостанций
        const response = await fetch(`https://radio-browser.info{encodeURIComponent(stationName)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const station = data[0];
            audioTrack.pause();
            audioTrack.src = station.url_resolved || station.url; // Чистый живой поток
            
            audioTrack.play().then(() => {
                document.getElementById('track-title').innerText = station.name;
                document.getElementById('track-status').innerText = "Сигнал стабільний";
                radioBody.classList.add('playing-animation'); // Радио начинает прыгать в такт
            }).catch(e => {
                console.log(e);
                document.getElementById('track-title').innerText = "Помилка сигналу";
                document.getElementById('track-status').innerText = "Натисніть кнопку ще раз";
            });
        } else {
            document.getElementById('track-title').innerText = "Хвилю не знайдено";
            document.getElementById('track-status').innerText = "Спробуйте: Kiss, Hit, Rock або Jazz";
            radioBody.classList.remove('playing-animation');
        }
    } catch (error) {
        console.error(error);
        document.getElementById('track-title').innerText = "Помилка мережі";
    }
}

playBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchAndPlayRadio(query);
    }
});

audioTrack.addEventListener('pause', () => radioBody.classList.remove('playing-animation'));
audioTrack.addEventListener('ended', () => radioBody.classList.remove('playing-animation'));

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
    const blockList = ["Оберіть хвилю", "Хвилю не знайдено", "Налаштування...", "Помилка мережі", "Помилка сигналу"];
    if (currentTrack && !blockList.includes(currentTrack) && !myPlaylist.includes(currentTrack)) {
        myPlaylist.push(currentTrack);
        localStorage.setItem('radio_playlist', JSON.stringify(myPlaylist));
        updatePlaylistUI();
    }
});

updatePlaylistUI();
