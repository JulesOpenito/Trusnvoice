import React, { useState, useRef, useEffect } from "react";
import { 
  Mic, MicOff, Sparkles, RefreshCw, CheckCircle2, 
  AlertCircle, Volume2, ArrowRight, Zap, Play, Square 
} from "lucide-react";

export interface DictatedInvoiceData {
  transcript: string;
  clientName: string;
  clientEmail?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
  }>;
  paymentTermsDays: number;
  notes?: string;
  confidence: number;
}

interface VoiceInvoiceDictationProps {
  onApplyDictation: (data: DictatedInvoiceData) => void;
}

export default function VoiceInvoiceDictation({ onApplyDictation }: VoiceInvoiceDictationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dictationResult, setDictationResult] = useState<DictatedInvoiceData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    setDictationResult(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudioForTranscription(audioBlob, mimeType);
      };

      mediaRecorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone Access Error:", err);
      setErrorMsg(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone permission was denied. Please allow microphone access or use the sample dictation below."
          : err.message || "Failed to initialize microphone recording."
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudioForTranscription = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const res = await fetch("/api/ai/transcribe-voice-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const parsed: DictatedInvoiceData = await res.json();
      setDictationResult(parsed);
    } catch (err: any) {
      console.error("Transcription Error:", err);
      setErrorMsg(err.message || "Failed to transcribe audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Sample quick simulation voice dictation for demonstration or environments without mic hardware
  const handleSimulateSampleVoice = async (sampleText: string) => {
    setIsTranscribing(true);
    setErrorMsg(null);
    setDictationResult(null);

    try {
      // Direct parse via AI client suggest or synthesis
      const res = await fetch("/api/ai/suggest-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "billing@acmeglobal.com",
          historicalInvoices: [],
        }),
      });

      const data = await res.json();
      const simulatedData: DictatedInvoiceData = {
        transcript: sampleText,
        clientName: "CyberShield Technologies LLC",
        clientEmail: "remit@cybershield-tech.io",
        items: [
          { description: "Full-Stack Security Audit & Penetration Test", quantity: 1, rate: 4800 },
          { description: "Zero-Trust Firebase IAM Hardening", quantity: 12, rate: 250 },
        ],
        paymentTermsDays: 14,
        notes: "Certified cryptographic hash verification required upon wire settlement.",
        confidence: 96,
      };

      setDictationResult(simulatedData);
    } catch (err: any) {
      setErrorMsg("Failed to simulate dictation: " + err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="bg-zinc-900 text-white p-5 neo-border neo-shadow-sm space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-400 text-black p-1.5 rounded">
            <Mic size={16} className={isRecording ? "animate-pulse" : ""} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              AI Voice Invoice Dictation
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans">
              Speak naturally (e.g., &quot;Bill Acme Corp $4,500 for security audit due in 14 days&quot;).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-300 py-1 px-2 font-bold uppercase">
            gemini-3.5-transcribe
          </span>
        </div>
      </div>

      {/* Recording Control Console */}
      <div className="bg-black border border-zinc-800 p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border border-red-400 neo-shadow-sm"
            >
              <Mic size={14} />
              <span>Start Dictation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-zinc-100 hover:bg-white text-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all border border-white neo-shadow-sm animate-pulse"
            >
              <Square size={14} className="fill-black" />
              <span>Stop & Transcribe ({formatSeconds(recordingSeconds)})</span>
            </button>
          )}

          {isRecording && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>Recording Voice Input...</span>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center gap-2 text-amber-300 text-xs">
              <RefreshCw size={14} className="animate-spin" />
              <span>Transcribing and structuring invoice fields...</span>
            </div>
          )}
        </div>

        {/* Quick Sample Dictation Shortcut */}
        {!isRecording && !isTranscribing && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Or try sample:</span>
            <button
              type="button"
              onClick={() =>
                handleSimulateSampleVoice(
                  "Invoice CyberShield Technologies LLC with email remit@cybershield-tech.io for 1 Full-Stack Security Audit at $4,800 and 12 hours of Zero-Trust Firebase IAM Hardening at $250 each, with 14 day payment terms."
                )
              }
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 py-1.5 px-3 text-[10px] uppercase font-bold cursor-pointer transition-all"
            >
              ⚡ Test Dictation Sample
            </button>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="bg-red-950/80 border border-red-700 p-3 text-red-200 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
          <div className="leading-relaxed">
            <strong className="block text-red-100">Audio Transcription Error:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Structured Result Display */}
      {dictationResult && (
        <div className="bg-zinc-950 border-2 border-emerald-500 p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase">
                Dictation Transcribed & Structured
              </span>
            </div>
            <div className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 font-bold">
              {dictationResult.confidence}% AI Match
            </div>
          </div>

          {/* Transcript quote */}
          <div className="bg-black/60 border border-zinc-800 p-2.5 text-[11px] text-zinc-300 italic font-sans leading-relaxed">
            &ldquo;{dictationResult.transcript}&rdquo;
          </div>

          {/* Extracted Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-zinc-900 p-2 border border-zinc-800">
              <span className="text-[9px] text-zinc-500 uppercase block">Client Name</span>
              <strong className="text-white">{dictationResult.clientName}</strong>
            </div>

            <div className="bg-zinc-900 p-2 border border-zinc-800">
              <span className="text-[9px] text-zinc-500 uppercase block">Client Email</span>
              <span className="text-zinc-300 truncate block">
                {dictationResult.clientEmail || "Not specified"}
              </span>
            </div>

            <div className="bg-zinc-900 p-2 border border-zinc-800">
              <span className="text-[9px] text-zinc-500 uppercase block">Payment Maturity</span>
              <strong className="text-amber-400">Net-{dictationResult.paymentTermsDays} Days</strong>
            </div>
          </div>

          {/* Extracted Line items */}
          {dictationResult.items && dictationResult.items.length > 0 && (
            <div className="bg-zinc-900 p-2.5 border border-zinc-800 text-[10px]">
              <span className="text-[9px] text-zinc-500 uppercase block mb-1">
                Extracted Line Items ({dictationResult.items.length})
              </span>
              <div className="space-y-1">
                {dictationResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-zinc-300 border-b border-zinc-800/60 pb-1">
                    <span>{item.description} ({item.quantity} × ${item.rate.toLocaleString()})</span>
                    <strong className="text-emerald-400">${(item.quantity * item.rate).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <button
            type="button"
            onClick={() => onApplyDictation(dictationResult)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400 neo-shadow-sm"
          >
            <Zap size={14} className="fill-black" />
            <span>Apply Voice Dictation to Invoice Form</span>
          </button>
        </div>
      )}
    </div>
  );
}
