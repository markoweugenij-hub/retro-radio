let audioContext;
let noiseNode;
let noiseGain;

let myPlaylist = JSON.parse(localStorage.getItem('radio_playlist')) || [];

const playBtn = document.getElementById('play-btn');
const searchInput = document.getElementById('search-input');
const noiseVolume = document.getElementById('noise-volume');
const addToPlaylistBtn = document.getElementById('add-to-playlist');
const playlistItems = document.getElementById('playlist-items');
const radioBody = document.getElementById('radio-body');
const musicFrame = document.getElementById('music-frame');

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

// Залізобетонний пошук по світовій базі музики в обхід усіх блокувань
playBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        initRadioNoise(); // Миттєво запускаємо тріск радіо хвилі
        
        document.getElementById('track-title').innerText = query;
        document.getElementById('track-status').innerText = "Радіосигнал стабільний";
        radioBody.classList.add('playing-animation'); // Запускаємо качання радіо

        // Вбудовуємо офіційний музичний віджет Deezer, який шукає трек за назвою і грає його на сайті
        musicFrame.innerHTML = `<iframe title="deezer-widget" src="https://deezer.com{encodeURIComponent(query)}?tracklist=false" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media; clipboard-write"></iframe>`;
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
    const blockList = ["Знайдіть трек", "Налаштування..."];
    if (currentTrack && !blockList.includes(currentTrack) && !myPlaylist.includes(currentTrack)) {
        myPlaylist.push(currentTrack);
        localStorage.setItem('radio_playlist', JSON.stringify(myPlaylist));
        updatePlaylistUI();
    }
});

updatePlaylistUI();
