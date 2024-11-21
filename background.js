console.log("This is background.js");


chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters); // saves video id from yt video
        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            videoId: urlParameters.get("v"),
        })
    };
});


// gets message from contentscript and initiates data sourcing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === "start_capture") {
        getData(message.videoTitle);
    }
});


const getData = async function(videoTitle) {
    const token = await getSpotifyToken();
    const {spotifyId, coverArt, spotifyURL, songName, artistName} = await getSpotifyId(videoTitle, token);
    if (spotifyId) {
        const songData = await getSongData(spotifyId, token);
        console.log(spotifyId);
        console.log(coverArt);
        sendToPopup(songData, coverArt, spotifyURL, songName, artistName);
    } else {
        sendToPopup("no_match", "_", "_", "_", "_");
    }
    
}

const getSpotifyId = async (songName, token) => {
    let spotifyId = "";
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(songName)}&type=track&limit=1`;

    return fetch(url, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error (`Request failed with status code ${response.status}`)
        }
        return response.json();
    })
    .then(data => { // include logic to check if search results on spotify match the YouTube Video Title
        const id = data["tracks"]["items"][0]["id"];
        const coverPic = data["tracks"]["items"][0]["album"]["images"][0]["url"]; // image data like this: {height: 640, url: '...', width: 640}
        const spotifyLink = data["tracks"]["items"][0]["external_urls"]["spotify"];
        console.log(data["tracks"]["items"][0]);
        const songName = data["tracks"]["items"][0]["name"];
        const artistName = data["tracks"]["items"][0]["artists"][0]["name"];
        return {spotifyId: id, coverArt: coverPic, spotifyURL: spotifyLink, songName: songName, artistName: artistName};
    }
    ) 
    .catch(error => {
        console.log("Error fetching spotify id: ", error);
        return error;
    })
}

const getSpotifyToken = () => {
        const client_id = "efa152fc7f9240f3a1c5b2b4c1a18382";
        const client_secret = "9c62499952714fc38e443e8955adbc77";
        const auth_url = 'https://accounts.spotify.com/api/token';
        const auth_data = 'Basic ' + btoa(client_id + ':' + client_secret);
        let token = 0;

        // send http get request to spotify token api
        return fetch(auth_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": auth_data
            },
            body: 'grant_type=client_credentials'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => token = data.access_token) // returns the fetched token
        .catch(error => {
            console.error("Error fetching Spotify token: ", error)
            return "";
    })
}

const getSongData = async (spotifyId, token) => {
    const url = `https://api.spotify.com/v1/audio-analysis/${spotifyId}`;

    return fetch(url, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json()
    })
    .then(data => data) // returns the fetched song data 
    .catch(error => {
        console.error("Error fetching the song data from spotify: ", error);
        return "";
    })
}


const sendToPopup = async (data, coverArt, spotifyURL, songName, artistName) => {
    // clear storage
    //await resetStorage();
    console.log("Open Popup");
    await chrome.action.openPopup();
    await chrome.storage.local.set({ data: data, coverArt: coverArt, spotifyURL: spotifyURL, songName: songName, artistName: artistName})
    chrome.runtime.sendMessage({ message: "start_popup"}, async (response) => {
        reqCode = response;
        console.log("Response from popup: ", reqCode);
    });
};


/* const resetStorage = () => {
    return new Promise((resolve, reject) => {
        // reset chrome local storage
        chrome.storage.local.clear(function() {
            let error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
                reject(error);
            }
            chrome.storage.sync.clear(() => {
                console.log("Storage cleared");
                resolve();
            });
        });
    });
} */