import type { Locale } from "@/lib/i18n/locales";

/**
 * Voice and small sounds for Junior play. Everything here is optional: it is off until the child turns it on,
 * it only ever starts after a tap, and a browser without speech or audio simply stays silent.
 * Only a speech voice that runs on the device is used; no audio file is loaded and nothing leaves the browser.
 */
const SPEECH_LANG: Record<Locale, string> = { en: "en-US", fr: "fr-FR", he: "he-IL" };

function synth(): SpeechSynthesis | undefined {
	try {
		return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : undefined;
	} catch {
		return undefined;
	}
}
/** A voice that runs on the device itself for this language. Voices that send the text to a server are never used. */
function localVoice(speech: SpeechSynthesis, locale: Locale): SpeechSynthesisVoice | undefined {
	const speaks = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().startsWith(locale) || (locale === "he" && voice.lang.toLowerCase().startsWith("iw"));
	return speech.getVoices().find((voice) => voice.localService && speaks(voice));
}
/** Says one line, replacing whatever was being said. */
export function speak(text: string, locale: Locale): void {
	const speech = synth();
	if (!speech || !text || typeof SpeechSynthesisUtterance === "undefined") return;
	try {
		speech.cancel();
		const voice = localVoice(speech, locale);
		/* No on-device voice for this language: stay silent rather than send the words elsewhere. */
		if (!voice) return;
		/* Direction marks are for the eye, not the ear. */
		const utterance = new SpeechSynthesisUtterance(text.replace(/[\u2066-\u2069]/g, ""));
		utterance.voice = voice;
		utterance.lang = SPEECH_LANG[locale];
		utterance.rate = 0.95;
		speech.speak(utterance);
	} catch {
		/* A device that refuses speech stays silent. */
	}
}
export function stopSpeaking(): void {
	try {
		synth()?.cancel();
	} catch {
		/* nothing to stop */
	}
}

export type Chime = "place" | "clash" | "hurt" | "no" | "win" | "zap" | "heal";
/** Notes as [frequency in Hz, start in seconds, length in seconds]. */
const TUNES: Record<Chime, readonly (readonly [number, number, number])[]> = {
	place: [[520, 0, 0.09]],
	clash: [
		[180, 0, 0.12],
		[120, 0.06, 0.16],
	],
	hurt: [
		[330, 0, 0.12],
		[247, 0.12, 0.2],
	],
	no: [[196, 0, 0.14]],
	win: [
		[523, 0, 0.12],
		[659, 0.12, 0.12],
		[784, 0.24, 0.24],
	],
	/* Thunder: a low rumble under the crack. */
	zap: [
		[90, 0, 0.3],
		[60, 0.1, 0.4],
	],
	heal: [
		[523, 0, 0.1],
		[659, 0.09, 0.1],
		[784, 0.18, 0.1],
		[1047, 0.27, 0.22],
	],
};
let context: AudioContext | undefined;
/** The crack of thunder: a short burst of noise that dies away. */
function crack(audio: AudioContext, begin: number): void {
	const length = Math.floor(audio.sampleRate * 0.25);
	const buffer = audio.createBuffer(1, length, audio.sampleRate);
	const data = buffer.getChannelData(0);
	for (let index = 0; index < length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 2;
	const noise = audio.createBufferSource();
	const gain = audio.createGain();
	noise.buffer = buffer;
	gain.gain.value = 0.14;
	noise.connect(gain).connect(audio.destination);
	noise.start(begin);
}
/** One short, quiet sound made with the Web Audio API. `after` seconds later, to fall on the picture it goes with. */
export function chime(kind: Chime, after = 0): void {
	try {
		const Audio = typeof window === "undefined" ? undefined : window.AudioContext;
		if (!Audio) return;
		context ??= new Audio();
		const audio = context;
		if (audio.state === "suspended") void audio.resume();
		if (kind === "zap") crack(audio, audio.currentTime + after);
		for (const [frequency, at, length] of TUNES[kind]) {
			const oscillator = audio.createOscillator();
			const gain = audio.createGain();
			oscillator.type = "triangle";
			oscillator.frequency.value = frequency;
			const begin = audio.currentTime + after + at;
			gain.gain.setValueAtTime(0.0001, begin);
			gain.gain.exponentialRampToValueAtTime(0.12, begin + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, begin + length);
			oscillator.connect(gain).connect(audio.destination);
			oscillator.start(begin);
			oscillator.stop(begin + length + 0.02);
		}
	} catch {
		/* No audio on this device. */
	}
}
