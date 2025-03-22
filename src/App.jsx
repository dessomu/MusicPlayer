import { useState, useRef, useEffect } from "react";
import { Play, Pause, Repeat, Volume2,SkipBack,SkipForward } from "lucide-react";
import { Howl } from "howler";
import Lottie from "lottie-react";
import animationData from "./assets/playanimation.json";
import visualAnim from "./assets/visual.json";
import "./App.scss";
import selectFolder from "./utils/getLocal";

const App = () => {
  const [songsFetched, setSongsFetched] = useState([])
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(songsFetched[0]);
  const [volume, setVolume] = useState(0.8);
  const [isRepeat, setIsRepeat] = useState(false);
  const soundRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update progress as the audio plays
  useEffect(() => {
    if (!soundRef.current) return;
  
    const updateProgress = () => {
      setProgress(soundRef.current.seek()); //Use Howler's `seek()` to seek progress
      setDuration(soundRef.current.duration()); // Update duration as well
    };
    // Start updating progress when audio plays
    const interval = setInterval(updateProgress, 500);
    soundRef.current.on("play", updateProgress); // Ensure progress updates when audio starts playing
  
    return () => {
      clearInterval(interval); // Clear the interval on unmount
      soundRef.current?.off("play", updateProgress); // Cleanup event listener
    };
  }, [isPlaying]);
  
  // Function to handle slider change and seek audio
  const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (soundRef.current) {
          soundRef.current.seek(newTime); // Seek to new position
          setProgress(newTime);
        }
  };
  //Searching for local songs and updating songsFetched with local songs
  const loadLocalSongs = async () => {
    const localSongs = await selectFolder();
    if (localSongs) {
      const allSongs = [...songsFetched, ...localSongs];
      setSongsFetched(allSongs);

    }
  };
  //Fetching songs from Jamendo API
  async function getSongs(){
    try {
      const response = await fetch (`https://api.jamendo.com/v3.0/albums/tracks/?client_id=803721c8&format=jsonpretty&limit=1&artist_name=we+are+fm
  `)
  if (response.ok) {
    const result = await response.json();
    setSongsFetched(result.results[0].tracks);
    setCurrentTrack(result.results[0].tracks[0]);
  }
    } catch (error) {
      console.log(error.message);
      
    }
  }
  useEffect(() => {
    getSongs();
  }, [])

  useEffect(() => {
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), 
     url(${currentTrack?.cover || "./vite.svg"})`;
    document.body.style.backgroundSize = "contain";
    document.body.style.backgroundPositionX= "right";
    return () => {
      document.body.style.backgroundImage = ""; // Reset on unmount if needed
    };
  }, [currentTrack]);

  //crating a new Howl instance for the current track and playing the audio
  useEffect(() => {
    if (!currentTrack || !currentTrack.audio) return;

    if (soundRef.current) {
      soundRef.current.stop();
    }
    soundRef.current = new Howl({
      src: [ currentTrack?.audio],
      html5: true,
      volume,
      onend: () => {
        if (!isRepeat) nextSong();
      },
    });

    if (isPlaying) soundRef.current.play();
  }, [currentTrack]);

  //updating volume of the audio when volume changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
  }, [volume]);

  //function to play or pause the audio
  const togglePlay = () => {
    if (!soundRef.current) return;
  
    if (!soundRef.current.playing()) {
      soundRef.current.play();
      setIsPlaying(true);
    } else {
      soundRef.current.pause();
      setIsPlaying(false);
    }
  };

  const nextSong = () => {
    let nextIndex = (songsFetched.indexOf(currentTrack) + 1) % songsFetched.length;
    setCurrentTrack(songsFetched[nextIndex]);
    setIsPlaying(true);
  };

  const prevSong = () => {
    let prevIndex = (songsFetched.indexOf(currentTrack) - 1 + songsFetched.length) % songsFetched.length;
    setCurrentTrack(songsFetched[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <div className="music-player">
      {/* Sidebar */}
      <aside className="sidebar">
      <Lottie  animationData={visualAnim} style={{width:"100%",height:"100vh"}} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} loop={isPlaying? true:false} />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="album-info">
          <img src={currentTrack?.cover || "./vite.svg"} alt="Album Cover" className="album-art" />
          <div className="text">
            <p className="small">Single</p>
            <h1 className="title">{currentTrack?.name.length > 18 ? currentTrack?.name.slice(0,18)+"...":currentTrack?.name}</h1>
            <p className="details">{currentTrack?.album || "artist"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <button className="play-button" onClick={togglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button className="control-icon downloaded" onClick={loadLocalSongs}>Offline</button>
        </div>

        {/* Song List */}
        <div className="song-list">
          <div className="header">
            <span>Title</span>
            <span>Duration</span>
          </div>
          {songsFetched.map((song, index) => (
            <div
              key={index}
              className={`song ${currentTrack.name === song.name ? "active" : ""}`}
              onClick={() => {setCurrentTrack(song);
                setIsPlaying(true);
              }}
              onTouchEnd={() => {setCurrentTrack(song);
                setIsPlaying(true);
              }}
            >
              <span className="song-name" >{song.name.length > 38 ? song.name.slice(0,35)+"...":song.name} </span>
              <div style={{ width:"20px", height:"20px",marginRight:"10px"}}>
                 <Lottie style={{display:currentTrack.name === song.name?  "block":"none"}} animationData={animationData} loop={isPlaying?true:false} />
              </div>
              <span style={{marginRight:"10px"}}> {(song.duration/60).toFixed(2)} min</span>
            </div>
          ))}
        </div>
      </main>

      <div className="secondary-content">
        <img src={currentTrack?.cover || "./vite.svg"} alt="Album Cover" className="cover-art" />
      </div>

      {/* Bottom Player */}
      <footer className="footer">
       <input
        type="range"
        min="0"
        step="0.1"
        max={duration}
        value={progress}
        onChange={handleSeek}
        className="progress-slider"
       />
        <div className="player-controls">
          <Repeat className={`control-icon ${isRepeat ? "active" : ""}`} onClick={() => setIsRepeat(!isRepeat)} />
          <button className="skip-btn" onClick={prevSong}><SkipBack/></button>
          <button onClick={togglePlay} className="play-pause">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="skip-btn" onClick={nextSong}><SkipForward/></button>
        </div>
        <div className="volume">
          <Volume2 className="control-icon" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} className="volume-slider" />
        </div>
      </footer>
    </div>
  );
};

export default App;
