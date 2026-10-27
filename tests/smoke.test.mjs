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


test('v0.4 cue-recording UI and entry points exist',()=>{
 assert.match(html, /meta name="app-version" content="0\.4\.0"/);
 for(const id of ['recordMode','recordCue','rangeStart','rangeEnd','recordPreroll','assemblyList','assemblyWarnings','previewAssemblyBtn','exportAssemblyBtn'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const fn of ['recordingTarget','beginCapture','buildAssemblyPlan','renderAssembly','assembleSamples','assembledWav','runAssembly'])assert.match(html,new RegExp('function '+fn+'\\('));
 assert.match(html,/MAX_TAKES=120/);
 assert.doesNotMatch(html,/takes\.pop\(\)/);
 assert.match(html,/finally\{recordStarting=false;els.recordBtn.disabled=false;\}/);
});
test('v0.4 cue/range/continuous target semantics preserve cue timecodes',()=>{
 const source=html.match(/function recordingTarget\(\)\{[\s\S]*?^\}/m)?.[0];assert.ok(source);
 const c=[{start:0,end:14,text:'a',title:'one'},{start:14,end:30,text:'b',title:'two'},{start:30,end:46,text:'c',title:'three'}];
 const els={recordMode:{value:'cue'},recordCue:{value:'1'},rangeStart:{value:'0'},rangeEnd:{value:'2'},recordFrom:{value:'start'},recordPreroll:{value:'3'},video:{}};
 const cx=vm.createContext({cues:c,els,clock:0,duration:46,offset:0,videoURL:null,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),currentAt:t=>t<14?0:t<30?1:2,cueSignature:c=>JSON.stringify([c.start,c.end,c.title,c.text])});
 vm.runInContext(source,cx);
 const cue=vm.runInContext('recordingTarget()',cx);assert.equal(cue.requested,14);assert.equal(cue.endAt,30);assert.equal(cue.lead,3);
 els.recordMode.value='range';const range=vm.runInContext('recordingTarget()',cx);assert.equal(range.endAt,46);assert.equal(range.last,2);
 els.rangeStart.value='2';els.rangeEnd.value='0';assert.throws(()=>vm.runInContext('recordingTarget()',cx),/last cue/);
 els.recordMode.value='continuous';const full=vm.runInContext('recordingTarget()',cx);assert.equal(full.endAt,46);assert.equal(full.lead,0);
});
test('v0.4 assembly merges contiguous source and warns about unselected cues',()=>{
 const extract=name=>{const f=html.match(new RegExp('function '+name+'\\([^]*?^\\}','m'))?.[0];assert.ok(f,name);return f;};
 const ctx=vm.createContext({fmt:t=>String(t),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 for(const fn of ['clipBounds','cueSignature','buildAssemblyPlan'])vm.runInContext(extract(fn),ctx);
 const cues=[{start:0,end:10,title:'A',text:'a'},{start:10,end:20,title:'B',text:'b'},{start:25,end:30,title:'C',text:'c'}];
 const key=i=>JSON.stringify([cues[i].start,cues[i].end,cues[i].title,cues[i].text]);
 const take={number:1,startAt:0,length:20,trimStart:0,trimEnd:0,mode:'range',cueSignatures:{0:key(0),1:key(1)}};
 const full=vm.runInContext('buildAssemblyPlan(cues,takes,picks,0)',vm.createContext({...ctx,cues,takes:[take],picks:{0:1,1:1}}));
 assert.equal(full.complete,2);assert.equal(full.segments.length,1);assert.equal(full.segments[0].end,20);assert.match(full.warnings.join(' '),/Cue 3/);
});
test('v0.4 audio assembly preserves silent timeline windows',()=>{
 const source=html.match(/function assembleSamples\([^]*?^\}/m)?.[0];assert.ok(source);
 const audio=new Float32Array(8000).fill(.5),decoded={sampleRate:8000,length:8000,numberOfChannels:1,getChannelData:()=>audio};
 const seg={take:{number:1},start:.2,end:.6,sourceStart:0,sourceEnd:.4};
 const context=vm.createContext({MAX_ASSEMBLY_SECONDS:900,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),seg,decoded});
 vm.runInContext(source,context);
 const result=vm.runInContext('assembleSamples({segments:[seg]},new Map([[1,decoded]]),8000,8000)',context);
 assert.equal(result[500],0);assert.ok(Math.abs(result[3000]-.5)<1e-5);assert.equal(result[6000],0);
 assert.throws(()=>vm.runInContext('assembleSamples({segments:[]},new Map(),7200001,8000)',context),/15-minute/);
});
