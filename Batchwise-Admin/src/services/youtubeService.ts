const YOUTUBE_API_KEY = "AIzaSyBqCRemdPA42m-g5UzkE__VTR74Vcd75Os";

export interface YouTubeVideo {
    title: string;
    videoId: string;
    duration?: number;
    description?: string;
    thumbnail?: string;
    type?: 'video' | 'playlist' | 'channel';
    playlistId?: string;
    channelId?: string;
}

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://pipedapi.syncpundit.io",
    "https://api-piped.mha.fi",
    "https://piped-api.garudalinux.org",
    "https://pipedapi.rivo.lol",
    "https://ytapi.dc09.ru",
    "https://pipedapi.colinslegacy.com",
    "https://yapi.vyper.me",
    "https://api.looleh.xyz",
    "https://piped-api.cfe.re",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.nosebs.ru",
    "https://pipedapi-libre.kavin.rocks",
    "https://pa.mint.lgbt",
    "https://pa.il.ax",
    "https://piped-api.privacy.com.de",
    "https://pipedapi.in.projectsegfau.lt",
    "https://pipedapi.us.projectsegfau.lt",
    "https://watchapi.whatever.social",
    "https://api.piped.privacydev.net",
    "https://pipedapi.palveluntarjoaja.eu",
    "https://pipedapi.smnz.de",
    "https://pipedapi.adminforge.de",
    "https://api.piped.yt",
    "https://pipedapi.drgns.space",
    "https://pipedapi.owo.si",
    "https://pipedapi.ducks.party",
    "https://piped-api.codespace.cz"
];

const getShuffledInstances = () => {
    return [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
};

export const fetchPlaylistVideos = async (playlistId: string): Promise<YouTubeVideo[]> => {
    const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY || YOUTUBE_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
        try {
            console.log("Using official YouTube Data API for playlist fetch...");
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items) {
                    return data.items.map((item: any) => ({
                        title: item.snippet.title,
                        videoId: item.snippet.resourceId.videoId,
                        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
                    })) as YouTubeVideo[];
                }
            } else {
                const errorData = await response.json();
                console.warn("Official YouTube API Playlist fetch failed:", errorData.error?.message || response.statusText);
            }
        } catch (error) {
            console.error("Error calling official YouTube API for playlist:", error);
        }
    }

    let lastError: any;
    const shuffledInstances = getShuffledInstances();

    for (const instance of shuffledInstances) {
        try {
            console.log(`Trying Piped instance for playlist: ${instance}`);
            const response = await fetch(`${instance}/playlists/${playlistId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Playlist not found (404)");
                }
                throw new Error(`Instance ${instance} error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.relatedStreams && Array.isArray(data.relatedStreams)) {
                return data.relatedStreams.map((item: any) => {
                    let videoId = '';
                    if (item.url && item.url.includes('v=')) {
                        videoId = item.url.split('v=')[1].split('&')[0];
                    }
                    return {
                        title: item.title,
                        videoId: videoId,
                        duration: item.duration,
                        thumbnail: item.thumbnail
                    } as YouTubeVideo;
                }).filter((v: YouTubeVideo) => v.videoId);
            }
            return [];
        } catch (error: any) {
            console.warn(`Piped instance ${instance} failed:`, error.message);
            lastError = error;
            if (error.message && error.message.includes("Playlist not found")) {
                throw error;
            }
        }
    }

    console.error("All playlist fetch methods failed.");
    throw lastError || new Error("Failed to load playlist. Please ensure the ID is correct and try again.");
};

export const fetchChannelVideos = async (channelId: string): Promise<YouTubeVideo[]> => {
    let lastError: any;
    const shuffledInstances = getShuffledInstances();

    for (const instance of shuffledInstances) {
        try {
            console.log(`Trying Piped instance for channel: ${instance}`);
            const response = await fetch(`${instance}/channels/${channelId}`);

            if (!response.ok) {
                if (response.status === 404) throw new Error("Channel not found");
                throw new Error(`Instance error: ${response.status}`);
            }

            const data = await response.json();

            if (data.relatedStreams && Array.isArray(data.relatedStreams)) {
                return data.relatedStreams.map((item: any) => {
                    let videoId = '';
                    if (item.url && item.url.includes('v=')) {
                        videoId = item.url.split('v=')[1].split('&')[0];
                    }
                    return {
                        title: item.title,
                        videoId: videoId,
                        duration: item.duration,
                        thumbnail: item.thumbnail,
                        type: 'video'
                    } as YouTubeVideo;
                }).filter((v: YouTubeVideo) => v.videoId);
            }
            return [];
        } catch (error: any) {
            lastError = error;
            if (error.message && error.message.includes("Channel not found")) throw error;
        }
    }
    throw lastError || new Error("Failed to load channel videos. Please try again.");
};

