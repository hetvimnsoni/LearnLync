"use client";

import { useState, useEffect, useCallback } from "react";

export type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export interface MediaDeviceInfoList {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export interface UseMediaPermissionsReturn {
  micPermission: PermissionState;
  cameraPermission: PermissionState;
  devices: MediaDeviceInfoList;
  requestMicrophone: () => Promise<boolean>;
  requestCamera: () => Promise<boolean>;
  requestBoth: () => Promise<{ audio: boolean; video: boolean }>;
  refreshDevices: () => Promise<void>;
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
  permissionModalType: "audio" | "video" | "both";
  setPermissionModalType: (type: "audio" | "video" | "both") => void;
}

export function useMediaPermissions(): UseMediaPermissionsReturn {
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");
  const [cameraPermission, setCameraPermission] = useState<PermissionState>("prompt");
  const [devices, setDevices] = useState<MediaDeviceInfoList>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionModalType, setPermissionModalType] = useState<"audio" | "video" | "both">("both");

  // Query native browser permission status if supported
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) return;

    try {
      navigator.permissions
        .query({ name: "microphone" as any })
        .then((status) => {
          setMicPermission(status.state as PermissionState);
          status.onchange = () => setMicPermission(status.state as PermissionState);
        })
        .catch(() => {});

      navigator.permissions
        .query({ name: "camera" as any })
        .then((status) => {
          setCameraPermission(status.state as PermissionState);
          status.onchange = () => setCameraPermission(status.state as PermissionState);
        })
        .catch(() => {});
    } catch {}
  }, []);

  const refreshDevices = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        audioInputs: allDevices.filter((d) => d.kind === "audioinput"),
        audioOutputs: allDevices.filter((d) => d.kind === "audiooutput"),
        videoInputs: allDevices.filter((d) => d.kind === "videoinput"),
      });
    } catch (err) {
      console.warn("Failed to enumerate media devices:", err);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = refreshDevices;
      return () => {
        navigator.mediaDevices.ondevicechange = null;
      };
    }
  }, [refreshDevices]);

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      refreshDevices();
      return true;
    } catch (err: any) {
      console.warn("Microphone access denied:", err);
      setMicPermission("denied");
      setPermissionModalType("audio");
      setShowPermissionModal(true);
      return false;
    }
  }, [refreshDevices]);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission("granted");
      refreshDevices();
      return true;
    } catch (err: any) {
      console.warn("Camera access denied:", err);
      setCameraPermission("denied");
      setPermissionModalType("video");
      setShowPermissionModal(true);
      return false;
    }
  }, [refreshDevices]);

  const requestBoth = useCallback(async (): Promise<{ audio: boolean; video: boolean }> => {
    let audioGranted = false;
    let videoGranted = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
      setCameraPermission("granted");
      refreshDevices();
      return { audio: true, video: true };
    } catch {
      // Fallback: test individually
      audioGranted = await requestMicrophone();
      videoGranted = await requestCamera();
      if (!audioGranted || !videoGranted) {
        setPermissionModalType(!audioGranted && !videoGranted ? "both" : !audioGranted ? "audio" : "video");
        setShowPermissionModal(true);
      }
      return { audio: audioGranted, video: videoGranted };
    }
  }, [requestMicrophone, requestCamera, refreshDevices]);

  return {
    micPermission,
    cameraPermission,
    devices,
    requestMicrophone,
    requestCamera,
    requestBoth,
    refreshDevices,
    showPermissionModal,
    setShowPermissionModal,
    permissionModalType,
    setPermissionModalType,
  };
}
