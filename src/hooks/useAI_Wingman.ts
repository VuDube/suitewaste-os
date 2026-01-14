import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AIClassificationResult } from '@shared/types';
export function useAI_Wingman() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);
  const classifyMaterial = useCallback(async (weight: number, context?: string): Promise<AIClassificationResult | null> => {
    return toast.promise(
      api<AIClassificationResult>('/api/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ weight, context })
      }),
      {
        loading: 'AI analyzing material stream...',
        success: (res) => `Identified as ${res.material_type} (${Math.floor(res.confidence * 100)}%)`,
        error: 'Classification failed'
      }
    );
  }, []);
  const processIntent = useCallback(async (text: string) => {
    try {
      const res = await api<{ response: string }>('/api/ai/wingman-voice', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      speak(res.response);
      return res.response;
    } catch (e) {
      return null;
    }
  }, [speak]);
  const listen = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-ZA';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processIntent(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  }, [processIntent]);
  return { isListening, isSpeaking, listen, speak, classifyMaterial };
}