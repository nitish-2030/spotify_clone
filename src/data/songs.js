const SAMPLE = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";

export const songs = [
  { id: 1, title: "Neon Skyline", artist: "Aria Vale", src: `${SAMPLE}1.mp3`, cover: "linear-gradient(135deg, #ff512f, #dd2476)" },
  { id: 2, title: "Paper Boats", artist: "Kabir Rao", src: `${SAMPLE}2.mp3`, cover: "linear-gradient(135deg, #1d976c, #93f9b9)" },
  { id: 3, title: "Midnight Chai", artist: "The Quiet Hours", src: `${SAMPLE}3.mp3`, cover: "linear-gradient(135deg, #4776e6, #8e54e9)" },
  { id: 4, title: "Golden Hour", artist: "Mira Sen", src: `${SAMPLE}4.mp3`, cover: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { id: 5, title: "Static Hearts", artist: "Echo Lane", src: `${SAMPLE}5.mp3`, cover: "linear-gradient(135deg, #3a1c71, #d76d77)" },
  { id: 6, title: "Monsoon Letters", artist: "Ishaan Roy", src: `${SAMPLE}6.mp3`, cover: "linear-gradient(135deg, #0f2027, #2c5364)" },
  { id: 7, title: "Soft Landing", artist: "Nova & Co.", src: `${SAMPLE}7.mp3`, cover: "linear-gradient(135deg, #e96443, #904e95)" },
  { id: 8, title: "Highway Radio", artist: "Dev Malhotra", src: `${SAMPLE}8.mp3`, cover: "linear-gradient(135deg, #00b4db, #0083b0)" },
];

export const playlists = [
  { id: "p1", title: "Late Night Drive", description: "Dim lights, empty roads and slow tunes.", song: songs[0] },
  { id: "p2", title: "Morning Focus", description: "Calm sounds to start the day right.", song: songs[1] },
  { id: "p3", title: "Chai & Classics", description: "A cup of tea with some retro tunes.", song: songs[2] },
  { id: "p4", title: "Sunset Chill", description: "Sit back and let the evening pass.", song: songs[3] },
  { id: "p5", title: "Rainy Day Mix", description: "For windows, puddles and warm blankets.", song: songs[5] },
  { id: "p6", title: "Road Trip Radio", description: "Songs to sing along with the windows down.", song: songs[7] },
  { id: "p7", title: "Lo-fi Study", description: "Beats to keep you in the zone.", song: songs[6] },
  { id: "p8", title: "Feel Good Friday", description: "Upbeat tracks to kick off the weekend.", song: songs[4] },
];