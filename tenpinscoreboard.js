const { Kafka, logLevel } = require('kafkajs')
const redis = require("redis");

const redisPort = 6379
const scorecache = redis.createClient(redisPort);

const host = process.env.HOST || "localhost"
const topic = 'tenpinscore'

// create kafka client
const kafka = new Kafka({
    clientId: 'tenpinscoreboard',
    logLevel: logLevel.INFO,
    brokers: [`${host}:9092`],
})

const consumer = kafka.consumer({ groupId: 'tenpinscoreboard' })


const recordScore = async ({ topic, partition, message }) => {
    const prefix = `${topic}[${partition}|${message.offset}] / ${message.timestamp}`
    //console.log(`\u001b[1;32m - ${prefix} ${message.key}# \u001b[1;0m`);
    //console.log(`${message.value}`);
    const play = JSON.parse(`${message.value}`);
    console.log(play.playername + " scored a " + play.score);

    let score={};
    let frames=[];
    let leader={};
    leader.playerid=null;
    leader.score=null;
    scorecache.get("leader", async (err, cachedleader) => {
        if(cachedleader){
            leader=JSON.parse(cachedleader);
            if(leader.playerid==null){
                leader.playerid=play.playerid;
                leader.score=play.score;
                scorecache.setex("leader", 600, JSON.stringify(leader));

            }
        }
        else{
            scorecache.setex("leader", 600, JSON.stringify(leader));
        }
    });

    scorecache.get(play.playerid, async (err, cachedscore) => {
        if (err) throw err;


        if (cachedscore) {
            let playercachedscore= JSON.parse(cachedscore);


            let lastframe = playercachedscore.frames[playercachedscore.frames.length-1];

            //check if game is over @ 10th frame
            if (lastframe.id==10 && !lastframe.iscurrentframe) { //last frame is done
                if(lastframe.bonusballsleft<=0){
                    let finalscore=0;
                    let frms=[]
                    frms= playercachedscore.frames;
                    
                    playercachedscore.frames.forEach(frm=> finalscore+=frm.actualscore);
                    playercachedscore.finalscore=finalscore;
                    scorecache.setex(playercachedscore.playerid, 600, JSON.stringify(playercachedscore));
                 
                    if(leader.score<playercachedscore.finalscore){
                        leader.playerid=playercachedscore.playerid;
                        leader.score= playercachedscore.finalscore;
                    }
                    scorecache.setex("leader", 600, JSON.stringify(leader));

                    console.log("Game is over for player: " + playercachedscore.playername + " with score of: " + playercachedscore.finalscore);
                    return;
        
                }
                else{//there is bonus ball after last frame



                    playercachedscore.frames.filter(frm=>frm.bonusballsleft>0).forEach(val=>{
                        val.bonuspoints+=play.score;
                        if(val.bonustype=='X'){
                            val.actualscore = val.firstballscore+val.bonuspoints;
                        }
                        else if(val.bonustype='/'){
                            val.actualscore=val.firstballscore+val.secondballscore+play.score;
                        }
                        val.bonusballsleft--;
                    })

                    scorecache.setex(playercachedscore.playerid, 600, JSON.stringify(playercachedscore));
                    return;

                }
            }

            //not at last frame yet...
            if(lastframe.iscurrentframe){
                let currentframeid=lastframe.id;
                lastframe.secondballscore=play.score;
                playercachedscore.datetime=play.datetime;
                lastframe.iscurrentframe=false;
                if(lastframe.firstballscore+lastframe.secondballscore>=10){ //make last frame spare frame
                    lastframe.bonusballsleft=1;
                    lastframe.bonustype='/'

                }else {
                    lastframe.actualscore=lastframe.firstballscore+ lastframe.secondballscore;                    

                }
                //update last frame with updated value
                playercachedscore.frames[playercachedscore.frames.length-1] = lastframe;


                //apply bonus to all frames with bonusball left except currrent frame
                playercachedscore.frames.filter(frm=>frm.bonusballsleft>0&&frm.id!=currentframeid).forEach(val=>{
                    val.bonuspoints+=play.score;
                    if(val.bonustype=='X'){
                        val.actualscore = val.firstballscore+val.bonuspoints;
                    }
                    else if(val.bonustype='/'){
                        val.actualscore=val.firstballscore+val.secondballscore+play.score;
                    }
                    val.bonusballsleft--;
                })
 
            }else { //start new frame
                let frame={};
                frame.id=playercachedscore.frames.length+1;
                frame.firstballscore=null;
                frame.secondballscore=null;
                frame.actualscore=null
                frame.bonusballsleft=null;
                frame.bonuspoints=null;
                frame.bonustype=null;
                frame.iscurrentframe=true; 
                if(play.score==10){
                    frame.firstballscore=10;
                    frame.bonustype='X';
                    frame.bonusballsleft=2;
                    frame.iscurrentframe=false; //move "cursor to next frame"
    
                }
                else{
                    frame.firstballscore=play.score;
                }
                
                //apply bonus to all frames with bonusball left
                playercachedscore.frames.filter(frm=>frm.bonusballsleft>0).forEach(val=>{
                    val.bonuspoints+=play.score;
                    if(val.bonustype=='X'){
                        val.actualscore = val.firstballscore+val.bonuspoints;
                    }
                    else if(val.bonustype='/'){
                        val.actualscore=val.firstballscore+val.secondballscore+play.score;
                    }
                    val.bonusballsleft--;
                    //playercachedscore.frames[val.id]= val;
                })

                playercachedscore.frames.push(frame);




            }
            
            let finalscore=0;
            let frms=[]
            frms= playercachedscore.frames;
            
            playercachedscore.frames.forEach(frm=> finalscore+=frm.actualscore);
            playercachedscore.finalscore=finalscore;

            scorecache.setex(playercachedscore.playerid, 600, JSON.stringify(playercachedscore));
         
            if(leader.score<playercachedscore.finalscore){
                leader.playerid=playercachedscore.playerid;
                leader.score= playercachedscore.finalscore;
            }
            scorecache.setex("leader", 600, JSON.stringify(leader));

        }

        //first roll for the player for the game
        else {

            //init player score for whole game
            score.playerid=play.playerid; //key for cache, by game_playerid
            score.playername=play.playername;
            score.game=play.game;
            score.datetime= play.datetime;
            score.frames=[];
            score.islastframe=false;
            score.finalscore=null;
            
            //init frame
            let frame={};
            frame.id=1;
            frame.firstballscore=null;
            frame.secondballscore=null;
            frame.actualscore=null
            frame.bonusballsleft=null;
            frame.bonuspoints=null;
            frame.bonustype=null;
            frame.iscurrentframe=true; //used to check if frame is done or not: true not done, false: new frame is ready


            //if first ball is strike
            if(play.score==10){
                frame.firstballscore=10;
                frame.bonustype='X';
                frame.bonusballsleft=2;
                frame.iscurrentframe=false; //move "cursor to next frame"

            }
            else{
                frame.firstballscore=play.score;
            }


            score.finalscore=frame.firstballscore;
            score.frames.push(frame);
            
            scorecache.setex(score.playerid, 600, JSON.stringify(score));
        }
    });

}


const run = async () => {
    await consumer.connect(); 
    await consumer.subscribe({ 
        topic,
        fromBeginning: true
    });
    await consumer.run({    
        eachMessage: recordScore
        /**
         *  eachBatch: async ({ batch }) => {
         *      console.log(batch);
         *  }
         */

        // eachBatch: recordBatchScores,
    })
}

run().catch(e => console.error(`[Error] consumer: ${e.message}`, e));