export const fetchVideoDescription = async (videoId: string): Promise<string> => {
    const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY || YOUTUBE_API_KEY;

    // 1. Try Official YouTube API first
    if (apiKey && apiKey.trim().length > 0) {
        try {
            console.log(`[YouTubeService] Fetching description for ${videoId} via Official API...`);
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    const desc = data.items[0].snippet.description;
                    console.log(`[YouTubeService] Description found via Official API (${desc?.length || 0} chars)`);
                    return desc || '';
                }
            } else {
                const err = await response.json();
                console.warn("[YouTubeService] Official API error:", err);
            }
        } catch (error) {
            console.error("[YouTubeService] Official API failed, falling back...", error);
        }
    }

    // 2. Fallback to Piped Instances
    console.log(`[YouTubeService] Attempting Piped fallback for ${videoId}...`);
    let lastError: any;
    const shuffledInstances = getShuffledInstances();

    for (const instance of shuffledInstances) {
        try {
            const response = await fetch(`${instance}/streams/${videoId}`);
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const data = await response.json();
            console.log(`[YouTubeService] Success via Piped instance: ${instance}`);
            return data.description || '';
        } catch (error: any) {
            lastError = error;
            console.warn(`[YouTubeService] Piped instance ${instance} failed:`, error.message);
        }
    }

    console.error("[YouTubeService] All extraction methods failed for description.");
    return "";
};

export const searchYouTubeVideos = async (query: string): Promise<YouTubeVideo[]> => {
    const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY || YOUTUBE_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
        try {
            console.log("Using official YouTube Data API for search...");
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video,playlist&key=${apiKey}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data.items) {
                    return data.items.map((item: any) => ({
                        title: item.snippet.title,
                        videoId: item.id.videoId || '',
                        playlistId: item.id.playlistId,
                        channelId: item.id.channelId,
                        type: item.id.playlistId ? 'playlist' : (item.id.channelId ? 'channel' : 'video'),
                        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
                    }));
                }
            } else {
                const errorData = await response.json();
                console.warn("Official YouTube API failed:", errorData.error?.message || response.statusText);
                // Fall through to Piped fallback
            }
        } catch (error) {
            console.error("Error calling official YouTube API:", error);
            // Fall through to Piped fallback
        }
    }

    let lastError: any;
    const shuffledInstances = getShuffledInstances();

    for (const instance of shuffledInstances) {
        try {
            // Encode the query for a safe URL
            const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=all`;
            console.log(`Trying Piped instance for search: ${instance}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Instance ${instance} error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data && data.items && Array.isArray(data.items)) {
                const results = data.items
                    .filter((item: any) => (item.type === 'stream' || item.type === 'playlist' || item.type === 'channel'))
                    .slice(0, 20)
                    .map((item: any) => {
                        let videoId = '';
                        let playlistId = '';
                        let channelId = '';

                        if (item.type === 'stream') {
                            if (item.url.includes('v=')) {
                                videoId = item.url.split('v=')[1].split('&')[0];
                            } else if (item.url.includes('/watch/')) {
                                videoId = item.url.split('/watch/')[1].split('&')[0];
                            }
                        } else if (item.type === 'playlist') {
                            if (item.url.includes('list=')) {
                                playlistId = item.url.split('list=')[1].split('&')[0];
                            }
                        } else if (item.type === 'channel') {
                            channelId = item.url.split('/').pop() || '';
                        }

                        return {
                            title: item.title,
                            videoId: videoId,
                            playlistId: playlistId,
                            channelId: channelId,
                            type: item.type === 'playlist' ? 'playlist' : (item.type === 'channel' ? 'channel' : 'video'),
                            duration: item.duration,
                            thumbnail: item.thumbnail
                        } as YouTubeVideo;
                    })
                    .filter(v => v.videoId || v.playlistId || v.channelId);

                if (results.length > 0) return results;
            }
            // If we got items but none were streams, or empty list, let's try another instance
            // because some instances might return different results or be broken.
            console.warn(`Instance ${instance} returned no video streams for query "${query}"`);
        } catch (error: any) {
            console.warn(`Piped search instance ${instance} failed:`, error.message);
            lastError = error;
        }
    }

    console.error("All search methods failed.");
    throw lastError || new Error("Failed to search videos. All Piped instances are currently unavailable or rate-limited.");
};
