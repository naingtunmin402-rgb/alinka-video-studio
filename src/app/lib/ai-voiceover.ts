// Browser-based Voiceover (No API needed)
export async function generateVoiceover(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("ဒီ Browser က Speech Synthesis ကို မထောက်ပံ့ပါ။"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error("Voiceover Error: " + e.error));

    window.speechSynthesis.speak(utterance);
  });
}

export const VOICES = [
  { id: "browser", name: "Browser Voice (Free)" },
];