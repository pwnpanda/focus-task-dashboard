import { combineReducers } from 'redux';

const SET_NAME="SET_NAME";
const SET_SHOW="SET_SHOW";
const SET_END="SET_END";
const SET_ERR="SET_ERR";
const SET_WORK="SET_WORK";
const RESET="RESET";

function getDefaultState(){
    var showCalendar = false;
    var taskName = "";
    var startDate = new Date();
    var endDate = new Date();
    var currentDate = new Date();
    var missedDates = [];
    var toAndFromDates = [];
    var workDone = true;
    var error = "";

    var storage = localStorage.getItem("calendar");

    if (storage !== null){
        storage = JSON.parse(storage);
        
        showCalendar = true;
        taskName = storage.taskName;
        startDate = new Date(storage.startDate);
        endDate = new Date(storage.endDate);
        currentDate = new Date();
        missedDates = storage.missedDates.map( date => new Date(date));
        toAndFromDates = storage.toAndFromDates.map( date => new Date(date));
        workDone = storage.workDone;
      }

    return {
        "showCalendar": showCalendar,
        "taskName": taskName,
        "startDate": startDate,
        "endDate": endDate,
        "currentDate": currentDate,
        "missedDates": missedDates,
        "toAndFromDates": toAndFromDates,
        "workDone": workDone,
        "error": error
    }
}

export function setName(taskName){
    return {
        type: SET_NAME,
        taskName
    }
}

export function setShowCalendar(showCalendar){
    return {
        type: SET_SHOW,
        showCalendar
    }
}

export function setEndDate(endDate){
    return {
        type: SET_END,
        endDate
    }
}

export function setError(error){
    return {
        type: SET_ERR,
        error
    }
}
export function setWorkDone(workDone){
    return {
        type: SET_WORK,
        workDone
    }
}

export function doReset(){
    return {
        type: RESET,
        "":""
    }
}

let defaultState = getDefaultState();


function checkMissedDates(workDone, date, missedDates) {
;
    var tmpArr = [...missedDates];
    var today = date.toDateString();
    date = new Date( today );
    
    //console.log(`workDone ${workDone} - date: ${date} - missedDates: ${missedDates}`)

    
    if (missedDates.find( el => {return date.getTime() === el.getTime()} )) {
        // If the work has been done, remove from the list
        if (workDone){
          tmpArr = tmpArr.filter( item => {
            return item.getTime() !== date.getTime()
          });
        }
        //console.warn("After " + tmpArr);
    } else {
        // console.log(`Not in missedDates - Date: ${date} - MissedDates ${missedDates}`)
        // If today is not already in missed-array, add it
        if (!workDone) tmpArr.push(date);
    }

    return tmpArr;
}

function goalPlans(state=defaultState, action){
    switch (action.type){
        
        case SET_NAME:
            return {
                ...state,
                ["taskName"]: action.taskName
            };
        
        case SET_SHOW:
            return {
                ...state,
                ["showCalendar"]: action.showCalendar,
                ["error"]: ""
            };
        
        case SET_END:
            return {
                ...state,
                ["endDate"]: action.endDate,
                ["toAndFromDates"]: [state.startDate, action.endDate]
            };
        
        case SET_ERR:
            return {
                ...state,
                ["error"]: action.error
            };
        
        case SET_WORK:
            return {
                ...state,
                ["workDone"]: action.workDone,
                ["missedDates"]: checkMissedDates(action.workDone, state.currentDate, state.missedDates)
            }

        case RESET:
            return getDefaultState();

        default:
            return state;
    }
}

export const saveState = state => {
    //console.log(`state: ${JSON.stringify(state)} goalPlans: ${JSON.stringify(state.goalPlans)}`)
    localStorage.setItem("calendar", JSON.stringify(state.goalPlans))
}

const calendar = combineReducers({
    goalPlans
});

export default calendar;