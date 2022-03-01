import { combineReducers } from 'redux';

const SET_NAME="SET_NAME";
const SET_SHOW="SET_SHOW";
const SET_END="SET_END";
const SET_ERR="SET_ERR";
const SET_WORK="SET_WORK";

function defaultState(){
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
        
        console.warn(storage);
        
        showCalendar = true;
        taskName = storage.taskName;
        startDate = new Date(storage.startDate);
        endDate = new Date(storage.endDate);
        currentDate = new Date();
        missedDates = storage.missedDates.map( date => new Date(date));
        toAndFromDates = storage.calDates.map( date => new Date(date));
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

export function setName(goalPlan){
    return {
        type: SET_NAME,
        goalPlan
    }
}

export function setShowCalendar(goalPlan){
    return {
        type: SET_SHOW,
        goalPlan
    }
}
// not needed?
export function setEndDate(goalPlan){
    return {
        type: SET_END,
        goalPlan
    }
}

export function setError(goalPlan){
    return {
        type: SET_ERR,
        goalPlan
    }
}
export function setWorkDone(goalPlan){
    return {
        type: SET_WORK,
        goalPlan
    }
}

let defaultState = getDefaultState();

function checkMissedDates(workDone, date, missedDates) {
    var tmpArr = [...missedDates]
    if (date in missedDates) {
        // If the work has been done, remove from the list
        //console.log("Before " + missedDates);
        if (workDone){
          tmpArr = tmpArr.filter( item => {
            return item !== date
          });
        }
        //console.warn("After " + missedDates);
    } else {
        // If today is not already in missed-array, add it
        if (!workDone) tmpArr.push(date);
    }

    return tmpArr;
}

function goalPlan(state=defaultState, action){
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

        default:
            return state;
    }
}

const calendar = combineReducers({
    goalPlan
});

export default calendar;