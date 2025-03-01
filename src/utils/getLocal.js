// Selecting a folder and fetching all mp3 files from the folder and return the same as an array of mp3 files
import { parseBlob } from "music-metadata";

async function selectFolder() {
  try {
    const storageHandle = await window.showDirectoryPicker();
    const files = [];

    for await (const entry of storageHandle.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".mp3")) {
        const file = await entry.getFile();
        const objectURL = URL.createObjectURL(file);
        
        // Extract metadata
        const metadata = await parseBlob(file);

        files.push({
          name: metadata.common.title || entry.name.replace(".mp3", ""),
          artist: metadata.common.artist || "Unknown Artist",
          album: metadata.common.album || "Unknown Album",
          duration: metadata.format.duration?.toFixed(2) || "0",
          cover: metadata.common.picture ? URL.createObjectURL(new Blob([metadata.common.picture[0].data])) : null,
          audio: objectURL,
        });
      }
    }

    return files;
  } catch (error) {
    console.error("Error selecting folder:", error);
  }
}
export default selectFolder;