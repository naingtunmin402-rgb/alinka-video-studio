"use client";

import React, { useState } from "react";
import { generateVoiceover, VOICES } from "../../app/lib/ai-voiceover";
import { startCaptions, Caption } from "../../app/lib/auto-captions";

export default function EditorShell() {
  const [voiceText, setVoiceText] = useState("Welcome to Alinka AI Video Studio.");
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isCaptioning, setIsCaptioning] = useState(false);
  const [activeTool, setActiveTool] = useState("cut");
  const [selectedTrack, setSelectedTrack] = useState("video");

  const [showExport, setShowExport] = useState(false);
  const [resolution, setResolution] = useState("1080p");
  const [format, setFormat] = useState("MP4");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "image" | null>(null);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [cutStart, setCutStart] = useState<number | null>(null);
  const [cutEnd, setCutEnd] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState(60);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
const [audioName, setAudioName] = useState<string>("");
const [audioStartTime, setAudioStartTime] = useState(0);
  const [exportResolution, setExportResolution] = useState("1080p");
const [exportFormat, setExportFormat] = useState("mp4");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const MAX_FREE_DURATION = 60;
  const MAX_PRO_DURATION = 600;
  const handleVoiceover = async () => {
    if (!isPro && voiceText.length > 100) {
      alert("Free Plan: Voiceover text must be under 100 characters. Upgrade to Pro!");
      setShowUpgrade(true);
      return;
    }
    setIsGenerating(true);
    try {
      await generateVoiceover(voiceText);
    } catch (error: any) {
      alert("Voiceover Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const handleCaptions = () => {
    if (isCaptioning) {
      setIsCaptioning(false);
      return;
    }
    setIsCaptioning(true);
    startCaptions(
      (caption) => setCaptions((prev) => [...prev, caption]),
      (error) => alert("Captions Error: " + error)
    );
  };
  
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * videoDuration;
    if (newTime >= 0 && newTime <= videoDuration) {
      setPlayheadTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };
  
  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const newTime = (dragX / rect.width) * videoDuration;
    if (newTime >= 0 && newTime <= videoDuration) {
      setPlayheadTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };
  
  const handleCut = () => {
    console.log("Cut button clicked!");
    if (cutStart === null) {
      setCutStart(playheadTime);
      alert("Cut Start set at " + formatTime(playheadTime));
    } else if (cutEnd === null) {
      if (playheadTime > cutStart) {
        setCutEnd(playheadTime);
        alert("Cut End set at " + formatTime(playheadTime) + ". Ready to cut!");
      } else {
        alert("Cut End must be after Cut Start!");
      }
    } else {
      setCutStart(null);
      setCutEnd(null);
      alert("Cut reset. Start again.");
    }
  };
  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioName(file.name);
      alert("Audio imported: " + file.name);
    }
  };
  const handleExport = async () => {
    if (!isPro && videoDuration > MAX_FREE_DURATION) {
      alert("Free Plan: Video duration limited to 1 minute. Upgrade to Pro for 10 minutes!");
      setShowUpgrade(true);
      return;
    }
  
    if (!videoRef.current) {
      alert("No video to export!");
      return;
    }
  
    setIsExporting(true);
    setExportProgress(0);
  
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
  
      if (!ctx) {
        throw new Error("Canvas context not available");
      }
  
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
  
      const chunks: Blob[] = [];
  
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
  
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "alinka-export.webm";
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        alert("Export အောင်မြင်ပါပြီ!");
      };
  
      recorder.start();
  
      const startTime = Date.now();
      const duration = videoDuration * 1000;
  
      const drawFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setExportProgress(progress);
  
        if (ctx && video) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
  
        if (elapsed < duration) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };
  
      video.currentTime = 0;
      await video.play();
      drawFrame();
    } catch (error: any) {
      alert("Export Error: " + error.message);
      setIsExporting(false);
    }
  };
  
  const getToolClass = (tool: string) => {
    const base = "text-xs px-3 py-1 rounded ";
    if (activeTool === tool.toLowerCase()) {
      return base + "bg-teal-500 text-white";
    }
    return base + "text-gray-400";
  };
  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col relative">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-lg font-bold">ALINKA AI VIDEO EDITOR</h1>
        <div className="flex gap-2">
          <label className="bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
            Import
            <input
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setMediaUrl(url);
                  if (file.type.startsWith("video/")) {
                    setMediaType("video");
                  } else if (file.type.startsWith("image/")) {
                    setMediaType("image");
                  }
                }
              }}
            />
          </label>
          <button
            onClick={() => setShowExport(true)}
            className="bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Export
          </button>
          {!isPro && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="bg-yellow-500 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Upgrade
            </button>
          )}
          {isPro && (
            <span className="bg-teal-500 px-3 py-2 rounded text-xs font-bold">
              PRO
            </span>
          )}
        </div>
      </div>
  
      <div className="flex flex-1">
        <div className="w-64 border-r border-gray-800 p-4 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-teal-400">AI VOICEOVER</h2>
          <textarea
            className="w-full h-24 bg-gray-900 rounded-lg p-2 text-sm text-white"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            maxLength={isPro ? undefined : 100}
          />
          <div className="text-xs text-gray-500">
            {voiceText.length} / {isPro ? "∞" : "100"} characters
          </div>
          <select
            className="w-full bg-gray-900 rounded-lg p-2 text-sm text-white"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            {VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleVoiceover}
            disabled={isGenerating}
            className="bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
          >
            {isGenerating ? "Generating..." : "Generate Voiceover"}
          </button>
  
          <hr className="border-gray-800" />
  
          <h2 className="text-sm font-bold text-teal-400">AUTO-CAPTIONS</h2>
          <button
            onClick={handleCaptions}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-500"
          >
            {isCaptioning ? "Stop Captions" : "Start Captions"}
          </button>
          {captions.length > 0 && (
            <div className="text-xs text-gray-400">
              {captions.length} captions generated
            </div>
          )}
        </div>
  
        <div className="flex-1 flex items-center justify-center p-4">
          
          <div className="w-[300px] h-[500px] bg-black rounded-xl border border-gray-700 flex items-center justify-center text-gray-500 overflow-hidden">
          {mediaUrl && mediaType === "video" && (
  <video
    src={mediaUrl}
    ref={videoRef}
    controls
    className="w-full h-full object-cover"
    onTimeUpdate={(e) => {
      const video = e.currentTarget;
      if (audioRef.current && audioUrl) {
        if (Math.abs(audioRef.current.currentTime - video.currentTime) > 0.3) {
          audioRef.current.currentTime = video.currentTime;
        }
      }
    }}
    onPlay={() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }}
    onPause={() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }}
  />
)}
            {mediaUrl && mediaType === "image" && (
              <img
                src={mediaUrl}
                alt="Imported media"
                className="w-full h-full object-cover"
              />
            )}
            {!mediaUrl && <span>Preview Area (9:16)</span>}
          </div>
        </div>
      </div>
      {audioUrl && (
  <audio
    ref={audioRef}
    src={audioUrl}
    className="hidden"
  />
)}
      {/* Timeline */}
