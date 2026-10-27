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
