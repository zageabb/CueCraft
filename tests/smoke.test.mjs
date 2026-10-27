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
