import React from 'react'
import Button from 'react-bootstrap/esm/Button';
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { Calendar } from '@natscale/react-calendar';
import { useDispatch, useSelector } from 'react-redux'
import { doReset, setName, setShowCalendar, setWorkDone, setCurDate } from './redux-store';

const TaskCountdown = () => {

    var interval;

    const hidden = { display: "none" }
    const calendar = useSelector(state => state.goalPlans);
    const dispatch = useDispatch();

    //console.log(calendar);
    

    function updateDay(){
        dispatch( setCurDate( new Date() ) );
    }

    function setDailyRenew() {
        interval = setInterval( updateDay, 24*60*60*1000) 
    }

    // Set time to midnight at 1 past midnight the next day
    var timeToMidnight = new Date(
        calendar.currentDate.getFullYear(),
        calendar.currentDate.getMonth(),
        calendar.currentDate.getDate()+1,
        0, 1, 0, 0) - calendar.currentDate;
    
    //    console.log(`Hours: ${timeToMidnight/(60*60*1000)%24} - Minutes ${timeToMidnight/(60*1000)%60}`);
    // Set first date at the next date, then every 24 hours from then on
    const timeout = setTimeout( () => {
        updateDay();
        setDailyRenew(); }
        , timeToMidnight);

    const onClick = () => {
        dispatch ( setShowCalendar(false) );
        dispatch ( setName('') );
        localStorage.clear();
        dispatch( doReset() );
        clearTimeout(timeout);
        clearTimeout(interval);

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