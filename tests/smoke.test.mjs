import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const cues=JSON.parse(readFileSync(resolve(root,'examples/sample-cues.json'),'utf8'));
test('Standalone app has no network dependencies',()=>{
 assert.match(html,/<title>CueCraft/);
 assert.doesNotMatch(html,/<script[^>]+src=/i);
 assert.doesNotMatch(html,/<link[^>]+href=["']https?:/i);
 assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|WebSocket/);
});
test('Embedded JavaScript parses',()=>{
 const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(js);assert.doesNotThrow(()=>new vm.Script(js));
});
test('Preloaded starter script matches sample and has non-overlapping timing',()=>{
 const match=html.match(/const ORIGINAL_CUES = (\[[^;]+\]);/);assert.ok(match);
 assert.deepEqual(JSON.parse(match[1]),cues);
 assert.deepEqual(cues.map(c=>[c.start,c.end]),[[0,14],[14,30],[30,46]]);
});
test('Onboarding demo controls exist',()=>{
 for(const id of ['video','playBtn','readerTrack','cueList','importBtn','exportBtn','editBtn','offset','fullscreenBtn','demoBtn','demoFrame','demoTitle','demoCount'])
 assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/function toggleDemo\(\)/);
});
test('Public app does not include production narration',()=>assert.doesNotMatch(html,/should-cost analysis|135 MVA|Hitachi|TAIJU/i));

