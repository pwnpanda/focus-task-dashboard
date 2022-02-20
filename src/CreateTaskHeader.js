import React, { useContext } from 'react'
import { TaskContext } from "./TaskContext";

const CreateTaskHeader = () => {
    const {showCalendar, hidden} = useContext(TaskContext);
    return (
        <h1 className="header p-5 mb-4 rounded-3" style={showCalendar === true ? hidden: null }>Task focus board</h1>
    )
}

export default CreateTaskHeader