import React,{useEffect,useState} from 'react';
import {Brain,Gamepad2,Palette,Users,ArrowRight,CheckCircle2,RefreshCw,Target,MessageCircle,Share2,ShieldCheck,ArrowLeft} from 'lucide-react';
import './circleSwitch.css';
const types=[
  {id:'learn',title:'Learn',subtitle:'One useful thing',icon:Brain},
  {id:'play',title:'Play',subtitle:'A quick brain game',icon:Gamepad2},
  {id:'create',title:'Create',subtitle:'Do something offline',icon:Palette},
  {id:'connect',title:'Connect',subtitle:'Reach out to someone',icon:Users}
];
const empty={lessonsCompleted:[],questsCompleted:[],gameBestScores:{},gameAttempts:{}};
export default function CircleSwitch({request,onSharePost,onOpenChat}){
  const [catalog,setCatalog]=useState(null);
  const [progress,setProgress]=useState(empty);
  const [mode,setMode]=useState('learn');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [lessonId,setLessonId]=useState('');
  const [lessonChoice,setLessonChoice]=useState(-1);
  const [lessonResult,setLessonResult]=useState(null);
  const [gameId,setGameId]=useState('');
  const [gameAnswers,setGameAnswers]=useState({});
  const [gameResult,setGameResult]=useState(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    setLoading(true);
    Promise.all([request('/api/circle/catalog'),request('/api/circle/progress')]).then(([c,p])=>{
      if(active){setCatalog(c);setProgress(p.progress||empty);setError('');}
    }).catch(err=>{if(active)setError(err.message||'Could not load Circle Switch.');}).finally(()=>{if(active)setLoading(false)});
    return()=>{active=false;};
  },[request]);
  const submitLesson=async()=>{
    if(!lessonId||lessonChoice<0||busy)return;
    setBusy(true);setError('');
    try{
      const result=await request(`/api/circle/lessons/${lessonId}/answer`,{method:'POST',body:{choice:lessonChoice}});
      setLessonResult(result);
      if(result.completed)setProgress(p=>({...p,lessonsCompleted:Array.from(new Set([...p.lessonsCompleted,lessonId]))}));
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const submitGame=async()=>{
    const game=catalog?.games?.find(g=>g.id===gameId);
    if(!game||game.questions.some(q=>!Number.isInteger(gameAnswers[q.id]))||busy)return;
    setBusy(true);setError('');
    try{
      const result=await request(`/api/circle/games/${gameId}/submit`,{method:'POST',body:{answers:game.questions.map(q=>gameAnswers[q.id])}});
      setGameResult(result);
      setProgress(p=>({...p,gameBestScores:{...p.gameBestScores,[gameId]:Math.max(p.gameBestScores[gameId]||0,result.score)},gameAttempts:{...p.gameAttempts,[gameId]:(p.gameAttempts[gameId]||0)+1}}));
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const toggleQuest=async(quest)=>{
    if(busy)return;
    const completed=progress.questsCompleted.includes(quest.id);
    setBusy(true);setError('');
    try{
      await request(`/api/circle/quests/${quest.id}/complete`,{method:completed?'DELETE':'POST'});
      setProgress(p=>({...p,questsCompleted:completed?p.questsCompleted.filter(id=>id!==quest.id):[...p.questsCompleted,quest.id]}));
    }catch(err){setError(err.message)}finally{setBusy(false)}
  };
  const lesson=catalog?.lessons?.find(l=>l.id===lessonId);
  const game=catalog?.games?.find(g=>g.id===gameId);
  const selectMode=id=>{setMode(id);setError('');setLessonResult(null);setGameResult(null);};
  return <div className="circle-switch">
    <div className="switch-hero"><span className="eyebrow">✦ CIRCLE SWITCH</span><h1>Less scrolling. More doing.</h1><p>Pick what you want from the next few minutes. Learn, play, create, or connect — then enjoy your day.</p></div>
    <div className="switch-mode-grid">{types.map(({id,title,subtitle,icon:Icon})=><button key={id} className={'switch-mode '+(mode===id?'selected':'')} onClick={()=>selectMode(id)}><Icon size={24}/><strong>{title}</strong><small>{subtitle}</small></button>)}</div>
    {loading&&<div className="switch-panel card">Loading your activities…</div>}
    {error&&<p className="switch-error" role="alert">{error}</p>}
    {!loading&&catalog&&<>
      <div className="switch-progress card"><div><strong>Your progress</strong><small>Private to you • no streaks or popularity rankings</small></div><div className="switch-progress-stats"><span><b>{progress.lessonsCompleted.length}</b> lessons</span><span><b>{Object.values(progress.gameAttempts||{}).reduce((a,b)=>a+b,0)}</b> games played</span><span><b>{progress.questsCompleted.length}</b> quests</span></div></div>
      {mode==='learn'&&<div className="switch-panel card">
        <div className="switch-section-title"><div><span className="eyebrow">MICROSKILLS</span><h3>One idea you can use today</h3></div><ShieldCheck size={23}/></div>
        <div className="switch-item-grid">{catalog.lessons.map(l=><button key={l.id} className={'switch-tile '+(lessonId===l.id?'active':'')} onClick={()=>{setLessonId(l.id);setLessonChoice(-1);setLessonResult(null)}}><small>{l.category} · {l.minutes} min</small><strong>{l.title}</strong>{progress.lessonsCompleted.includes(l.id)&&<span className="switch-complete"><CheckCircle2 size={14}/> Completed</span>}</button>)}</div>
        {lesson&&<div className="switch-workspace"><button className="switch-back" onClick={()=>{setLessonId('');setLessonResult(null)}}><ArrowLeft size={15}/> All lessons</button><h3>{lesson.title}</h3><p>{lesson.intro}</p><div className="switch-tip"><strong>Here's the useful idea:</strong><p>{lesson.takeaway}</p></div><strong>{lesson.question}</strong><div className="switch-answer-list">{lesson.options.map((option,index)=><button key={index} className={lessonChoice===index?'chosen':''} disabled={!!lessonResult} onClick={()=>setLessonChoice(index)}>{option}</button>)}</div>{lessonResult?<div className={'switch-feedback '+(lessonResult.correct?'good':'')}><strong>{lessonResult.correct?'Correct! Nice work.':'Not quite — now you know.'}</strong><p>{lessonResult.explanation}</p><button className="secondary" onClick={()=>{setLessonChoice(-1);setLessonResult(null)}}>Try again</button></div>:<button className="primary" disabled={lessonChoice<0||busy} onClick={submitLesson}>Check answer <ArrowRight size={16}/></button>}</div>}
      </div>}
      {mode==='play'&&<div className="switch-panel card"><div className="switch-section-title"><div><span className="eyebrow">BRAIN BATTLES</span><h3>Play a short, useful game</h3></div><Gamepad2 size={23}/></div>
        <div className="switch-item-grid">{catalog.games.map(g=><button key={g.id} className={'switch-tile '+(gameId===g.id?'active':'')} onClick={()=>{setGameId(g.id);setGameAnswers({});setGameResult(null)}}><small>{g.category} · {g.minutes} min</small><strong>{g.title}</strong><span>{g.description}</span>{Number.isInteger(progress.gameBestScores[g.id])&&<span className="switch-complete">Best {progress.gameBestScores[g.id]}/{g.questions.length}</span>}</button>)}</div>
        {game&&<div className="switch-workspace"><button className="switch-back" onClick={()=>{setGameId('');setGameResult(null)}}><ArrowLeft size={15}/> All games</button><h3>{game.title}</h3><p>Answer all {game.questions.length} questions, then reveal your result. You can replay without losing anything.</p>{game.questions.map((q,i)=><div className="switch-game-question" key={q.id}><strong>{i+1}. {q.prompt}</strong><div className="switch-answer-list">{q.options.map((option,j)=><button key={j} className={gameAnswers[q.id]===j?'chosen':''} disabled={!!gameResult} onClick={()=>setGameAnswers(a=>({...a,[q.id]:j}))}>{option}</button>)}</div>{gameResult&&<div className={'switch-feedback '+(gameResult.details[i].correct?'good':'')}><strong>{gameResult.details[i].correct?'Correct answer!':'Review this one'}</strong><p>{gameResult.details[i].explanation}</p></div>}</div>)}{gameResult?<div className="switch-game-result"><strong>You scored {gameResult.score} out of {gameResult.total}.</strong><p>Take the lesson with you, not just the score.</p><button className="secondary" onClick={()=>{setGameAnswers({});setGameResult(null)}}><RefreshCw size={15}/> Play again</button></div>:<button className="primary" disabled={busy||game.questions.some(q=>!Number.isInteger(gameAnswers[q.id]))} onClick={submitGame}>Reveal result <ArrowRight size={16}/></button>}</div>}
      </div>}
      {(mode==='create'||mode==='connect')&&<div className="switch-panel card"><div className="switch-section-title"><div><span className="eyebrow">{mode==='create'?'REAL-LIFE QUESTS':'SOCIAL MISSIONS'}</span><h3>{mode==='create'?'Make something away from the feed':'Connect without the noise'}</h3></div><Target size={23}/></div><p className="switch-intro">These are real-life prompts, not tasks we monitor. Mark a quest complete on your own terms. Sharing is optional.</p><div className="switch-quest-grid">{catalog.quests.filter(q=>q.mode===mode).map(q=><div key={q.id} className="switch-quest"><div><small>About {q.minutes} min</small><h4>{q.title}</h4><p>{q.description}</p></div><div className="switch-quest-actions"><button className={progress.questsCompleted.includes(q.id)?'secondary':'primary'} disabled={busy} onClick={()=>toggleQuest(q)}>{progress.questsCompleted.includes(q.id)?<><CheckCircle2 size={15}/> Completed (undo)</>:<><CheckCircle2 size={15}/> Mark complete</>}</button><button className="switch-text-action" onClick={()=>onSharePost(q.prompt)}><Share2 size={15}/> Optional post</button></div></div>)}</div>{mode==='connect'&&<button className="secondary" onClick={onOpenChat}><MessageCircle size={17}/> Open Circle messages</button>}</div>}
      <div className="switch-end"><CheckCircle2 size={19}/><span>Done for now? That's a good stopping point. Go enjoy the rest of your day.</span></div>
    </>}
  </div>;
}
