"""
Build the recorded voice pack (audio/voice/) from the sentence list made by
tools/collect-speech.mjs, using the open-source Piper text-to-speech engine.

    pip install piper-tts               # once
    # voice model: Kathleen (CC0), from the Piper v0.0.2 release
    node tools/collect-speech.mjs > speech.json
    python3 tools/build_voice_pack.py speech.json path/to/en-us-kathleen-low.onnx

Clips are Opus in Ogg at 16 kbps mono (small, clear speech) and named by the
text key, so the app finds them without a lookup table. Existing clips are
kept, so re-running after adding lessons only records the new sentences.
"""
import io
import json
import subprocess
import sys
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

OUT_DIR = Path(__file__).resolve().parent.parent / "audio" / "voice"
# Slightly slower than normal, which young listeners follow more easily.
SYN = SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.8)


def to_ogg(wav_bytes: bytes, target: Path) -> None:
    """Encode WAV bytes to Opus/Ogg with ffmpeg."""
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", "pipe:0", "-ac", "1",
         "-c:a", "libopus", "-b:a", "16k", "-application", "voip", str(target)],
        input=wav_bytes, check=True,
    )


def main(speech_json: str, model_path: str) -> None:
    items = json.loads(Path(speech_json).read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(model_path)

    wanted = {item["key"] for item in items}
    todo = [item for item in items if not (OUT_DIR / f"{item['key']}.ogg").exists()]
    print(f"{len(items)} sentences, {len(todo)} to record")

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = []
        for i, item in enumerate(todo, 1):
            buf = io.BytesIO()
            with wave.open(buf, "wb") as wav:
                voice.synthesize_wav(item["spoken"], wav, syn_config=SYN)
            futures.append(pool.submit(to_ogg, buf.getvalue(), OUT_DIR / f"{item['key']}.ogg"))
            if i % 200 == 0:
                print(f"  {i}/{len(todo)}")
        for f in futures:
            f.result()

    # Remove clips no longer used, then write the manifest the app and service worker read.
    for clip in OUT_DIR.glob("*.ogg"):
        if clip.stem not in wanted:
            clip.unlink()
    keys = sorted(wanted)
    (OUT_DIR / "manifest.json").write_text(
        json.dumps({"voice": "Kathleen (Piper, CC0)", "format": "ogg/opus", "keys": keys}, separators=(",", ":")),
        encoding="utf-8",
    )
    size = sum(p.stat().st_size for p in OUT_DIR.glob("*.ogg"))
    print(f"done: {len(keys)} clips, {size / 1_000_000:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
