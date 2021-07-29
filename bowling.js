class Blowling{
    constructor(name, players){
        this._name = name;
        this._players=players;
    }
    get name(){
        return this._name;
    }
    set name(name){
        this_name=name;
    }

    calcScore(){
        return 100;
    }

}

class player{
    constructor(name){
        this._name=name;
        this._scores=[];
    }

    set score(score){
        this._scores.push()
    }

}

class ScoringState{
    constructor(frame, roll, score){
        this._frame = frame;
        this._roll=roll;
        this_score=score;
    }   
    
    getEvent(){

    }
    on:{
        action:
    }

}

module.exports = bowling;