test('voiceover controls and local-only recording are wired',()=>{
 for(const id of ['recordFrom','recordBtn','recordState','takeList','recordAvailability'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const name of ['startRecording','stopRecording','showTakes','wavFromTake','pcm16Wav','setRecordingControls'])assert.match(html,new RegExp('function '+name+'\\('));
 assert.match(html,/getUserMedia\(\{audio:/);
 assert.match(html,/MediaRecorder/);
 assert.match(html,/recordingSession\?recordingSession\.scriptStart/);
});

test('PCM encoder creates valid aligned mono 16-bit WAV with leading silence',async()=>{
 const source=html.match(/function pcm16Wav\([\s\S]*?^\}/m)?.[0];assert.ok(source);
 const sandbox=vm.createContext({Blob});vm.runInContext(source,sandbox);
 const wav=vm.runInContext('pcm16Wav(new Float32Array([1,-1,0.5,0]),8000,.25)',sandbox);
 const buffer=Buffer.from(await wav.arrayBuffer());
 assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WAVE');
 assert.equal(buffer.readUInt16LE(20),1);assert.equal(buffer.readUInt16LE(22),1);
 assert.equal(buffer.readUInt32LE(24),8000);assert.equal(buffer.readUInt16LE(34),16);
 assert.equal(buffer.readUInt32LE(40),4008);assert.equal(buffer.length,4052);
 assert.equal(buffer.readInt16LE(44),0);assert.equal(buffer.readInt16LE(44+2000*2),32767);
 assert.equal(buffer.readInt16LE(44+2001*2),-32768);
 assert.equal(buffer.readInt16LE(44+2002*2),16384);
 assert.throws(()=>vm.runInContext('pcm16Wav(new Float32Array([0]),8000,-1)',sandbox),/Invalid WAV/);
});

test('recordings are session-only and can be removed without affecting the cue script',()=>{
 assert.match(html,/URL\.revokeObjectURL\(take\.url\)/);
 assert.match(html,/takes\.filter\(t=>t!==take\)/);
 assert.doesNotMatch(html,/localStorage\.setItem\([^\n]*takes/);
});

test('application version is embedded in HTML metadata and displayed dynamically',()=>{
 const versions = [...html.matchAll(/<meta name="app-version" content="(\d+\.\d+\.\d+)">/g)];
 assert.equal(versions.length, 1);
 assert.match(html, /<meta name="application-name" content="CueCraft">/);
 assert.match(html, /<span id="appVersion" aria-label="Application version"><\/span>/);
 assert.match(html, /const APP_VERSION = document\.querySelector\('meta\[name="app-version"\]'\)\.content;/);
 assert.match(html, /getElementById\('appVersion'\)\.textContent/);
 assert.match(html, /\$\{APP_VERSION\}/);
});


test('responsive studio uses percentage video width, full viewport and an accessible divider',()=>{
 assert.match(html, /\.shell\{--video-column:39%;width:100%;max-width:none;/);
 assert.doesNotMatch(html, /grid-template-columns:minmax\(0,1fr\) 336px/);
 assert.match(html, /id="layoutDivider"[^>]+role="separator"/);
 for(const method of ['bindLayoutDivider','setVideoColumnRatio','layoutLimits']) assert.match(html,new RegExp('function '+method+'\\('));
 assert.match(html, /pointerdown/);
 assert.match(html, /pointermove/);
 assert.match(html, /dblclick/);
 assert.match(html, /videoColumnRatio/);
});

test('tablet and mobile panels stack with a full-width video',()=>{
 assert.match(html, /@media\(max-width:980px\)\{\.shell\{display:flex;flex-direction:column;/);
 assert.match(html, /\.side > \.side-panel:first-child\{grid-column:1\/-1\}/);
 assert.match(html, /\.layout-divider\{display:none\}/);
 assert.match(html, /\.video-placeholder\{width:100%;aspect-ratio:16\/9;/);
});

test('v0.3.0 review and trim controls are present and do not persist recordings',()=>{
 for(const id of ['reviewStatus','reviewLabel','stopReviewBtn','reviewAudio'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const method of ['startSyncReview','stopSyncReview','syncReviewToTimeline','clipBounds','setTakeTrim'])assert.match(html,new RegExp('function '+method+'\\('));
 assert.match(html,/take\.startAt\+trimStart/);assert.match(html,/syncReviewToTimeline\(\);requestAnimationFrame\(tick\)/);
 assert.match(html,/\.side > \.side-panel:first-child\{position:sticky/);
 assert.doesNotMatch(html,/localStorage\.setItem\([^\n]*(?:reviewSession|takes)/);
});
test('take trim leaves a valid interval at the correct video timestamps',()=>{
 const a=html.match(/function clipBounds\(take\)\{[\s\S]*?^\}/m)?.[0],b=html.match(/function setTakeTrim\(take,which,value\)\{[\s\S]*?^\}/m)?.[0];assert.ok(a&&b);
 const env=vm.createContext({reviewSession:null,stopSyncReview(){}});vm.runInContext(a+'\n'+b,env);
 const take={startAt:18,length:4,trimStart:0,trimEnd:0};
 env.setTakeTrim(take,'start',.75);env.setTakeTrim(take,'end',1.25);
 assert.deepEqual({...env.clipBounds(take)},{first:.75,last:2.75,videoStart:18.75,videoEnd:20.75});
 assert.throws(()=>env.setTakeTrim(take,'start',3.5),/Leave at least/);
 assert.throws(()=>env.setTakeTrim(take,'end',-1),/valid non-negative/);
});
test('trimmed WAV has retained samples after aligned leading silence',async()=>{
 const f=[html.match(/function pcm16Wav\([\s\S]*?^\}/m)?.[0],html.match(/function clipBounds\(take\)\{[\s\S]*?^\}/m)?.[0],html.match(/async function wavFromTake\(take\)\{[^\n]+\n[^\n]+\}/m)?.[0]];assert.ok(f.every(Boolean));
 const samples=new Float32Array(4000);samples.fill(.5);
 const ctx=vm.createContext({Blob,Float32Array,window:{AudioContext:class {async decodeAudioData(){return {sampleRate:8000,length:4000,numberOfChannels:1,getChannelData:()=>samples};}async close(){}}}});
 vm.runInContext(f.join('\n'),ctx);
 const wav=await ctx.wavFromTake({blob:new Blob(['test']),startAt:2,length:.5,trimStart:.1,trimEnd:.1});
 const b=Buffer.from(await wav.arrayBuffer());assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.readUInt32LE(40),2*(Math.round(2.1*8000)+2400));
 assert.equal(b.readInt16LE(44),0);assert.equal(b.readInt16LE(44+Math.round(2.1*8000)*2),16384);
});
