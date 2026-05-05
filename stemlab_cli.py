import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.core.splitter import separate_audio

if len(sys.argv) < 6:
    print("Usage: stemlab_cli.py <input> <output_dir> <stems> <quality> <mp3> [mode]")
    sys.exit(1)

input_file = sys.argv[1]
output_dir = sys.argv[2]
stem_count = int(sys.argv[3])
quality = int(sys.argv[4])
export_mp3 = sys.argv[5].lower() == "true"
mode = sys.argv[6] if len(sys.argv) > 6 else "standard"

separate_audio(
    input_file,
    output_dir,
    stem_count,
    quality,
    export_zip=False,
    keep_original=True,
    export_mp3=export_mp3,
    mode=mode,
    dereverb=False,
    invert=False
)

print(f"\nDone! Stems saved to: {output_dir}")