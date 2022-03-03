import React from 'react'
import { useSelector } from 'react-redux';


const hidden = { display: "none" }


const CreateTaskHeader = () => {
    const calendar = useSelector(state => state.goalPlans);
    return (
        <h1 className="header p-5 mb-4 rounded-3" style={calendar.showCalendar === true ? hidden: null }>Task focus board</h1>
    )
}

export default CreateTaskHeader