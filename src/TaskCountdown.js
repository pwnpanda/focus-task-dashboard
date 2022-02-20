import React, {useContext} from 'react'
import Button from 'react-bootstrap/esm/Button';
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import { TaskContext } from "./TaskContext";

const TaskCountdown = () => {
    const {setShowCalendar , showCalendar, taskName, hidden} = useContext(TaskContext);

    const onClick = () => {
        setShowCalendar(false)
    }

    console.log("Show calendar 2 " + showCalendar)
    return (
        <Row style={showCalendar === true ? null: hidden }>
            <Col>
                <h3>{ taskName}</h3>
            </Col>
            <Col>
                <Button onClick={onClick} className="btn btn-success">Reset</Button>
            </Col>
        </Row>
    )
}

export default TaskCountdown