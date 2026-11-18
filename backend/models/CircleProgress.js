const mongoose = require('mongoose');

const circleProgressSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref:'User', required:true, unique:true, index:true},
  lessonsCompleted: {type:[String], default:[]},
  questsCompleted: {type:[String], default:[]},
  gameBestScores: {type:Map, of:Number, default:{}},
  gameAttempts: {type:Map, of:Number, default:{}}
}, {timestamps:true});

module.exports=mongoose.models.CircleProgress || mongoose.model('CircleProgress',circleProgressSchema);
