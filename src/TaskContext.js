import  React, { createContext, useState, useContext } from 'react'
import { differenceInDays } from "date-fns"
// https://devtrium.com/posts/how-use-react-context-pro#use-react-context-with-a-custom-hook
const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [curDate, setCurDate] = useState(new Date());
  const [taskNameError, setTaskNameError] = useState("");
  const [missedDates, setMissedDates] = useState([]);
  const [calDates, setCalDates] = useState([]);
  const [workDone, setWorkDone] = useState(true);

  const hidden = { display: "none" }

  const getTmpDate = (fromDate, offset) => {
    let tamperDate = new Date(fromDate.getTime())
    tamperDate = tamperDate.setDate(tamperDate.getDate() + offset);
    tamperDate = new Date(tamperDate);
    return tamperDate;
  }

  const toggleMissedDay = () => {
    let curDayIndex = differenceInDays(curDate, startDate);
    console.log(curDayIndex);

    let tmpDate = getTmpDate(startDate, curDayIndex);
    let tmpArray = [...missedDates];
    console.log(workDone);
    if (!workDone) tmpArray.push(tmpDate);
    else tmpArray.filter( item => {
      return item!==tmpDate
    });
    
    setMissedDates(tmpArray);
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
    toggleMissedDay
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
