const router=require('express').Router();
const auth=require('../middleware/authMiddleware');
const CircleProgress=require('../models/CircleProgress');
const {lessons,games,quests,publicCatalog,gradeGame}=require('../data/circleCatalog');

router.use(auth);

const emptyProgress=()=>({lessonsCompleted:[],questsCompleted:[],gameBestScores:{},gameAttempts:{}});
router.get('/catalog',(req,res)=>res.json(publicCatalog()));
router.get('/progress',async(req,res)=>{
  const progress=await CircleProgress.findOne({user:req.user.id}).lean();
  if(!progress)return res.json({progress:emptyProgress()});
  const plain=value=>value instanceof Map?Object.fromEntries(value):value||{};
  return res.json({progress:{
    lessonsCompleted:progress.lessonsCompleted||[],
    questsCompleted:progress.questsCompleted||[],
    gameBestScores:plain(progress.gameBestScores),
    gameAttempts:plain(progress.gameAttempts)
  }});
});
router.post('/lessons/:id/answer',async(req,res)=>{
  const lesson=lessons.find(x=>x.id===req.params.id);
  if(!lesson)return res.status(404).json({message:'Lesson not found'});
  const choice=req.body?.choice;
  if(!Number.isInteger(choice)||choice<0||choice>=lesson.options.length)return res.status(400).json({message:'Choose a valid answer'});
  const correct=choice===lesson.correctIndex;
  if(correct)await CircleProgress.updateOne({user:req.user.id},{$addToSet:{lessonsCompleted:lesson.id}},{upsert:true,setDefaultsOnInsert:false});
  res.json({correct,correctIndex:lesson.correctIndex,explanation:lesson.explanation,completed:correct});
});
router.post('/games/:id/submit',async(req,res)=>{
  const game=games.find(x=>x.id===req.params.id);
  if(!game)return res.status(404).json({message:'Game not found'});
  const result=gradeGame(game,req.body?.answers);
  if(!result)return res.status(400).json({message:'Submit one valid answer for every question'});
  await CircleProgress.updateOne({user:req.user.id},{$max:{[`gameBestScores.${game.id}`]:result.score},$inc:{[`gameAttempts.${game.id}`]:1}},{upsert:true,setDefaultsOnInsert:false});
  res.json(result);
});
router.post('/quests/:id/complete',async(req,res)=>{
  const quest=quests.find(x=>x.id===req.params.id);
  if(!quest)return res.status(404).json({message:'Quest not found'});
  await CircleProgress.updateOne({user:req.user.id},{$addToSet:{questsCompleted:quest.id}},{upsert:true,setDefaultsOnInsert:false});
  res.json({completed:true,message:'Quest marked complete. Nice work!'});
});
router.delete('/quests/:id/complete',async(req,res)=>{
  const quest=quests.find(x=>x.id===req.params.id);
  if(!quest)return res.status(404).json({message:'Quest not found'});
  await CircleProgress.updateOne({user:req.user.id},{$pull:{questsCompleted:quest.id}});
  res.json({completed:false});
});
module.exports=router;