<div
  className="p-4 border-t border-gray-800 relative overflow-x-auto"
  onMouseDown={handleTimelineClick}
  onMouseMove={handleTimelineDrag}
>
<div className="flex gap-2" style={{ width: `${100 * zoomLevel}%` }}>
    {/* Video Track */}
    <div
      onClick={() => setSelectedTrack("video")}
      className={`flex-1 h-16 rounded-lg flex items-center px-4 text-sm cursor-pointer relative overflow-hidden ${
        selectedTrack === "video"
          ? "bg-teal-900 border-2 border-teal-500"
          : "bg-gray-900"
      }`}
    >
      <span className="absolute left-2 top-1 text-xs text-gray-400">
        V1 - Video
      </span>
      {mediaUrl && mediaType === "video" && (
        <div className="absolute left-0 top-4 h-10 bg-blue-500 rounded px-2 flex items-center text-xs text-white">
          📹 Video Clip
        </div>
      )}
      {mediaUrl && mediaType === "image" && (
        <div className="absolute left-0 top-4 h-10 bg-purple-500 rounded px-2 flex items-center text-xs text-white">
          🖼️ Image
        </div>
      )}
    </div>

    {/* Audio Track */}
<div
  onClick={() => setSelectedTrack("audio")}
  className={`flex-1 h-16 rounded-lg flex items-center px-4 text-sm cursor-pointer relative overflow-hidden ${
    selectedTrack === "audio"
      ? "bg-teal-900 border-2 border-teal-500"
      : "bg-gray-900"
  }`}
>
  <span className="absolute left-2 top-1 text-xs text-gray-400">
    A1 - Audio
  </span>
  {audioUrl ? (
    <div className="absolute left-0 top-4 h-10 bg-green-500 rounded px-2 flex items-center text-xs text-white">
      🎵 {audioName.substring(0, 15)}
    </div>
  ) : (
    <label className="absolute left-0 top-4 h-10 bg-green-500 rounded px-2 flex items-center text-xs text-white cursor-pointer">
      🎵 Import Audio
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioImport}
      />
    </label>
  )}
