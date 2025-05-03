import cv2
from PIL import Image
import tempfile

def extract_frames(video_file, num=10):
    # write to temp, open with OpenCV
    tmp = tempfile.NamedTemporaryFile(suffix='.mp4')
    video_file.save(tmp.name)
    cap = cv2.VideoCapture(tmp.name)
    frames, count = [], int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, count // num)
    for i in range(0, count, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret: break
        frames.append(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
    cap.release()
    return frames
