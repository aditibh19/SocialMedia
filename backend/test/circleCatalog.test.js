const test=require('node:test');
const assert=require('node:assert/strict');
const {lessons,games,quests,publicCatalog,gradeGame}=require('../data/circleCatalog');

test('catalog omits private answer keys and explanations',()=>{
 const c=publicCatalog();
 assert.equal(c.lessons.length,lessons.length);
 assert.equal(c.games.length,games.length);
 assert.equal(c.quests.length,quests.length);
 for(const l of c.lessons){assert.equal(l.correctIndex,undefined); assert.equal(l.explanation,undefined)}
 for(const g of c.games)for(const q of g.questions){assert.equal(q.correctIndex,undefined); assert.equal(q.explanation,undefined)}
});
test('game grading checks answers server-side',()=>{
 const g=games[0]; const answers=g.questions.map(q=>q.correctIndex);
 const result=gradeGame(g,answers);
 assert.equal(result.score,g.questions.length);
 assert.equal(result.total,g.questions.length);
 assert.equal(gradeGame(g,[0]),null);
 assert.equal(gradeGame(g,g.questions.map(()=>99)),null);
});
test('catalog IDs are unique, safe and quest modes are supported',()=>{
 const all=[...lessons,...games,...quests].map(x=>x.id);
 assert.equal(new Set(all).size,all.length);
 assert.ok(all.every(id=>/^[a-z0-9-]+$/.test(id)));
 assert.ok(quests.every(x=>['create','connect'].includes(x.mode)));
});
