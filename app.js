async function sendMessage() {
    const input = document.getElementById("userInput").value;
    const chatBox = document.getElementById("chatBox");

    // Show user message
    chatBox.innerHTML += `<div><b>You:</b> ${input}</div>`;

    // Call Hugging Face Space API
    const response = await fetch("https://atharva-8050-my-diary-ai.hf.space/run/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            data: [input]
        })
    });

    const result = await response.json();
    const botReply = result.data[0];

    // Show bot reply
    chatBox.innerHTML += `<div><b>Diary AI:</b> ${botReply}</div>`;
    document.getElementById("userInput").value = "";
}




