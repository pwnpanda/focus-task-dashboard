import  React, { createContext, useState, useContext } from 'react'
import PropTypes from "prop-types";
import differenceInDays from 'date-fns/differenceInDays';

// https://devtrium.com/posts/how-use-react-context-pro#use-react-context-with-a-custom-hook
const TaskContext = createContext();

const TaskProvider = ({ children, allInitialDays }) => {
 
  const [showCalendar, setShowCalendar] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [curDate, setCurDate] = useState(new Date());
  const [allDays, setAllDays] = useState(allInitialDays);
  const [taskNameError, setTaskNameError] = useState("");

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
    allDays,
    setAllDays,
    taskNameError,
    setTaskNameError,
    hidden
  };


  return (
    <TaskContext.Provider value={taskContext}>
      {children}
    </TaskContext.Provider>
  )
}

TaskProvider.propTypes = {
  allInitialDays: PropTypes.array
};

TaskProvider.defaultProps = {
  allInitialDays: []
};

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




/*
export default class TaskProvider extends Component {
  state = {
    showCalendar: false,
    taskName: "exampleTask",
    endDate: new Date(),
    curDate: new Date(),
    startDate: new Date(),
    setEndDate: date => this.setState({
      endDate: date
    }),
    setCurDate: () => this.setState({
      curDate: new Date()
    }),
    setShowCalendar: bool => this.setState({
      showCalendar: bool
    }),
    setTaskName: newName => this.setState({
      taskName: newName
    })
  }
  render() {
    return (
      <TaskContext.Provider value={this.state}>
        {this.props.children}
      </TaskContext.Provider>
    )
  }
}*/