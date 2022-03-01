import  React, { createContext, useState, useContext, useCallback, useEffect } from 'react'
import { differenceInDays } from "date-fns"
// https://devtrium.com/posts/how-use-react-context-pro#use-react-context-with-a-custom-hook
const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  
  // Manually set rc_highlight on items based on being a button, and having the correct number? Gives underline!
  
  var showCalendarInit = false;
  var taskNameInit = "";
  var startDateInit = new Date();
  var endDateInit = new Date();
  var curDateInit = new Date();
  var missedDatesInit = [];
  var calDatesInit = [];
  var workDoneInit = true;

  var storage = localStorage.getItem("calendar");
  
  useEffect( () => {
    if ( storage !== null){
      storage = JSON.parse(storage);
      
      console.warn(storage);

      showCalendarInit = true;
      taskNameInit = storage.taskName;
      startDateInit = new Date(storage.startDate);
      endDateInit = new Date(storage.endDate);
      curDateInit = new Date(storage.curDate);
      missedDatesInit = storage.missedDates.map( date => new Date(date));
      calDatesInit = storage.calDates.map( date => new Date(date));
      workDoneInit = storage.workDone;
    }
  }, []);

  // Current callback-solution is not supported (in sub-files)!
  // Need to use componentDidMount and componentDidUpdate instead?

  // Would Redux help?

  const [showCalendar, setShowCalendar] = useState(showCalendarInit);
  const [taskName, setTaskName] = useState(taskNameInit);
  const [startDate, setStartDate] = useState(startDateInit);
  const [endDate, setEndDate] = useState(endDateInit);
  const [curDate, setCurDate] = useState(curDateInit);
  const [taskNameError, setTaskNameError] = useState("");
  const [missedDates, setMissedDates] = useState(missedDatesInit);
  const [calDates, setCalDates] = useState(calDatesInit);
  const [workDone, setWorkDone] = useState(workDoneInit);

  const hidden = { display: "none" }

  const getTmpDate = (fromDate, offset) => {
    console.log(5)

    let tamperDate = new Date(fromDate.getTime())
    tamperDate = tamperDate.setDate(tamperDate.getDate() + offset);
    tamperDate = new Date(tamperDate);
    return tamperDate;
  }

  const getCurValues = useCallback( ()  => {
    return {
      "taskName": taskName,
      "startDate": startDate,
      "endDate": endDate,
      "curDate": curDate,
      "missedDates": missedDates,
      "calDates": calDates,
      "workDone": workDone
    }
  }, [taskName, startDate, endDate, curDate, missedDates, calDates, workDone])

  const saveStorage = useCallback( () => {
    let store = getCurValues();
    localStorage.setItem("calendar", JSON.stringify(store));
  }, [getCurValues]);

  const updateAfterChange = () => {
   
    let curDayIndex = differenceInDays(curDate, startDate);

    let tmpDate = getTmpDate(startDate, curDayIndex);
    let tmpArray = [...missedDates];
    
    // CHECK!
    // If today is already in the missed-array
    if (tmpDate in tmpArray) {
      // If the work has been done, remove from the list
      //console.log("Before " + tmpArray);
      if (workDone){
        tmpArray.filter( item => {
          return item !== tmpDate
        });
      }
      //console.warn("After " + tmpArray);
    } else {
      // If today is not already in missed-array, add it
      if (!workDone) tmpArray.push(tmpDate);
    }
    
    setMissedDates(tmpArray);
    saveStorage();
  }

  const taskContext = {
    showCalendar,
    setShowCalendar,
    taskName, 
    setTaskName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    curDate,
    setCurDate,
    taskNameError,
    setTaskNameError,
    missedDates,
    setMissedDates,
    calDates,
    setCalDates,
    workDone,
    setWorkDone,
    hidden,
    saveStorage,
    updateAfterChange,
  };


  return (
    <TaskContext.Provider value={taskContext}>
      {children}
    </TaskContext.Provider>
  )
}

// context consumer hook
const useTaskContext = () => {
  // get the context
  const context = useContext(TaskContext);

  // if `undefined`, throw an error
  if (context === undefined) {
    throw new Error("useUserContext was used outside of its Provider");
  }

  return context;
};

export {TaskContext, TaskProvider, useTaskContext};
