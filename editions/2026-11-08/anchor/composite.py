"""Put the lip-synced anchor clips into a rendered Erriwaya brief.

The template is rendered twice more over the anchor windows with the anchor card replaced by a black and a
white plate. Per pixel, weight of the photo layer w = (white - black) / 255 and the composite is
black + w * anchor, so the logo, lower third, ticker, inset map and every fade stay exactly as rendered.

python3 composite.py <rendered.mp4> <out.mp4> <W> <H> <plates_dir_prefix> \
    <clip1> <clip1_start_video_s> <win1_from_frame> <win1_to_frame> [<clip2> ... ]
"""
import subprocess, sys, os
import numpy as np
from PIL import Image

src, out, W, H, plates = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
rest = sys.argv[6:]
clips = []
for i in range(0, len(rest), 4):
    clips.append(dict(path=rest[i], start=float(rest[i + 1]), f0=int(rest[i + 2]), f1=int(rest[i + 3])))

FPS = 30
fsize = W * H * 3

def clip_reader(c):
    # anchor clip covered onto WxH (focus centre, zoom 1, as coverDraw), resampled to 30 fps
    vf = f"scale=-2:{H}" if 1920 / 1088 < W / H else f"scale={W}:-2"
    vf = f"scale=w={W}:h={H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}"
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', c['path'], '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         stdout=subprocess.PIPE)
    frames = []
    while True:
        b = p.stdout.read(fsize)
        if len(b) < fsize: break
        frames.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
    p.wait()
    return frames

for c in clips:
    c['frames'] = clip_reader(c)
    print(os.path.basename(c['path']), len(c['frames']), 'frames', flush=True)

dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-map', '0:v:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                        '-i', '-', '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                        '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
n = 0
while True:
    b = dec.stdout.read(fsize)
    if len(b) < fsize: break
    fr = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    for c in clips:
        if c['f0'] <= n < c['f1']:
            pk = np.asarray(Image.open(f"{plates}-pk/{n:06d}.png").convert('RGB'), np.float32)
            pw = np.asarray(Image.open(f"{plates}-pw/{n:06d}.png").convert('RGB'), np.float32)
            w = np.clip((pw - pk).mean(axis=2, keepdims=True) / 255.0, 0, 1)
            k = int(round((n / FPS - c['start']) * FPS))
            k = min(max(k, 0), len(c['frames']) - 1)
            v = c['frames'][k].astype(np.float32)
            fr = np.clip(pk + w * v + 0.5, 0, 255).astype(np.uint8)
            break
    enc.stdin.write(fr.tobytes())
    n += 1
enc.stdin.close(); enc.wait(); dec.wait()
print('frames', n, '->', out)
