console.log("This is popup.js");

document.addEventListener('DOMContentLoaded', () => {
    const memeAmount = 5;
    const randomNumber = Math.floor(Math.random() * (memeAmount +1)) + 1;
    const randomMeme = chrome.runtime.getURL(`assets/meme${randomNumber}.jpeg`);
    const placeHolderMeme = document.getElementById("coverart");
    placeHolderMeme.src = randomMeme;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.message === "start_popup") {
        console.log("popup gets message");
        let reqCode = "";
        chrome.storage.local.get(['data', 'coverArt', 'spotifyURL', 'songName', 'artistName'], (result) => {
            console.log(result.data);
            if (result.data && result.coverArt && result.spotifyURL && result.songName && result.artistName) {
                reqCode = displayData(result.data, result.coverArt, result.spotifyURL, result.songName, result.artistName);
                console.log(reqCode);
                
                sendResponse(reqCode);
            } else {
                reqCode = "Popup did not receive any data from background script.";
                sendResponse(reqCode);
            };
        });
        return true;
    };
})


const displayData = (data, coverArt, spotifyURL, songName, artistName) => {
    const bpmElement = document.getElementById("bpm");
    const keyElement = document.getElementById("key");
    const timeSignatureElement = document.getElementById("time-signature")
    const errorMsg = document.getElementById("error-msg");
    const coverArtElement = document.getElementById("coverart");
    const spotifyInfo = document.getElementById("spotifyInfo");
    const spotifyButton = document.getElementById("spotify-btn");
    
    if (data === "no_match") {
        errorMsg.textContent = "No matching songs found in database.";
        return "No data to display found in database";
    }
    else {
        try {
            const bpm = Math.round(data["track"]["tempo"]);
            const keys = ["C Major / A Minor", "C# Major / A# Minor", "D Major / B Minor", "D# Major / C Minor", "E Major / C# Minor", "F Major / D Minor", "F# Major / D# Minor", "G Major / E Minor", "G# Major / F Minor", "A Major / F# Minor", "A# Major / G Minor", "B Major / G# Minor", "No Key-Data was found"]
            const key = keys[data["track"]["key"]];
            const timeSignature = data["track"]["time_signature"] + '/4';
    
            bpmElement.textContent = "Beats per Minute: " + bpm;
            keyElement.textContent = "Key: " + key;
            timeSignatureElement.textContent = "Time Signature: " + timeSignature;
            errorMsg.textContent = "";

            coverArtElement.visibility = "visible";
            coverArtElement.src = coverArt;

            spotifyInfo.textContent = songName + " - " + artistName;
            spotifyButton.href = spotifyURL;
            
            return "success";
        } catch (error) {
            return "Error: " + error;
        }
    };
}
