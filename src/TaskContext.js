import  React, { createContext, useState, useContext } from 'react'

// https://devtrium.com/posts/how-use-react-context-pro#use-react-context-with-a-custom-hook
const TaskContext = createContext();

const TaskProvider = ({ children }) => {
 
  const getMidnight = date => {
    return new Date(date.setHours(0,0,0,0))
  }

  const [showCalendar, setShowCalendar] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState(getMidnight(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [curDate, setCurDate] = useState(new Date());
  const [taskNameError, setTaskNameError] = useState("");
  const [missedDates, setMissedDates] = useState([]);
  const [doneDates, setDoneDates] = useState([]);

  const hidden = { display: "none" }



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
    doneDates,
    setDoneDates,
    hidden,
    getMidnight
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
