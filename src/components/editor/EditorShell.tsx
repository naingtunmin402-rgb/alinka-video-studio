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

  const handleVoiceover = async () => {
    setIsGenerating(true);
    try {
      await generateVoiceover(voiceText);
    } catch (error: any) {
      alert("Voiceover Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
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

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          alert("Export အောင်မြင်ပါပြီ! (Demo)");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getTrackClass = (track: string) => {
    const base = "flex-1 h-16 rounded-lg flex items-center px-4 text-sm cursor-pointer ";
    if (selectedTrack === track) {
      return base + "bg-teal-900 border-2 border-teal-500";
    }
    return base + "bg-gray-900";
  };

  const getToolClass = (tool: string) => {
    const base = "text-xs px-3 py-1 rounded ";
    if (activeTool === tool.toLowerCase()) {
      return base + "bg-teal-500 text-white";
    }
    return base + "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-lg font-bold">ALINKA AI VIDEO EDITOR</h1>
        <button
          onClick={() => setShowExport(true)}
          className="bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Export
        </button>
      </div>

      <div className="flex flex-1">
        <div className="w-64 border-r border-gray-800 p-4 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-teal-400">AI VOICEOVER</h2>
          <textarea
            className="w-full h-24 bg-gray-900 rounded-lg p-2 text-sm text-white"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
          />
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
          <div className="w-[300px] h-[500px] bg-black rounded-xl border border-gray-700 flex items-center justify-center text-gray-500">
            Preview Area (9:16)
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <div
            onClick={() => setSelectedTrack("video")}
            className={getTrackClass("video")}
          >
            V1 - Video
          </div>
          <div
            onClick={() => setSelectedTrack("audio")}
            className={getTrackClass("audio")}
          >
            A1 - Audio
          </div>
          <div
            onClick={() => setSelectedTrack("text")}
            className={getTrackClass("text")}
          >
            T1 - Text
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-around p-4 border-t border-gray-800">
        {["Cut", "Text", "Audio", "Effects", "Speed", "Filter"].map((tool) => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool.toLowerCase())}
            className={getToolClass(tool)}
          >
            {tool}
          </button>
        ))}
      </div>

      {showExport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] p-6 rounded-xl w-96 border border-gray-700">
            <h2 className="text-lg font-bold mb-4">Export Video</h2>

            <label className="text-sm text-gray-400">Resolution</label>
            <select
              className="w-full bg-gray-900 rounded-lg p-2 text-sm text-white mb-4"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4K">4K (Ultra HD)</option>
            </select>

            <label className="text-sm text-gray-400">Format</label>
            <select
              className="w-full bg-gray-900 rounded-lg p-2 text-sm text-white mb-4"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="MP4">MP4</option>
              <option value="MOV">MOV</option>
            </select>

            {isExporting && (
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{ width: exportProgress + "%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {exportProgress}% complete
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium"
              >
                {isExporting ? "Exporting..." : "Start Export"}
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="flex-1 bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}