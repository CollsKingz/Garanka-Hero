import { VoiceRoomParticipant, UserProfile, UserRole } from '../types';

type VoiceRoomListener = (state: VoiceRoomState) => void;

export interface VoiceRoomState {
  incidentId: string | null;
  incidentCode: string | null;
  channelName: string | null;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isPttMode: boolean;
  isPttPressed: boolean;
  isSpeaking: boolean;
  localVolume: number; // 0 to 100
  participants: VoiceRoomParticipant[];
  audioQuality: 'HD Tactical' | 'Encrypted Voice (Opus 48kbps)';
  latencyMs: number;
}

class VoiceRoomService {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  private state: VoiceRoomState = {
    incidentId: null,
    incidentCode: null,
    channelName: null,
    isConnected: false,
    isMuted: false,
    isDeafened: false,
    isPttMode: false,
    isPttPressed: false,
    isSpeaking: false,
    localVolume: 0,
    participants: [],
    audioQuality: 'Encrypted Voice (Opus 48kbps)',
    latencyMs: 24,
  };

  private listeners: Set<VoiceRoomListener> = new Set();
  private simulatedChatterTimer: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public subscribe(listener: VoiceRoomListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  public getState(): VoiceRoomState {
    return { ...this.state, participants: [...this.state.participants] };
  }

  /**
   * Play realistic tactical walkie-talkie / radio squelch & key sound
   */
  public playRadioSquelch(type: 'keyup' | 'keydown') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Generate brief burst of filtered noise
      const bufferSize = ctx.sampleRate * (type === 'keyup' ? 0.08 : 0.06);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = type === 'keyup' ? 1800 : 1200;
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === 'keyup' ? 0.08 : 0.06));

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.1);

      // Add high-pitch roger beep on keydown
      if (type === 'keydown') {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, now + 0.02);
        oscGain.gain.setValueAtTime(0.08, now + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now + 0.02);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio context suppressed in background
    }
  }

  /**
   * Play high-priority tactical broadcast chime (for supervisor / head office announcements)
   */
  public playPriorityChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const freqs = [880, 1174, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Connect to an incident voice channel
   */
  public async joinIncidentVoiceRoom(
    incidentId: string,
    incidentCode: string,
    currentUser: UserProfile,
    assignedResponders: { name: string; callSign: string; guardId: string }[] = []
  ): Promise<boolean> {
    try {
      // Request mic permission for live audio metering
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          this.setupAudioAnalysis(this.mediaStream);
        } catch (micErr) {
          console.warn('Microphone access not granted or unavailable (falling back to simulated tactical stream):', micErr);
        }
      }

      this.playRadioSquelch('keyup');

      // Build initial room participants roster based on active incident staff
      const participants: VoiceRoomParticipant[] = [];

      // Current local user
      participants.push({
        userId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        callSign: currentUser.callSign || currentUser.name.split(' ')[0],
        isMuted: false,
        isSpeaking: false,
        isPttActive: false,
        signalStrength: 'excellent',
        latencyMs: 18,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // Add assigned responders
      assignedResponders.forEach((resp) => {
        if (resp.guardId !== currentUser.id) {
          participants.push({
            userId: resp.guardId,
            name: resp.name,
            role: 'guard',
            callSign: resp.callSign,
            isMuted: false,
            isSpeaking: false,
            isPttActive: false,
            signalStrength: 'excellent',
            latencyMs: Math.floor(22 + Math.random() * 15),
            joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      });

      // Add Head Office command listener if currentUser is not headoffice
      if (currentUser.role !== 'headoffice') {
        participants.push({
          userId: 'ho-cmd-1',
          name: 'Head Office Command (Ops)',
          role: 'headoffice',
          callSign: 'COMMAND-1',
          isMuted: true,
          isSpeaking: false,
          signalStrength: 'excellent',
          latencyMs: 12,
          joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      this.state = {
        ...this.state,
        incidentId,
        incidentCode,
        channelName: `INC-${incidentCode} Tactical Intercom`,
        isConnected: true,
        isMuted: false,
        isDeafened: false,
        isPttPressed: false,
        isSpeaking: false,
        participants,
      };

      this.notify();
      this.startSimulatedRadioChatter();
      return true;
    } catch (err) {
      console.error('Error joining tactical voice channel:', err);
      return false;
    }
  }

  /**
   * Setup WebAudio Analyser to measure local microphone decibels in real time
   */
  private setupAudioAnalysis(stream: MediaStream) {
    try {
      const ctx = this.getAudioContext();
      this.microphoneSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.microphoneSource.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.state.isConnected) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalizedVolume = Math.min(100, Math.round((avg / 128) * 100));

        // Determine if local user is actively speaking
        const isSpeakingNow =
          !this.state.isMuted &&
          (this.state.isPttMode ? this.state.isPttPressed : normalizedVolume > 14);

        if (this.state.localVolume !== normalizedVolume || this.state.isSpeaking !== isSpeakingNow) {
          this.state.localVolume = normalizedVolume;
          this.state.isSpeaking = isSpeakingNow;

          // Update local participant speaking state
          this.state.participants = this.state.participants.map((p, idx) =>
            idx === 0 ? { ...p, isSpeaking: isSpeakingNow, isMuted: this.state.isMuted } : p
          );

          this.notify();
        }

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      this.animationFrameId = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('Audio analyser setup failed:', e);
    }
  }

  /**
   * Leave current voice room
   */
  public leaveIncidentVoiceRoom() {
    this.playRadioSquelch('keydown');

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.simulatedChatterTimer) {
      clearInterval(this.simulatedChatterTimer);
      this.simulatedChatterTimer = null;
    }

    this.state = {
      ...this.state,
      incidentId: null,
      incidentCode: null,
      channelName: null,
      isConnected: false,
      isSpeaking: false,
      localVolume: 0,
      participants: [],
    };

    this.notify();
  }

  public toggleMute() {
    const newMuted = !this.state.isMuted;
    this.state.isMuted = newMuted;
    if (newMuted) {
      this.state.isSpeaking = false;
    }
    this.state.participants = this.state.participants.map((p, idx) =>
      idx === 0 ? { ...p, isMuted: newMuted, isSpeaking: newMuted ? false : p.isSpeaking } : p
    );
    this.playRadioSquelch(newMuted ? 'keydown' : 'keyup');
    this.notify();
  }

  public toggleDeafen() {
    this.state.isDeafened = !this.state.isDeafened;
    this.notify();
  }

  public togglePttMode() {
    this.state.isPttMode = !this.state.isPttMode;
    this.state.isPttPressed = false;
    this.notify();
  }

  public setPttPressed(pressed: boolean) {
    if (!this.state.isPttMode || this.state.isPttPressed === pressed) return;
    this.state.isPttPressed = pressed;
    this.state.isSpeaking = pressed && !this.state.isMuted;

    this.playRadioSquelch(pressed ? 'keyup' : 'keydown');

    this.state.participants = this.state.participants.map((p, idx) =>
      idx === 0 ? { ...p, isSpeaking: this.state.isSpeaking, isPttActive: pressed } : p
    );
    this.notify();
  }

  public addParticipantToRoster(member: {
    userId: string;
    name: string;
    role: UserRole;
    callSign?: string;
  }) {
    if (this.state.participants.some((p) => p.userId === member.userId)) return;

    const newParticipant: VoiceRoomParticipant = {
      userId: member.userId,
      name: member.name,
      role: member.role,
      callSign: member.callSign || member.name.split(' ')[0],
      isMuted: false,
      isSpeaking: false,
      signalStrength: 'excellent',
      latencyMs: Math.floor(18 + Math.random() * 20),
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.state.participants.push(newParticipant);
    this.notify();
  }

  /**
   * Periodic tactical radio responder simulation (speaking activity for realism)
   */
  private startSimulatedRadioChatter() {
    if (this.simulatedChatterTimer) clearInterval(this.simulatedChatterTimer);

    this.simulatedChatterTimer = setInterval(() => {
      if (!this.state.isConnected || this.state.participants.length <= 1) return;

      // Pick a random remote responder to speak briefly
      const eligible = this.state.participants.filter((_, idx) => idx > 0);
      if (eligible.length === 0) return;

      const randomParticipant = eligible[Math.floor(Math.random() * eligible.length)];

      // Make them speak for 2.5 seconds
      this.state.participants = this.state.participants.map((p) =>
        p.userId === randomParticipant.userId ? { ...p, isSpeaking: true } : p
      );
      this.notify();

      setTimeout(() => {
        if (!this.state.isConnected) return;
        this.state.participants = this.state.participants.map((p) =>
          p.userId === randomParticipant.userId ? { ...p, isSpeaking: false } : p
        );
        this.notify();
      }, 2400);
    }, 12000);
  }
}

export const voiceRoomService = new VoiceRoomService();
