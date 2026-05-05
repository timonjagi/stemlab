#!/usr/bin/env bash
set -e
VENV="/home/hermes/projects/stemlab/venv"
ACTIVATE="$VENV/bin/activate"
source "$ACTIVATE"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
    echo "StemLab CLI — AI stem separation"
    echo ""
    echo "Usage: $0 <input_file> [options]"
    echo ""
    echo "Options:"
    echo "  -o, --output DIR      Output directory (default: next to input file)"
    echo "  -s, --stems NUM       Number of stems: 2, 4, or 6 (default: 4)"
    echo "  -q, --quality LEVEL   Quality: fast, standard, best (default: standard)"
    echo "  -m, --mp3             Export as MP3 320kbps instead of WAV"
    echo "  --mode MODE           Mode: standard, vocals_only, instrumental (default: standard)"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 song.mp3"
    echo "  $0 song.mp3 -s 2 -m"
    echo "  $0 song.mp3 --mode vocals_only -q best"
    exit 0
}

STEMS=4
QUALITY="standard"
MP3=false
MODE="standard"
OUTPUT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--stems)    STEMS="$2"; shift 2;;
        -q|--quality)  QUALITY="$2"; shift 2;;
        -m|--mp3)      MP3=true; shift;;
        --mode)        MODE="$2"; shift 2;;
        -o|--output)   OUTPUT="$2"; shift 2;;
        -h|--help)     usage;;
        -*)            echo "Unknown option: $1"; usage;;
        *)             INPUT="$1"; shift;;
    esac
done

if [ -z "$INPUT" ]; then
    echo "Error: No input file specified"
    usage
fi

if [ ! -f "$INPUT" ]; then
    echo "Error: File not found: $INPUT"
    exit 1
fi

BASENAME="$(basename "${INPUT%.*}")"
OUTPUT="${OUTPUT:-$(dirname "$INPUT")/${BASENAME} - Stems"}"

QUALITY_MAP_fast=0
QUALITY_MAP_standard=1
QUALITY_MAP_best=2

python3 "$SCRIPT_DIR/stemlab_cli.py" \
    "$INPUT" \
    "$OUTPUT" \
    "$STEMS" \
    "${!QUALITY_MAP_$QUALITY}" \
    "$MP3" \
    "$MODE"