</div>

    {/* Text Track */}
    <div
      onClick={() => setSelectedTrack("text")}
      className={`flex-1 h-16 rounded-lg flex items-center px-4 text-sm cursor-pointer relative overflow-hidden ${
        selectedTrack === "text"
          ? "bg-teal-900 border-2 border-teal-500"
          : "bg-gray-900"
      }`}
    >
      <span className="absolute left-2 top-1 text-xs text-gray-400">
        T1 - Text
      </span>
      {captions.length > 0 ? (
        <div className="absolute left-0 top-4 h-10 bg-yellow-500 rounded px-2 flex items-center text-xs text-black">
          💬 {captions[0].text.substring(0, 20)}...
        </div>
      ) : (
        <div className="absolute left-0 top-4 h-10 bg-yellow-500 rounded px-2 flex items-center text-xs text-black">
          💬 Text Overlay
        </div>
      )}
    </div>
  </div>

  {/* Playhead */}
  <div
    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none"
    style={{
      left: `${(playheadTime / videoDuration) * 100}%`,
    }}
  >
    <div className="absolute -top-6 -left-4 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
      {formatTime(playheadTime)} / {formatTime(videoDuration)}
    </div>
  </div>
</div>

{/* Toolbar */}
<div className="flex justify-around p-4 border-t border-gray-800">
  {["Cut", "Text", "Audio", "Effects", "Speed", "Filter"].map((tool) => (
    <button
      key={tool}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => {
        setActiveTool(tool.toLowerCase());
        if (tool === "Cut") {
          handleCut();
        }
      }}
      className={getToolClass(tool)}
    >
      {tool}
    </button>
  ))}
</div>
{/* Zoom Controls */}
<div className="flex justify-center gap-2 p-2 border-t border-gray-800">
  <button
    onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.5))}
    className="bg-gray-700 px-3 py-1 rounded text-xs font-medium"
  >
    Zoom Out
  </button>
  <span className="text-xs text-gray-400 flex items-center">
    {zoomLevel}x
  </span>
  <button
    onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.5))}
    className="bg-gray-700 px-3 py-1 rounded text-xs font-medium"
  >
    Zoom In
  </button>
</div>

{!isPro && (
        <div className="absolute bottom-20 right-4 bg-black/50 px-3 py-1 rounded text-xs text-white">
          Made with Alinka AI (Free)
        </div>
      )}

      {showUpgrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-lg font-bold mb-4">Upgrade to Pro</h2>
            <ul className="text-sm text-gray-400 mb-4 space-y-2">
              <li>✅ No Watermark</li>
              <li>✅ Video up to 10 minutes</li>
              <li>✅ Unlimited Voiceover Text</li>
              <li>✅ 4K Export Resolution</li>
              <li>✅ Priority Support</li>
            </ul>
            <p className="text-2xl font-bold text-teal-400 mb-4">$5 / month</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsPro(true);
                  setShowUpgrade(false);
                  alert("Pro Plan Activated! You can now edit videos up to 10 minutes.");
                }}
                className="flex-1 bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setShowUpgrade(false)}
                className="flex-1 bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{showExport && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div className="bg-[#1a1d24] p-6 rounded-xl w-96 border border-gray-700">
      <h2 className="text-lg font-bold mb-4">Export Video</h2>

      <label className="text-sm text-gray-400 block mb-1">Resolution</label>
      <select
        value={exportResolution}
        onChange={(e) => setExportResolution(e.target.value)}
        className="w-full bg-gray-900 rounded-lg p-2 text-sm text-white mb-4"
      >
        <option value="720p">720p (HD)</option>
        <option value="1080p">1080p (Full HD)</option>
        <option value="4K">4K (Ultra HD)</option>
      </select>

      <label className="text-sm text-gray-400 block mb-1">Format</label>
      <select
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
        className="w-full bg-gray-900 rounded-lg p-2 text-sm text-white mb-4"
      >
        <option value="mp4">MP4</option>
        <option value="webm">WebM</option>
        <option value="gif">GIF</option>
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowExport(false);
            handleExport();
          }}
          className="flex-1 bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Export
        </button>
        <button
          onClick={() => setShowExport(false)}
          className="flex-1 bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
</div>
  );
}