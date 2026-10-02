// Auto-Captions using Web Speech API
export interface Caption {
  text: string;
  startTime: number;
  endTime: number;
}

export function startCaptions(
  onCaption: (caption: Caption) => void,
  onError: (error: string) => void
): () => void {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("ဒီ Browser က Speech Recognition ကို မထောက်ပံ့ပါ။");
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let startTime = Date.now();

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        onCaption({
          text: transcript,
          startTime: startTime,
          endTime: Date.now(),
        });
        startTime = Date.now();
      }
    }
  };

  recognition.onerror = (event: any) => {
    onError("Error: " + event.error);
  };

  recognition.start();
  return () => recognition.stop();
}