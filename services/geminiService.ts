import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// A fallback list of songs in case API fails or for initial state
const FALLBACK_SONGS: Song[] = [
  { id: '1', title: "Neon Horizon", artist: "Cyber Drifter", genre: "Synthwave", duration: "3:42", bpm: 128 },
  { id: '2', title: "Blue Velocity", artist: "Hyper Drive", genre: "Trance", duration: "4:15", bpm: 140 },
  { id: '3', title: "Digital Soul", artist: "Echo Proxy", genre: "Ambient Glitch", duration: "2:58", bpm: 95 },
  { id: '4', title: "Quantum Leap", artist: "Flux Capacitor", genre: "Drum & Bass", duration: "5:01", bpm: 174 },
];

export const generateNextSong = async (currentSong: Song | null): Promise<Song> => {
  try {
    const prompt = currentSong 
      ? `Generate a futuristic, sci-fi themed song that would naturally follow "${currentSong.title}" by ${currentSong.artist}. The genre is ${currentSong.genre}. Think zooming through space, blue neon lights, high tech.`
      : "Generate a futuristic, sci-fi themed song for a high-tech radio station. Think zooming through space, blue neon lights.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            genre: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            duration: { type: Type.STRING, description: "Format MM:SS" }
          },
          required: ["title", "artist", "genre", "bpm", "duration"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    if (!data.title) throw new Error("Invalid response");

    return {
      id: crypto.randomUUID(),
      title: data.title,
      artist: data.artist,
      genre: data.genre,
      bpm: data.bpm,
      duration: data.duration
    };

  } catch (error) {
    console.warn("Gemini generation failed, using fallback", error);
    // Return a random fallback that isn't the current one if possible
    const next = FALLBACK_SONGS[Math.floor(Math.random() * FALLBACK_SONGS.length)];
    return { ...next, id: crypto.randomUUID() }; // Ensure unique ID
  }
};

export const generatePlaylistBatch = async (count: number = 3): Promise<Song[]> => {
    // Generate a batch to populate the queue
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a list of ${count} futuristic, cyber-themed song titles and artists.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                         properties: {
                            title: { type: Type.STRING },
                            artist: { type: Type.STRING },
                            genre: { type: Type.STRING },
                            bpm: { type: Type.INTEGER },
                            duration: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const list = JSON.parse(response.text || "[]");
        return list.map((item: any) => ({
            ...item,
            id: crypto.randomUUID()
        }));
    } catch (e) {
        return FALLBACK_SONGS.slice(0, count);
    }
}
