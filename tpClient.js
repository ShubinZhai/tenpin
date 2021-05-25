const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

const prompt = require('prompt-sync')({sigint: true});

const { Kafka, logLevel  } = require('kafkajs')

const host = process.env.HOST || "localhost"
const topic = process.env.TOPIC || 'tenpinscore'


const kafka = new Kafka({
    clientId: 'tenpin-evt-producer',
    logLevel: logLevel.INFO,
    brokers: [`${host}:9092`],
})

const producer = kafka.producer({allowAutoTopicCreation: true, })

const tenpinplayer  = require('./registerplayer.js');

clear();

console.log(
  chalk.yellow(
    figlet.textSync('ten pin player', { horizontalLayout: 'full' })
  )
);

const run = async () => {
  play = await tenpinplayer.register();
  play.playerid=play.game + '_' + play.playername;


  
    await producer.connect()

 
  while (true) {

    let pinsdown = prompt('enter a pin drop number from 1 to 10: ');
    pinsdown = Number(pinsdown);

    play.score=pinsdown;
    let dt = new Date();
    play.datetime = Date.now();
    play.id = play.playerid + '_' + play.datetime;
    console.log(play);
    

    const msg = {
        key: "notused", 
        value: JSON.stringify(play)
    }
    await producer.send({
        topic: topic,
        messages: [msg],
    })
    .then(res => {
      // console.log(`[Info] message of size [${sizeOfMsg} bytes] on offset[${res[0].baseOffset}]`);
      // return res[0];
    })

  }

};


run();

