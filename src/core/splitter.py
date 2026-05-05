import os
import shutil


from src.utils.logger import logger
import demucs.separate
import torch
import torchaudio
import soundfile as sf
try:
    from src.core.advanced_audio import AdvancedAudioProcessor
except ImportError:
    AdvancedAudioProcessor = None
    logger.warning("AdvancedAudioProcessor not available (audio-separator missing?)")

# Monkeypatch torchaudio to use soundfile directly (Fix for Python 3.14 / torchaudio 2.9.1)
def custom_load(filepath, *args, **kwargs):
    wav, sr = sf.read(filepath)
    wav = torch.tensor(wav).float()
    if wav.ndim == 1:
        wav = wav.unsqueeze(0)
    else:
        wav = wav.t()
    return wav, sr

def custom_save(filepath, src, sample_rate, **kwargs):
    src = src.detach().cpu().t().numpy()
    sf.write(filepath, src, sample_rate)

torchaudio.load = custom_load
torchaudio.save = custom_save

def separate_audio(input_file, output_dir, stem_count, quality, export_zip, keep_original, **kwargs):
    filename = os.path.basename(input_file)
    base_name = os.path.splitext(filename)[0]
    os.makedirs(output_dir, exist_ok=True)

    # Determine Model and Args
    model = "htdemucs"
    shifts = 1
    overlap = 0.25
    
    if stem_count == 6:
        model = "htdemucs_6s"
    
    if quality == 0: # Fast
        shifts = 0
        overlap = 0.1
    elif quality == 2: # Best
        if stem_count == 4:
            model = "htdemucs_ft" # Fine-tuned 4-stem
        shifts = 2
        overlap = 0.25

    # Construct Demucs Args
    args = [
        "-n", model,
        "--shifts", str(shifts),
        "--overlap", str(overlap),
        "-o", output_dir,
        "--filename", "{track}/{stem}.{ext}",
        input_file
    ]
    
    if stem_count == 2:
        args.append("--two-stems=vocals")
        
    if kwargs.get("export_mp3", False):
        args.append("--mp3")
        args.append("--mp3-bitrate")
        args.append("320")
    
    if not torch.cuda.is_available():
        args.append("-d")
        args.append("cpu")

    # Run Demucs
    demucs.separate.main(args)
    
    # Organize Files
    # Organize Files
    demucs_output_root = os.path.join(output_dir, model, base_name)
    
    mode = kwargs.get("mode", "standard")
    ext = "mp3" if kwargs.get("export_mp3", False) else "wav"
    
    if os.path.exists(demucs_output_root):
        for stem in os.listdir(demucs_output_root):
            src = os.path.join(demucs_output_root, stem)
            
            # Filter based on mode
            should_keep = True
            if mode == "vocals_only" and "vocals" not in stem:
                should_keep = False
            elif mode == "instrumental" and "no_vocals" not in stem:
                should_keep = False
            
            if should_keep:
                dst = os.path.join(output_dir, stem)
                shutil.move(src, dst)
        
        # Clean up empty folders
        shutil.rmtree(os.path.join(output_dir, model))
    
    # Copy Original if requested
    if keep_original:
        shutil.copy(input_file, os.path.join(output_dir, f"original.{ext}"))
        
    # De-Reverb Logic (Placeholder/Basic Implementation)
    if kwargs.get("dereverb", False):
        logger.info("De-Reverb requested (Experimental)")

    # Advanced Pipeline (Vocals Only)
    if mode == "vocals_only" and AdvancedAudioProcessor:
        try:
            logger.info("Starting Advanced Audio Pipeline (Ensemble/MDX)...")
            processor = AdvancedAudioProcessor(output_dir)
            
            # Demucs output might be mp3 or wav depending on flag
            demucs_vocals = os.path.join(output_dir, f"vocals.{ext}")
            
            # If MP3, we might need to convert back to WAV for processing, or ensure processor handles it
            # For simplicity, let's assume processor handles input formats supported by soundfile/ffmpeg
            
            if os.path.exists(demucs_vocals):
                final_vocals = processor.process_vocals_ultra_clean(input_file, demucs_vocals)
                
                # Rename/Move result
                if final_vocals and os.path.exists(final_vocals):
                    target_name = f"vocals_ultra_clean.wav" # Processor outputs WAV
                    shutil.move(final_vocals, os.path.join(output_dir, target_name))
                    
                    # Convert to MP3 if requested
                    if kwargs.get("export_mp3", False):
                        mp3_target = f"vocals_ultra_clean.mp3"
                        # Use pydub or ffmpeg to convert. 
                        # Since we have ffmpeg in path (checked by debug script), we can use subprocess
                        subprocess.run(f'ffmpeg -y -i "{os.path.join(output_dir, target_name)}" -b:a 320k "{os.path.join(output_dir, mp3_target)}"', shell=True)
                        os.remove(os.path.join(output_dir, target_name)) # Remove WAV
                        target_name = mp3_target
                        
                    logger.info(f"Created Ultra Clean Vocals: {target_name}")
                    
                    # Create Instrumental Inversion if needed
                    if kwargs.get("invert", False):
                        inst_path = os.path.join(output_dir, f"instrumental_inverted.wav")
                        processor.invert_audio(input_file, os.path.join(output_dir, target_name), inst_path)
                        
                        if kwargs.get("export_mp3", False):
                             mp3_inst = f"instrumental_inverted.mp3"
                             subprocess.run(f'ffmpeg -y -i "{inst_path}" -b:a 320k "{os.path.join(output_dir, mp3_inst)}"', shell=True)
                             os.remove(inst_path)
                             inst_path = mp3_inst
                             
                        logger.info(f"Created Inverted Instrumental: {inst_path}")

        except Exception as e:
            logger.error(f"Advanced Pipeline Failed: {e}")
            # Fallback to standard Demucs output is already there, so just log error.

    # Zip if requested
    if export_zip:
        shutil.make_archive(output_dir, 'zip', output_dir)


