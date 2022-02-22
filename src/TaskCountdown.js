import React, {useContext, useCallback, useState} from 'react'
import Button from 'react-bootstrap/esm/Button';
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { Calendar } from '@natscale/react-calendar';
import { TaskContext } from "./TaskContext";

const MyCalendar = () => {
    const { missedDates, calDates } = useContext(TaskContext);

    // isHighlight is not working and I dont know why... Maybe CSS?
    
    // Use dark mode, change up size and font size, use no range padding, select range (set artificially!) use disabled for missed and highlight for done
    return <Calendar useDarkMode showDualCalendar noPadRangeCell isRangeSelector size={600} fontSize={24} isDisabled={missedDates} value={calDates} />;
}

const TaskCountdown = () => {
    const {setShowCalendar , showCalendar, taskName, hidden, workDone, setWorkDone, toggleMissedDay} = useContext(TaskContext);

    const changeWorkDone = () => {
        setWorkDone( (prevState) => !prevState);
        // This call finishes before state is changed and gives wrong data TODO fix
        toggleMissedDay();
    }

    const onClick = () => {
        setShowCalendar(false)
    }

    return (
        <div  style={showCalendar === true ? null: hidden }>
            <Row>
                <Col>
                    <h2>{ taskName }</h2>
                </Col>
                <Col>
                    <Button onClick={onClick} className="btn btn-success">Reset</Button>
                </Col>
            </Row>
            <Row className='pad'>
                <Col xs lg="1"></Col>
                <Col xs lg="10">
                    < MyCalendar />
                </Col>
                <Col xs lg="1"></Col>
            </Row>
            <Row>
                <p>Did you do anything today?</p> <input type="checkbox" checked={workDone} onChange={changeWorkDone}></input>
            </Row>
        </div>

    )
}

export default TaskCountdown