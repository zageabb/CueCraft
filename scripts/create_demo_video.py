#!/usr/bin/env python3
"""Generate a silent three-slide 46-second practice video for CueCraft.
Requires: pip install Pillow, and FFmpeg on PATH.
"""
import argparse
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
def font(size,bold=False):
 paths=(['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf'] if bold else ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/System/Library/Fonts/Supplemental/Arial.ttf'])
 for p in paths:
  if Path(p).exists():return ImageFont.truetype(p,size)
 return ImageFont.load_default()
def make_slide(i,start,end,path):
 image=Image.new('RGB',(1280,720),'#0b1a29')
 d=ImageDraw.Draw(image)
 d.rectangle((0,0,12,720),fill='#7be0dd')
 d.rounded_rectangle((58,48,295,98),15,fill='#194855')
 d.text((78,58),'CUECRAFT',font=font(25,True),fill='#7be0dd')
 heading=['Read with confidence','Synchronise your script','Save and reuse'][i]
 desc=['Follow the words as your narration progresses.','Keep each cue aligned with your footage.','Edit, export and import scripts locally.'][i]
 d.text((68,142),heading,font=font(58,True),fill='#f0fafc')
 d.text((71,239),desc,font=font(26),fill='#a8c1cd')
 d.rounded_rectangle((75,325,1200,555),28,fill='#102a3b',outline='#356474',width=3)
 if i==0:
  d.text((105,370),'ON AIR',font=font(24,True),fill='#7be0dd')
  d.text((105,430),'Welcome to CueCraft. Follow the prompts.',font=font(34,True),fill='white')
 elif i==1:
  d.text((110,366),'00:00',font=font(22,True),fill='#b6d0d6')
  d.text((1060,366),'00:46',font=font(22,True),fill='#b6d0d6')
  d.rounded_rectangle((110,422,1150,438),8,fill='#345363')
  d.rounded_rectangle((110,422,700,438),8,fill='#7be0dd')
  for x,t in [(112,'Welcome'),(438,'Synchronise'),(795,'Save & reuse')]:
   d.text((x,470),t,font=font(23,True),fill='white')
 else:
  for x,cap in [(125,'JSON'),(493,'CSV'),(864,'SRT')]:
   d.rounded_rectangle((x,379,x+265,507),18,fill='#1b4b59')
   d.text((x+65,424),cap,font=font(40,True),fill='#8ce5e1')
 d.line((70,630,1210,630),fill='#365565',width=2)
 d.text((72,651),'SILENT PRACTICE VIDEO  •  RECORD YOUR OWN NARRATION',font=font(17,True),fill='#a8c1cd')
 d.text((1000,651),f'00:{start:02d}–00:{end:02d}',font=font(19,True),fill='#7be0dd')
 image.save(path,optimize=True)
def main(output):
 if not shutil.which('ffmpeg'):raise SystemExit('FFmpeg is not available on PATH')
 cues=json.loads((ROOT/'examples/sample-cues.json').read_text())
 if [(x['start'],x['end']) for x in cues]!=[(0,14),(14,30),(30,46)]:raise SystemExit('Starter timings changed; update generator')
 output.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory() as tmp:
  inputs=[]
  for i,cue in enumerate(cues):
   slide=Path(tmp)/f'slide{i}.png'
   make_slide(i,cue['start'],cue['end'],slide)
   inputs+=['-loop','1','-framerate','25','-t',str(cue['end']-cue['start']),'-i',str(slide)]
  cmd=['ffmpeg','-hide_banner','-loglevel','error','-y',*inputs,'-filter_complex','[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]','-map','[v]','-c:v','libx264','-preset','medium','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart','-r','25','-an',str(output)]
  subprocess.run(cmd,check=True)
 print('Created',output)
if __name__=='__main__':
 ap=argparse.ArgumentParser()
 ap.add_argument('--output',type=Path,default=ROOT/'examples/cuecraft_demo.mp4')
 main(ap.parse_args().output)
