'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { VoiceRecordingState } from '@/lib/types';

interface MicButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function MicButton({ onRecordingComplete, disabled = false }: MicButtonProps) {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    audioBlob: null,
    transcription: '',
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          audioBlob,
          isProcessing: true 
        }));
        onRecordingComplete(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone. Please check permissions.' 
      }));
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, state.isRecording, startRecording, stopRecording]);

  const getButtonContent = () => {
    if (state.isProcessing) {
      return <Loader2 className="w-8 h-8 animate-spin" />;
    }
    if (state.isRecording) {
      return <MicOff className="w-8 h-8" />;
    }
    return <Mic className="w-8 h-8" />;
  };

  const getButtonClass = () => {
    let baseClass = 'mic-button';
    if (state.isRecording) {
      baseClass += ' listening';
    }
    if (disabled || state.isProcessing) {
      baseClass += ' opacity-50 cursor-not-allowed';
    }
    return baseClass;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleClick}
        disabled={disabled || state.isProcessing}
        className={getButtonClass()}
        aria-label={state.isRecording ? 'Stop recording' : 'Start recording'}
      >
        {getButtonContent()}
      </button>
      
      {state.isRecording && (
        <div className="text-center">
          <p className="text-sm text-white opacity-80 animate-pulse">
            Recording... Tap to stop
          </p>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {state.isProcessing && (
        <p className="text-sm text-white opacity-80">
          Processing your voice...
        </p>
      )}
      
      {state.error && (
        <p className="text-sm text-red-300 text-center max-w-xs">
          {state.error}
        </p>
      )}
    </div>
  );
}
