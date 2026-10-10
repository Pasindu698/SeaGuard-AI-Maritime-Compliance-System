import { useCallback, useEffect, useRef, useState } from "react";

export default function useVoiceInput({ language, onTranscript }) {
  const recognitionRef = useRef(null);
  const transcriptCallbackRef = useRef(onTranscript);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  useEffect(() => {
    transcriptCallbackRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Speech recognition is not supported. Please try Chrome or Edge."
      );
      return;
    }

    setVoiceError("");
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + " ";
        }
      }

      if (transcript.trim()) {
        transcriptCallbackRef.current?.(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setVoiceError(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      setVoiceError(error.message || "Unable to start microphone.");
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [language]);

  return {
    isListening,
    voiceError,
    startListening,
    stopListening,
    clearVoiceError: () => setVoiceError(""),
  };
}