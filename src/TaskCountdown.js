import React from 'react'
import Button from 'react-bootstrap/esm/Button';
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { Calendar } from '@natscale/react-calendar';
import { useDispatch, useSelector } from 'react-redux'
import { setName, setShowCalendar, setWorkDone } from './redux-store';

const TaskCountdown = () => {

    const hidden = { display: "none" }

    const calendar = useSelector(state => state.goalPlans);
    const dispatch = useDispatch();

    console.log(calendar);

    const onClick = () => {
        dispatch ( setShowCalendar(false) );
        dispatch ( setName('') );
        localStorage.clear();
    }

    return (
        <div  style={calendar.showCalendar === true ? null: hidden }>
            <Row>
                <Col>
                    <h2>{ calendar.taskName }</h2>
                </Col>
                <Col>
                    <Button onClick={onClick} className="btn btn-success">Reset</Button>
                </Col>
            </Row>
            <Row className='pad'>
                <Col xs lg="1"></Col>
                <Col xs lg="10">
                    <Calendar useDarkMode showDualCalendar noPadRangeCell isRangeSelector size={600} fontSize={24} isDisabled={calendar.missedDates} value={calendar.toAndFromDates} />
                </Col>
                <Col xs lg="1"></Col>
            </Row>
            <Row>
                <p>Did you do anything today?</p> <input type="checkbox" checked={calendar.workDone} onChange={ () => dispatch( setWorkDone(!calendar.workDone) ) }></input>
            </Row>
        </div>

    )
}

export default TaskCountdown