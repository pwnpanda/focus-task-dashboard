import React, {useContext, useCallback, useState} from 'react'
import Button from 'react-bootstrap/esm/Button';
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { Calendar } from '@natscale/react-calendar';
import { TaskContext } from "./TaskContext";

const MyCalendar = () => {
    const { startDate, endDate, missedDates, setMissedDates, doneDates, setDoneDates, } = useContext(TaskContext);
    const [dates, setDates] = useState([]);
    
    // Need to set state of dates dynamically:
    // It needs to be updated after showCalendar is set to True!
    // Maybe set it in CreateTaskContent and move state to TaskContext?
    // getMidnight from TaskContext is likely not needed (it is used in CreateTaskContent too)
    // isHighlight is not working and I dont know why... Maybe CSS?


    const onChange = useCallback(
        (val) => {
            setDates(val);
        },
        [setDates],
    );

    // Highlight dates
    const isHighlight = [endDate]

    // Disable dates
    const isDisabled = useCallback((date) => {
        // disable wednesdays
        if (date.getDay() === 3) {
          return true;
        }
      }, []);
    
    // Use dark mode, change up size and font size, use no range padding, select range (set artificially!) use disabled for missed and highlight for done
    // return <Calendar useDarkMode showDualCalendar size={600} fontSize={24} isMultiSelector isHighlight={isHighlight} isDisabled={isDisabled} value={value} />;
    return <Calendar useDarkMode showDualCalendar size={600} fontSize={24} isMultiSelector initialViewDate={startDate} isHighlight={isHighlight} isDisabled={isDisabled} value={dates} onChange={onChange} />;
}

const TaskCountdown = () => {
    const {setShowCalendar , showCalendar, taskName, hidden} = useContext(TaskContext);

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
            </Row>
        </div>

    )
}

export default TaskCountdown