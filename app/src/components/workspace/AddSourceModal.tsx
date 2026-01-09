"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AddSourceModalProps {
  stationId: Id<"stations">;
  isOpen: boolean;
  onClose: () => void;
}

type InputMode = "upload" | "url" | "note" | null;

export function AddSourceModal({ stationId, isOpen, onClose }: AddSourceModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSource = useMutation(api.sources.create);
  const generateUploadUrl = useMutation(api.sources.generateUploadUrl);

  const getFileType = (file: File): "document" | "spreadsheet" | "audio" | "video" => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["xlsx", "xls", "csv", "tsv"].includes(ext || "")) return "spreadsheet";
    if (["mp3", "wav", "m4a", "ogg", "flac"].includes(ext || "")) return "audio";
    if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext || "")) return "video";
    return "document";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setInputMode("upload");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setInputMode("upload");
    }
  };

  const handleUploadFile = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Failed to upload file");
      const { storageId } = await result.json();

      await createSource({
        stationId,
        type: getFileType(file),
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
      });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUrl = async () => {
    if (!url) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Extract domain for name
      const urlObj = new URL(url);
      const name = urlObj.hostname.replace("www.", "");

      await createSource({
        stationId,
        type: "url",
        name,
        url,
      });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteTitle || !noteContent) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createSource({
        stationId,
        type: "note",
        name: noteTitle,
        content: noteContent,
      });

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInputMode(null);
    setFile(null);
    setUrl("");
    setNoteTitle("");
    setNoteContent("");
    setError(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Add sources</h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Main View - No input mode selected yet */}
          {!inputMode && (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-4
                  ${isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
                  }
                `}
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-slate-300 font-medium mb-1">Drop files here</p>
                  <p className="text-slate-500 text-sm">or click to browse</p>
                  <p className="text-slate-600 text-xs mt-2">PDF, Word, Excel, CSV, audio, video</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.tsv,.mp3,.wav,.m4a,.mp4,.mov"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-slate-300 text-sm font-medium">Upload</span>
                </button>
                <button
                  onClick={() => setInputMode("url")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-slate-300 text-sm font-medium">Website</span>
                </button>
                <button
                  onClick={() => setInputMode("note")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-slate-300 text-sm font-medium">Note</span>
                </button>
              </div>
            </>
          )}

          {/* Upload confirmation view */}
          {inputMode === "upload" && file && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setFile(null);
                  setInputMode(null);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>

              <div className="p-4 bg-slate-800 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl">
                    {getFileType(file) === "spreadsheet" ? "📊" :
                     getFileType(file) === "audio" ? "🎵" :
                     getFileType(file) === "video" ? "🎬" : "📄"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setInputMode(null);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleUploadFile}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Uploading..." : "Add to sources"}
              </button>
            </div>
          )}

          {/* URL Input View */}
          {inputMode === "url" && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setUrl("");
                  setInputMode(null);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Website URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-slate-500 text-xs mt-2">
                  Add articles, social posts, or any web content
                </p>
              </div>

              <button
                onClick={handleAddUrl}
                disabled={isSubmitting || !url}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Adding..." : "Add to sources"}
              </button>
            </div>
          )}

          {/* Note Input View */}
          {inputMode === "note" && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setNoteTitle("");
                  setNoteContent("");
                  setInputMode(null);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </button>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="What's this about?"
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add your observations, intel, or notes..."
                  rows={5}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-slate-500 text-xs mt-2">
                  Quick intel, observations, meeting notes, or copied text
                </p>
              </div>

              <button
                onClick={handleAddNote}
                disabled={isSubmitting || !noteTitle || !noteContent}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Adding..." : "Add to sources"}
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!inputMode && (
          <div className="p-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              Sources become your station's knowledge base for AI-powered insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
