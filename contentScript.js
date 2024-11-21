(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";

    chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
        const { type, value, videoId } = obj;

        if (type === "NEW") {
            currentVideo = videoId; // saves current video id in variable
            newVideoLoaded();
        }
    });

    const addNewAnalysisEventHandler = async () => {
        const videoTitle = document.querySelector("#title > h1 > yt-formatted-string").innerText;
        chrome.runtime.sendMessage({ message: "start_capture", videoTitle: videoTitle})
    }

    const newVideoLoaded = () => {
        const analysisButtonExists = document.getElementById("analysis-button");
        console.log("Analysis Button exists", analysisButtonExists);

        // checking if a analysis button already exists in the youtube UI
        if (!analysisButtonExists) {

            // creating the button
            const analysisButton = document.createElement("img");
            analysisButton.src = chrome.runtime.getURL("assets/keywizzard_hd.png");
            analysisButton.className = "ytp-button " + "analysis-btn";
            analysisButton.title = "Click to analyse the current audio";
            analysisButton.id = "analysis-button"

            // getting ui elements from youtube
            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];

            // adding the button to the youtube ui elements in the youtube player
            youtubeLeftControls.appendChild(analysisButton);
            analysisButton.addEventListener("click", addNewAnalysisEventHandler);
        }
    }

    newVideoLoaded();

})();